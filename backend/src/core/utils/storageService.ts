import fs from 'fs';
import path from 'path';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET, CDN_BASE } from '../config/s3';
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
    plantId: string,
    filename: string,
  ): Promise<UploadResult> {
    // Validate magic bytes
    const mime = validateImageMagicBytes(buffer);
    if (!mime) {
      throw new AppError('Invalid image format. Accepted: JPEG, PNG, WebP, HEIC', 400, 'INVALID_FORMAT');
    }

    const processed = await processImage(buffer);
    const basePath = `plants/${plantId}/images/${filename}`;

    const [thumbUrl, cardUrl, fullUrl] = await Promise.all([
      this.putObject(`${basePath}-thumb.webp`, processed.thumbnail, 'image/webp'),
      this.putObject(`${basePath}-card.webp`, processed.card, 'image/webp'),
      this.putObject(`${basePath}-full.webp`, processed.full, 'image/webp'),
    ]);

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
      await s3Client.send(
        new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      );
    } catch (error) {
      logger.error(`Failed to delete S3 object: ${key}`, error);
    }
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
    return getSignedUrl(s3Client, command, { expiresIn });
  }

  private async putObject(key: string, body: Buffer, contentType: string): Promise<string> {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000',
        }),
      );
      return `${CDN_BASE}/${key}`;
    } catch (err: any) {
      logger.warn(`S3 upload failed for ${key}, falling back to local file storage: ${err.message}`);
      const cleanKey = key.replace(/\\/g, '/');
      const localDir = path.join(process.cwd(), 'uploads', path.dirname(cleanKey));
      await fs.promises.mkdir(localDir, { recursive: true });
      const localFilePath = path.join(process.cwd(), 'uploads', cleanKey);
      await fs.promises.writeFile(localFilePath, body);
      return `/uploads/${cleanKey}`;
    }
  }
}

export const storageService = new StorageService();
