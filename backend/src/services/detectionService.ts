import Detection, { IDetection } from '../models/Detection';
import { DetectionStatus, PaginationMeta } from '../types';
import { AppError } from '../utils/apiResponse';
import { detectionQueue } from '../jobs/queues';
import { env } from '../config/env';
import mongoose from 'mongoose';

export class DetectionService {
  async createDetection(
    userId: string,
    imageUrl: string,
    imageThumbnailUrl?: string,
  ): Promise<IDetection> {
    const detection = await Detection.create({
      user: userId,
      imageUrl,
      imageThumbnailUrl: imageThumbnailUrl || null,
      status: DetectionStatus.PENDING,
      modelVersion: env.AI_MODEL_VERSION,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // Queue BullMQ job
    await detectionQueue.add('detect-plant', {
      jobId: detection._id.toString(),
      imageUrl,
      modelVersion: env.AI_MODEL_VERSION,
    });

    return detection;
  }

  async getDetection(jobId: string, userId: string): Promise<IDetection> {
    const detection = await Detection.findOne({ _id: jobId, user: userId })
      .populate('predictions.plant', 'commonName slug images')
      .populate('topMatch', 'commonName slug images scientificName');

    if (!detection) {
      throw new AppError('Detection not found', 404, 'NOT_FOUND');
    }

    return detection;
  }

  async getHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ detections: IDetection[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;
    const [detections, total] = await Promise.all([
      Detection.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('topMatch', 'commonName slug images')
        .lean(),
      Detection.countDocuments({ user: userId }),
    ]);

    return {
      detections: detections as unknown as IDetection[],
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async addFeedback(
    detectionId: string,
    reviewerId: string,
    data: { isCorrect: boolean; correctPlant?: string; notes?: string },
  ): Promise<IDetection> {
    const detection = await Detection.findByIdAndUpdate(
      detectionId,
      {
        $set: {
          feedback: {
            reviewer: new mongoose.Types.ObjectId(reviewerId),
            isCorrect: data.isCorrect,
            correctPlant: data.correctPlant
              ? new mongoose.Types.ObjectId(data.correctPlant)
              : undefined,
            notes: data.notes,
            reviewedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!detection) {
      throw new AppError('Detection not found', 404, 'NOT_FOUND');
    }

    return detection;
  }

  async getStats(): Promise<Record<string, unknown>> {
    const [totalDetections, completedDetections, accuracyStats] = await Promise.all([
      Detection.countDocuments(),
      Detection.countDocuments({ status: DetectionStatus.COMPLETE }),
      Detection.aggregate([
        { $match: { 'feedback.isCorrect': { $exists: true } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            correct: {
              $sum: { $cond: ['$feedback.isCorrect', 1, 0] },
            },
          },
        },
      ]),
    ]);

    const accuracy = accuracyStats[0]
      ? ((accuracyStats[0].correct / accuracyStats[0].total) * 100).toFixed(2)
      : 0;

    return {
      totalDetections,
      completedDetections,
      reviewedDetections: accuracyStats[0]?.total || 0,
      accuracyPercent: accuracy,
    };
  }
}

export const detectionService = new DetectionService();
