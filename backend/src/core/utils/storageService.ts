import {
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { processImage, processAvatar, validateImageMagicBytes } from '../utils/imageProcessor';
import { AppError } from '../utils/apiResponse';
import { logger } from './logger';
import { userAvatarKey, scanKey, publicUrl } from '../storage/assetKeys';
import { putImage } from '../storage/r2Storage';

interface UploadResult {
  url: string;
  thumbnailUrl: string;
  cardUrl: string;
  fullUrl: string;
  lqip: string;
  width: number;
  height: number;
}

export class StorageService {
  async uploadPlantImage(
    buffer: Buffer,
    plantSlug: string,
    filename?: string,
  ): Promise<UploadResult> {
    // Validate magic bytes
    const mime = validateImageMagicBytes(buffer);
    if (!mime) {
      throw new AppError('Invalid image format. Accepted: JPEG, PNG, WebP, HEIC', 400, 'INVALID_FORMAT');
    }

    const processed = await processImage(buffer);
    const namePart = filename || plantSlug;
    const primaryKey = `plants/images/${namePart}.webp`;

    const fullUrl = await this.putObject(primaryKey, processed.full, 'image/webp');
    const thumbUrl = await this.putObject(`plants/images/${namePart}-thumb.webp`, processed.thumbnail, 'image/webp');
    const cardUrl = await this.putObject(`plants/images/${namePart}-card.webp`, processed.card, 'image/webp');

    return {
      url: fullUrl,
      thumbnailUrl: thumbUrl,
      cardUrl: cardUrl,
      fullUrl: fullUrl,
      lqip: processed.lqip,
      width: processed.width,
      height: processed.height,
    };
  }

  async uploadAvatar(buffer: Buffer, userId: string): Promise<string> {
    const mime = validateImageMagicBytes(buffer);
    if (!mime) {
      throw new AppError('Invalid image format', 400, 'INVALID_FORMAT');
    }

    const processed = await processAvatar(buffer);
    const key = userAvatarKey(userId);

    await putImage({ key, buffer: processed, contentType: 'image/webp', isImmutable: false });
    return publicUrl(key, Date.now());
  }

  async uploadDetectionImage(buffer: Buffer, jobId: string): Promise<string> {
    const mime = validateImageMagicBytes(buffer);
    if (!mime) {
      throw new AppError('Invalid image format', 400, 'INVALID_FORMAT');
    }

    const key = scanKey(jobId, jobId);
    await putImage({ key, buffer, contentType: mime, isImmutable: true });
    return publicUrl(key);
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const { deleteObject } = await import('../storage/r2Storage');
      await deleteObject(key);
    } catch (error) {
      logger.error(`Failed to delete storage object: ${key}`, error);
    }
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const { getR2Client } = await import('../storage/r2Storage');
    const { env } = await import('../config/env');
    const client = getR2Client();
    const bucket = env.R2_BUCKET_NAME || env.AWS_S3_BUCKET;
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(client as any, command, { expiresIn });
  }

  private async putObject(key: string, body: Buffer, contentType: string): Promise<string> {
    return putImage({
      key,
      buffer: body,
      contentType,
      isImmutable: true,
    });
  }
}

export const storageService = new StorageService();
