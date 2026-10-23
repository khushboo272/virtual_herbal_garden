import sharp from 'sharp';
import mongoose from 'mongoose';
import Detection, { IDetection } from './Detection.model';
import { DetectionStatus, PaginationMeta } from '../../types';
import { AppError } from '../../core/utils/apiResponse';
import { env } from '../../core/config/env';
import { identifyPlant } from './gemini.client';
import { logger } from '../../core/utils/logger';
import { scanKey } from '../../core/storage/assetKeys';
import { putImage } from '../../core/storage/r2Storage';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_LONG_SIDE_PX = 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Build the canonical response shape expected by the API spec
function buildDetectionResponse(detection: IDetection & { _id: mongoose.Types.ObjectId }) {
  const gr = detection.geminiResult;
  return {
    id: detection._id,
    status: detection.status,
    isPlant: gr?.isPlant ?? null,
    topMatch: detection.geminiResult
      ? {
          commonName: detection.predictions[0]?.commonName ?? '',
          scientificName: '',
          family: '',
          confidence: detection.predictions[0]?.confidence ?? 0,
        }
      : null,
    description: gr?.description ?? null,
    medicinalUses: gr?.medicinalUses ?? [],
    keyBenefits: gr?.keyBenefits ?? [],
    partsUsed: gr?.partsUsed ?? [],
    precautions: gr?.precautions ?? [],
    alternatives: gr?.alternatives ?? [],
    imageQualityNote: gr?.imageQualityNote ?? null,
    plantSlug: gr?.plantSlug ?? null,
    plantId: gr?.plantId ?? null,
    imageUrl: detection.imageUrl,
    processingTimeMs: detection.processingTimeMs,
    createdAt: detection.createdAt,
  };
}

export class DetectionService {
  /**
   * Validate, resize, call Gemini, save, and return a completed detection
   * in a single synchronous request cycle. No queue, no polling.
   */
  async detect(userId: string, fileBuffer: Buffer, mimeType: string): Promise<ReturnType<typeof buildDetectionResponse>> {
    // 1. Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new AppError('Invalid image format. Accepted: JPEG, PNG, WebP', 400, 'INVALID_FORMAT');
    }

    // 2. Validate size
    if (fileBuffer.length > MAX_SIZE_BYTES) {
      throw new AppError('Image exceeds 5 MB limit', 400, 'FILE_TOO_LARGE');
    }

    // 3. Resize to max 1024 px on the long side and convert to JPEG
    const resizedBuffer = await sharp(fileBuffer)
      .resize(MAX_LONG_SIDE_PX, MAX_LONG_SIDE_PX, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    // 4. Create detection record with PROCESSING status
    const detection = await Detection.create({
      user: userId,
      imageUrl: '', // placeholder until storage resolves
      status: DetectionStatus.PROCESSING,
      modelVersion: env.GEMINI_MODEL,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days TTL
    });

    const detectionId = (detection._id as mongoose.Types.ObjectId).toString();
    const startTime = Date.now();

    // 5. Store original image to R2 — with BUG-004 data URL fallback if storage fails
    let imageUrl = '';
    let imageThumbnailUrl: string | null = null;
    try {
      const key = scanKey(userId || 'anonymous', detectionId);
      imageUrl = await putImage({
        key,
        buffer: fileBuffer,
        contentType: mimeType,
        isImmutable: true,
      });
      await Detection.findByIdAndUpdate(detectionId, { imageUrl });
    } catch (storageErr) {
      logger.warn('[DetectionService] Storage unavailable, generating data URL fallback:', storageErr);
      const thumbBuf = await sharp(fileBuffer)
        .resize(256, 256, { fit: 'cover' })
        .jpeg({ quality: 75 })
        .toBuffer();
      const dataUrl = `data:image/jpeg;base64,${thumbBuf.toString('base64')}`;
      imageUrl = dataUrl;
      imageThumbnailUrl = dataUrl;
      await Detection.findByIdAndUpdate(detectionId, { imageUrl, imageThumbnailUrl });
    }

    // 6. Call Gemini
    let geminiResult;
    try {
      geminiResult = await identifyPlant(resizedBuffer, 'image/jpeg');
    } catch (err) {
      // Always update detection to FAILED before re-throwing
      await Detection.findByIdAndUpdate(detectionId, {
        status: DetectionStatus.FAILED,
        imageUrl,
        errorMessage: err instanceof AppError ? err.message : 'Gemini call failed',
      });
      throw err;
    }

    const processingTimeMs = Date.now() - startTime;

    // 7. Look up the Plant library by scientificName (case-insensitive)
    let plantSlug: string | null = null;
    let plantId: string | null = null;
    if (geminiResult.isPlant && geminiResult.scientificName) {
      const Plant = (await import('../library/Plant.model')).default;
      const match = await Plant.findOne({
        $or: [
          { scientificName: { $regex: `^${geminiResult.scientificName}$`, $options: 'i' } },
          { commonName: { $regex: `^${geminiResult.commonName}$`, $options: 'i' } },
        ],
        isDeleted: false,
      }).select('slug _id').lean();

      if (match) {
        plantSlug = match.slug as string;
        plantId = (match._id as mongoose.Types.ObjectId).toString();
      }
    }

    // 8. Build predictions array (top match + alternatives)
    const predictions = [];
    if (geminiResult.isPlant) {
      // Top prediction — plant ref is null since we identified by name not DB id
      // We store the name and confidence; plant ref is only set if we found it in the library
      const topPrediction = {
        plant: plantId ? new mongoose.Types.ObjectId(plantId) : new mongoose.Types.ObjectId(),
        confidence: geminiResult.confidence,
        rank: 1,
        commonName: geminiResult.commonName,
      };
      predictions.push(topPrediction);

      geminiResult.alternatives.forEach((alt, idx) => {
        predictions.push({
          plant: new mongoose.Types.ObjectId(),
          confidence: alt.confidence,
          rank: idx + 2,
          commonName: alt.commonName,
        });
      });
    }

    // 9. Update detection to COMPLETE
    const updated = await Detection.findByIdAndUpdate(
      detectionId,
      {
        status: DetectionStatus.COMPLETE,
        imageUrl,
        predictions,
        topMatch: plantId ? new mongoose.Types.ObjectId(plantId) : null,
        processingTimeMs,
        modelVersion: env.GEMINI_MODEL,
        geminiResult: {
          isPlant: geminiResult.isPlant,
          description: geminiResult.description,
          medicinalUses: geminiResult.medicinalUses,
          keyBenefits: geminiResult.keyBenefits,
          partsUsed: geminiResult.partsUsed,
          precautions: geminiResult.precautions,
          alternatives: geminiResult.alternatives,
          imageQualityNote: geminiResult.imageQualityNote,
          plantSlug,
          plantId,
        },
      },
      { new: true },
    );

    if (!updated) {
      throw new AppError('Failed to save detection result', 500, 'INTERNAL_ERROR');
    }

    logger.info(`[DetectionService] Detection ${detectionId} complete in ${processingTimeMs}ms`);

    return buildDetectionResponse(updated as IDetection & { _id: mongoose.Types.ObjectId });
  }

  async getDetection(jobId: string, userId: string): Promise<ReturnType<typeof buildDetectionResponse>> {
    const detection = await Detection.findOne({ _id: jobId, user: userId });
    if (!detection) {
      throw new AppError('Detection not found', 404, 'NOT_FOUND');
    }
    return buildDetectionResponse(detection as IDetection & { _id: mongoose.Types.ObjectId });
  }

  async getHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ detections: ReturnType<typeof buildDetectionResponse>[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;
    const filter = { user: userId, status: DetectionStatus.COMPLETE };
    const [detections, total] = await Promise.all([
      Detection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Detection.countDocuments(filter),
    ]);

    return {
      detections: detections.map((d) =>
        buildDetectionResponse(d as unknown as IDetection & { _id: mongoose.Types.ObjectId }),
      ),
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
            correctPlant: data.correctPlant ? new mongoose.Types.ObjectId(data.correctPlant) : undefined,
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
