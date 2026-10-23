import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { publicUrl } from './assetKeys';

let cachedClient: S3Client | null = null;

function getEndpoint(): string | undefined {
  if (env.R2_ENDPOINT) {
    return env.R2_ENDPOINT;
  }
  if (env.R2_ACCOUNT_ID) {
    return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
  return undefined;
}

export function isR2Configured(): boolean {
  const hasCreds = Boolean(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY);
  const hasEndpoint = Boolean(getEndpoint());
  const hasBucket = Boolean(env.R2_BUCKET_NAME);
  return hasCreds && hasEndpoint && hasBucket;
}

export function getR2Client(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  const endpoint = getEndpoint();
  if (!isR2Configured() || !endpoint) {
    // If R2 is not fully configured, fallback to S3 or dummy client to prevent crash
    cachedClient = new S3Client({
      region: env.AWS_REGION || 'auto',
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID || 'dummy-key',
        secretAccessKey: env.R2_SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY || 'dummy-secret',
      },
      endpoint: endpoint || undefined,
    });
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });

  return cachedClient;
}

export interface PutImageOptions {
  key: string;
  buffer: Buffer;
  contentType: string;
  isImmutable?: boolean;
}

/**
 * Uploads an image buffer to Cloudflare R2 / S3.
 * Automatically applies long-lived cache headers for immutable assets.
 */
export async function putImage(options: PutImageOptions): Promise<string> {
  const { key, buffer, contentType, isImmutable = true } = options;
  const client = getR2Client();
  const bucket = env.R2_BUCKET_NAME || env.AWS_S3_BUCKET;

  if (!bucket) {
    throw new Error('No storage bucket configured (R2_BUCKET_NAME or AWS_S3_BUCKET is required)');
  }

  const cacheControl = isImmutable
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=3600';

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );

  return publicUrl(key);
}

/**
 * Deletes an object from storage by key.
 */
export async function deleteObject(key: string): Promise<void> {
  try {
    const client = getR2Client();
    const bucket = env.R2_BUCKET_NAME || env.AWS_S3_BUCKET;
    if (!bucket) return;

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch (err: any) {
    logger.warn(`Failed to delete object from storage: ${key}`, { error: err.message });
  }
}

/**
 * Checks whether an object exists at the specified key.
 */
export async function headObject(key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const bucket = env.R2_BUCKET_NAME || env.AWS_S3_BUCKET;
    if (!bucket) return false;

    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    logger.warn(`headObject check failed for key ${key}: ${err.message}`);
    return false;
  }
}

export interface R2HealthStatus {
  configured: boolean;
  reachable: boolean;
  bucket: string;
  publicUrl: string;
  message: string;
}

/**
 * Probes Cloudflare R2 connectivity and permissions.
 */
export async function checkR2Health(): Promise<R2HealthStatus> {
  const bucket = env.R2_BUCKET_NAME || env.AWS_S3_BUCKET || '';
  const publicBase = env.R2_PUBLIC_URL || env.CDN_BASE_URL || '';

  if (!isR2Configured()) {
    return {
      configured: false,
      reachable: false,
      bucket,
      publicUrl: publicBase,
      message: 'Cloudflare R2 is not configured in environment variables (R2_ENDPOINT/R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME). Falling back to themed placeholders.',
    };
  }

  try {
    const client = getR2Client();
    // 1. Probe bucket existence / access
    await client.send(new HeadBucketCommand({ Bucket: bucket }));

    // 2. Test write/delete permission with temporary health-check probe
    const probeKey = `_system/health-check-${Date.now()}.txt`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: probeKey,
        Body: Buffer.from('health-check-ok'),
        ContentType: 'text/plain',
      })
    );
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: probeKey,
      })
    );

    return {
      configured: true,
      reachable: true,
      bucket,
      publicUrl: publicBase,
      message: 'Cloudflare R2 storage is configured, connected, and write/delete verified successfully.',
    };
  } catch (err: any) {
    return {
      configured: true,
      reachable: false,
      bucket,
      publicUrl: publicBase,
      message: `R2 connection failed: ${err.message}. Check credentials, endpoint, and bucket permissions. Falling back to themed placeholders.`,
    };
  }
}
