import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client } from '../core/storage/r2Storage';
import { env } from '../core/config/env';

export const uploadToR2 = async (
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> => {
  const client = getR2Client();
  const bucket = env.R2_BUCKET_NAME || env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error('No storage bucket configured (R2_BUCKET_NAME is required)');
  }

  const cleanKey = key.replace(/^\/+/, '');

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  const publicBase = (
    env.R2_PUBLIC_URL ||
    env.CDN_BASE_URL ||
    'https://pub-f64898458710437f99f8cc11e38ea63a.r2.dev'
  ).replace(/\/+$/, '');

  return `${publicBase}/${cleanKey}`;
};

export const deleteFromR2 = async (key: string): Promise<void> => {
  const client = getR2Client();
  const bucket = env.R2_BUCKET_NAME || env.AWS_S3_BUCKET;
  if (!bucket) return;

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key.replace(/^\/+/, ''),
    })
  );
};
