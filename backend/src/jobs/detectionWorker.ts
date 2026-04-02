import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { env } from '../config/env';
import Detection from '../models/Detection';
import { DetectionStatus } from '../types';
import { logger } from '../utils/logger';

interface DetectionJobData {
  jobId: string;
  imageUrl: string;
  modelVersion: string;
}

const isMock = env.REDIS_URL === 'redis://localhost:6379' || env.REDIS_URL.includes('mock');

const detectionWorker = isMock ? null : new Worker(
  'detection',
  async (job: Job<DetectionJobData>) => {
    const { jobId, imageUrl, modelVersion } = job.data;
    logger.info(`Processing detection job: ${jobId}`);

    try {
      // Update status to PROCESSING
      await Detection.findByIdAndUpdate(jobId, { status: DetectionStatus.PROCESSING });

      const startTime = Date.now();

      // Call Python AI microservice
      const response = await fetch(`${env.AI_SERVICE_URL}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, modelVersion, jobId }),
      });

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      const result = await response.json() as {
        predictions: Array<{
          plantId: string;
          confidence: number;
          rank: number;
          commonName: string;
        }>;
      };

      const processingTimeMs = Date.now() - startTime;

      // Update detection with results
      await Detection.findByIdAndUpdate(jobId, {
        status: DetectionStatus.COMPLETE,
        predictions: result.predictions.map((p) => ({
          plant: p.plantId,
          confidence: p.confidence,
          rank: p.rank,
          commonName: p.commonName,
        })),
        topMatch: result.predictions[0]?.plantId || null,
        processingTimeMs,
      });

      logger.info(`Detection ${jobId} complete in ${processingTimeMs}ms`);
    } catch (error) {
      logger.error(`Detection ${jobId} failed:`, error);
      await Detection.findByIdAndUpdate(jobId, {
        status: DetectionStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

if (detectionWorker) {
  detectionWorker.on('failed', (job, err) => {
    logger.error(`Detection job ${job?.id} failed:`, err);
  });
}

export default detectionWorker;
