import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const isMock = env.REDIS_URL === 'redis://localhost:6379' || env.REDIS_URL.includes('mock');

class MockQueue {
  constructor(public name: string) {}
  async add(name: string, data: any) {
    logger.info(`[MockQueue:${this.name}] Added job ${name}`);
    return { id: 'mock-job-id', name, data };
  }
}

export const detectionQueue = isMock 
  ? new MockQueue('detection') as unknown as Queue
  : new Queue('detection', {
      connection: redis,
      defaultJobOptions: { attempts: 3 },
    });

export const emailQueue = isMock
  ? new MockQueue('email') as unknown as Queue
  : new Queue('email', {
      connection: redis,
      defaultJobOptions: { attempts: 3 },
    });
