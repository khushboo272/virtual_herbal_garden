import {
  ListObjectsV2Command,
  HeadObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Response } from 'express';
import { getR2Client, isR2Configured } from '../../../core/storage/r2Storage';
import { env } from '../../../core/config/env';
import { AppError } from '../../../core/errors/AppError';
import { UserRole } from '../../../types';
import {
  normalizeKey,
  assertPrefixWriteAllowed,
} from '../storage.security';
import {
  IStorageItem,
  IStorageFolder,
  IListStorageResponse,
  IBucketStats,
  IPresignUploadResponse,
} from '../types';
import StorageTrash from '../models/StorageTrash.model';
import Plant from '../../library/Plant.model';
import Remedy from '../../remedies/Remedy.model';
import Tour from '../../tours/Tour.model';

interface CachedBucketStats {
  stats: IBucketStats;
  expiresAt: number;
}

let bucketStatsCache: CachedBucketStats | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class StorageService {
  private get bucket(): string {
    const b = env.R2_BUCKET_NAME || env.AWS_S3_BUCKET;
    if (!b) {
      throw new AppError('R2 Storage Bucket name is not configured', 500);
    }
    return b;
  }

  private get publicBaseUrl(): string {
    return (
      process.env.R2_PUBLIC_URL ||
      env.CDN_BASE_URL ||
      'https://cdn.virtualherbalgarden.org'
    ).replace(/\/+$/, '');
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${normalizeKey(key)}`;
  }

  /**
   * Lists folders and files at a given prefix using S3 delimiter '/'
   */
  async list(
    prefix = '',
    delimiter = '/',
    cursor?: string,
    limit = 100,
    userRole: string = UserRole.ADMIN,
  ): Promise<IListStorageResponse> {
    const client = getR2Client();
    const cleanPrefix = prefix ? normalizeKey(prefix) : '';
    // Ensure prefix ending with slash for directories
    const searchPrefix =
      cleanPrefix && !cleanPrefix.endsWith('/') ? `${cleanPrefix}/` : cleanPrefix;

    if (!isR2Configured()) {
      return {
        prefix: searchPrefix,
        folders: [],
        items: [],
        isTruncated: false,
      };
    }

    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: searchPrefix,
      Delimiter: delimiter,
      ContinuationToken: cursor || undefined,
      MaxKeys: Math.min(Math.max(limit, 1), 1000),
    });

    const output = await client.send(command);

    // Filter folders (hide backups/ from non-superadmin)
    const folders: IStorageFolder[] = [];
    if (output.CommonPrefixes) {
      for (const cp of output.CommonPrefixes) {
        if (!cp.Prefix) continue;
        if (cp.Prefix.startsWith('backups/') && userRole !== UserRole.SUPER_ADMIN) {
          continue;
        }
        const parts = cp.Prefix.replace(/\/+$/, '').split('/');
        const folderName = parts[parts.length - 1];
        folders.push({
          prefix: cp.Prefix,
          name: folderName,
        });
      }
    }

    // Filter files (hide .keep markers, hide backups/ from non-superadmin)
    const rawItems = output.Contents || [];
    const filteredContents = rawItems.filter((obj) => {
      if (!obj.Key) return false;
      if (obj.Key.endsWith('/')) return false; // folder marker
      if (obj.Key.endsWith('.keep')) return false; // zero-byte keep file
      if (obj.Key.startsWith('backups/') && userRole !== UserRole.SUPER_ADMIN) {
        return false;
      }
      return true;
    });

    // Resolve DB usage in parallel for all keys in this view
    const keys = filteredContents.map((c) => c.Key!);
    const dbRefsMap = await this.batchFindDbReferences(keys);

    const items: IStorageItem[] = filteredContents.map((obj) => {
      const key = obj.Key!;
      const keyParts = key.split('/');
      const fileName = keyParts[keyParts.length - 1];
      const refs = dbRefsMap.get(key) || [];

      return {
        key,
        name: fileName,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag?.replace(/"/g, ''),
        contentType: this.guessMimeType(key),
        publicUrl: this.getPublicUrl(key),
        isFolder: false,
        dbUsageCount: refs.length,
        dbReferences: refs,
      };
    });

    return {
      prefix: searchPrefix,
      folders,
      items,
      nextCursor: output.NextContinuationToken,
      isTruncated: Boolean(output.IsTruncated),
      totalCount: items.length + folders.length,
    };
  }

  /**
   * Stat / Head single object
   */
  async stat(key: string): Promise<IStorageItem> {
    const cleanKey = normalizeKey(key);
    const client = getR2Client();

    const output = await client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      }),
    );

    const refs = (await this.batchFindDbReferences([cleanKey])).get(cleanKey) || [];
    const parts = cleanKey.split('/');

    return {
      key: cleanKey,
      name: parts[parts.length - 1],
      size: output.ContentLength || 0,
      lastModified: output.LastModified || new Date(),
      etag: output.ETag?.replace(/"/g, ''),
      contentType: output.ContentType || this.guessMimeType(cleanKey),
      publicUrl: this.getPublicUrl(cleanKey),
      isFolder: false,
      dbUsageCount: refs.length,
      dbReferences: refs,
    };
  }

  /**
   * Copy an object inside the bucket
   */
  async copy(sourceKey: string, destKey: string, userRole: string): Promise<void> {
    const src = normalizeKey(sourceKey);
    const dst = normalizeKey(destKey);
    assertPrefixWriteAllowed(dst, userRole);

    const client = getR2Client();
    await client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${src}`,
        Key: dst,
      }),
    );
  }

  /**
   * Move / Rename an object
   */
  async move(sourceKey: string, destKey: string, userRole: string): Promise<void> {
    await this.copy(sourceKey, destKey, userRole);
    const client = getR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: normalizeKey(sourceKey),
      }),
    );
  }

  /**
   * Delete object: moves to trash/ for ADMIN; permanent delete if requested by SUPER_ADMIN
   */
  async delete(
    key: string,
    permanent: boolean,
    userId: string,
    userRole: string,
  ): Promise<{ action: 'TRASHED' | 'PERMANENTLY_DELETED'; key: string; trashKey?: string }> {
    const cleanKey = normalizeKey(key);

    if (permanent) {
      if (userRole !== UserRole.SUPER_ADMIN && userRole !== 'SUPER_ADMIN') {
        throw new AppError('Permanent deletion is restricted to SUPER_ADMIN', 403);
      }

      if (isR2Configured()) {
        const client = getR2Client();
        await client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: cleanKey,
          }),
        );
      }

      await StorageTrash.deleteMany({ originalKey: cleanKey });
      return { action: 'PERMANENTLY_DELETED', key: cleanKey };
    }

    // Soft delete to trash/<YYYYMMDD>/<cleanKey>
    assertPrefixWriteAllowed(cleanKey, userRole);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const trashKey = `trash/${dateStr}/${cleanKey}`;

    const refs = (await this.batchFindDbReferences([cleanKey])).get(cleanKey) || [];

    if (isR2Configured()) {
      try {
        const client = getR2Client();
        await client.send(
          new CopyObjectCommand({
            Bucket: this.bucket,
            CopySource: `${this.bucket}/${cleanKey}`,
            Key: trashKey,
          }),
        );
        await client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: cleanKey,
          }),
        );
      } catch (err: any) {
        if (err.name !== 'NoSuchKey' && !err.message?.includes('does not exist')) {
          throw err;
        }
      }
    }

    await StorageTrash.create({
      originalKey: cleanKey,
      trashKey,
      deletedBy: userId,
      deletedAt: new Date(),
      dbRefsSnapshot: refs,
    });

    return { action: 'TRASHED', key: cleanKey, trashKey };
  }

  /**
   * Delete multiple objects
   */
  async deleteMany(
    keys: string[],
    permanent: boolean,
    userId: string,
    userRole: string,
  ): Promise<{ deleted: number; keys: string[] }> {
    let deletedCount = 0;
    const handledKeys: string[] = [];

    for (const key of keys.slice(0, 1000)) {
      try {
        await this.delete(key, permanent, userId, userRole);
        deletedCount++;
        handledKeys.push(key);
      } catch (err) {
        // continue batch
      }
    }

    return { deleted: deletedCount, keys: handledKeys };
  }

  /**
   * Delete folder / prefix
   */
  async deletePrefix(
    folderPrefix: string,
    permanent: boolean,
    userId: string,
    userRole: string,
  ): Promise<number> {
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== 'SUPER_ADMIN') {
      throw new AppError('Deleting entire folders is restricted to SUPER_ADMIN', 403);
    }

    const cleanPrefix = normalizeKey(folderPrefix);
    const prefixWithSlash = cleanPrefix.endsWith('/') ? cleanPrefix : `${cleanPrefix}/`;

    const client = getR2Client();
    let continuationToken: string | undefined;
    let deletedCount = 0;

    do {
      const listRes = await client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefixWithSlash,
          ContinuationToken: continuationToken,
        }),
      );

      const toDelete = (listRes.Contents || []).map((o) => ({ Key: o.Key! }));
      if (toDelete.length > 0) {
        if (permanent) {
          await client.send(
            new DeleteObjectsCommand({
              Bucket: this.bucket,
              Delete: { Objects: toDelete },
            }),
          );
        } else {
          for (const item of toDelete) {
            await this.delete(item.Key, false, userId, userRole);
          }
        }
        deletedCount += toDelete.length;
      }

      continuationToken = listRes.NextContinuationToken;
    } while (continuationToken);

    return deletedCount;
  }

  /**
   * Create folder via zero-byte .keep file
   */
  async createFolder(folderPath: string, userRole: string): Promise<string> {
    const cleanFolder = normalizeKey(folderPath);
    const folderWithSlash = cleanFolder.endsWith('/') ? cleanFolder : `${cleanFolder}/`;
    assertPrefixWriteAllowed(folderWithSlash, userRole);

    const keepKey = `${folderWithSlash}.keep`;
    if (isR2Configured()) {
      const client = getR2Client();
      await client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: keepKey,
          Body: Buffer.alloc(0),
          ContentType: 'text/plain',
        }),
      );
    }

    return folderWithSlash;
  }

  /**
   * Presign Direct Upload URL for Browser PUT
   */
  async presignUpload(
    key: string,
    contentType: string,
    _sizeBytes: number,
    userRole: string,
  ): Promise<IPresignUploadResponse> {
    const cleanKey = normalizeKey(key);
    assertPrefixWriteAllowed(cleanKey, userRole);

    // If file already exists, create safety snapshot in trash before overwrite
    if (isR2Configured()) {
      try {
        const client = getR2Client();
        await client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: cleanKey }));
        // Object exists: copy to trash safety snapshot
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const trashKey = `trash/${dateStr}/replaced-${cleanKey}`;
        await client.send(
          new CopyObjectCommand({
            Bucket: this.bucket,
            CopySource: `${this.bucket}/${cleanKey}`,
            Key: trashKey,
          }),
        );
      } catch {
        // Doesn't exist, proceed
      }
    }

    const publicUrl = this.getPublicUrl(cleanKey);

    if (!isR2Configured()) {
      return {
        uploadUrl: `/api/admin/storage/local-upload-mock?key=${encodeURIComponent(cleanKey)}`,
        publicUrl,
        key: cleanKey,
      };
    }

    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    const uploadUrl = await getSignedUrl(client as any, command, { expiresIn: 900 });

    return {
      uploadUrl,
      publicUrl,
      key: cleanKey,
    };
  }

  /**
   * Presign temporary download URL
   */
  async presignDownload(key: string, ttlSeconds = 300): Promise<string> {
    const cleanKey = normalizeKey(key);
    if (!isR2Configured()) {
      return this.getPublicUrl(cleanKey);
    }

    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
    });

    return getSignedUrl(client as any, command, { expiresIn: ttlSeconds });
  }

  /**
   * Update object metadata
   */
  async updateMetadata(
    key: string,
    updates: {
      contentType?: string;
      cacheControl?: string;
      contentDisposition?: string;
      customMetadata?: Record<string, string>;
    },
    userRole: string,
  ): Promise<void> {
    const cleanKey = normalizeKey(key);
    assertPrefixWriteAllowed(cleanKey, userRole);

    const client = getR2Client();
    await client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${cleanKey}`,
        Key: cleanKey,
        ContentType: updates.contentType,
        CacheControl: updates.cacheControl,
        ContentDisposition: updates.contentDisposition,
        Metadata: updates.customMetadata,
        MetadataDirective: 'REPLACE',
      }),
    );
  }

  /**
   * Scan bucket statistics & usage breakdown
   */
  async getBucketInfo(forceRescan = false): Promise<IBucketStats> {
    const now = Date.now();
    if (!forceRescan && bucketStatsCache && now < bucketStatsCache.expiresAt) {
      return bucketStatsCache.stats;
    }

    const limit10Gb = 10 * 1024 * 1024 * 1024; // 10 GB Free Tier
    const warningThreshold = 8 * 1024 * 1024 * 1024; // 8 GB Warning

    let totalObjects = 0;
    let totalBytes = 0;
    const perFolderUsage: Record<string, { objects: number; bytes: number }> = {};

    if (isR2Configured()) {
      const client = getR2Client();
      let continuationToken: string | undefined;

      do {
        const res = await client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            ContinuationToken: continuationToken,
          }),
        );

        for (const item of res.Contents || []) {
          if (!item.Key || item.Key.endsWith('.keep')) continue;
          const size = item.Size || 0;
          totalObjects++;
          totalBytes += size;

          const topFolder = item.Key.split('/')[0] || 'root';
          if (!perFolderUsage[topFolder]) {
            perFolderUsage[topFolder] = { objects: 0, bytes: 0 };
          }
          perFolderUsage[topFolder].objects++;
          perFolderUsage[topFolder].bytes += size;
        }

        continuationToken = res.NextContinuationToken;
      } while (continuationToken);
    }

    const stats: IBucketStats = {
      totalObjects,
      totalBytes,
      perFolderUsage,
      freeTierLimitBytes: limit10Gb,
      freeTierWarningThresholdBytes: warningThreshold,
      lastScannedAt: new Date(),
    };

    bucketStatsCache = {
      stats,
      expiresAt: now + CACHE_TTL_MS,
    };

    return stats;
  }

  /**
   * Streams a ZIP of selected keys to the response
   */
  async streamZipArchive(keys: string[], res: Response): Promise<void> {
    const archiverModule = await import('archiver');
    const archiver = (archiverModule.default || archiverModule) as any;
    const client = getR2Client();
    const archive = archiver('zip', { zlib: { level: 6 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="storage-export.zip"');

    archive.pipe(res);

    for (const key of keys.slice(0, 200)) {
      try {
        const cleanKey = normalizeKey(key);
        const obj = await client.send(
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: cleanKey,
          }),
        );

        if (obj.Body) {
          archive.append(obj.Body as any, { name: cleanKey });
        }
      } catch {
        // continue
      }
    }

    await archive.finalize();
  }

  /**
   * Helper: Match storage keys against MongoDB models
   */
  private async batchFindDbReferences(
    keys: string[],
  ): Promise<Map<string, Array<{ collection: string; id: string; name: string; field: string }>>> {
    const map = new Map<string, Array<{ collection: string; id: string; name: string; field: string }>>();
    if (keys.length === 0) return map;

    // Build regex searches for each key
    const patterns = keys.map((k) => new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

    try {
      const [plants, remedies, tours] = await Promise.all([
        Plant.find({
          $or: [
            { 'images.url': { $in: patterns } },
            { model3dUrl: { $in: patterns } },
            { modelUrl: { $in: patterns } },
          ],
        })
          .select('_id commonName slug images model3dUrl modelUrl')
          .lean(),

        Remedy.find({
          $or: [{ image: { $in: patterns } }, { 'images.url': { $in: patterns } }],
        })
          .select('_id title slug image images')
          .lean(),

        Tour.find({
          $or: [{ coverImageUrl: { $in: patterns } }, { 'stops.imageUrl': { $in: patterns } }],
        })
          .select('_id title slug coverImageUrl stops')
          .lean(),
      ]);

      for (const key of keys) {
        const refs: Array<{ collection: string; id: string; name: string; field: string }> = [];

        for (const p of plants) {
          if (p.model3dUrl?.includes(key) || p.modelUrl?.includes(key)) {
            refs.push({ collection: 'plants', id: p._id.toString(), name: p.commonName, field: 'model3dUrl' });
          }
          if (p.images?.some((img: any) => img.url?.includes(key))) {
            refs.push({ collection: 'plants', id: p._id.toString(), name: p.commonName, field: 'images' });
          }
        }

        for (const r of remedies) {
          if ((r as any).image?.includes(key)) {
            refs.push({ collection: 'remedies', id: r._id.toString(), name: r.title, field: 'image' });
          }
          if (r.images?.some((img: any) => img.url?.includes(key))) {
            refs.push({ collection: 'remedies', id: r._id.toString(), name: r.title, field: 'images' });
          }
        }

        for (const t of tours) {
          if (t.coverImageUrl?.includes(key)) {
            refs.push({ collection: 'tours', id: t._id.toString(), name: t.title, field: 'coverImageUrl' });
          }
          if ((t as any).stops?.some((s: any) => s.mediaUrl?.includes(key))) {
            refs.push({ collection: 'tours', id: t._id.toString(), name: t.title, field: 'stops[].mediaUrl' });
          }
        }

        map.set(key, refs);
      }
    } catch {
      // return empty map on database failure
    }

    return map;
  }

  private guessMimeType(key: string): string {
    const ext = key.toLowerCase().split('.').pop() || '';
    switch (ext) {
      case 'webp':
        return 'image/webp';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'avif':
        return 'image/avif';
      case 'glb':
        return 'model/gltf-binary';
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'pdf':
        return 'application/pdf';
      case 'mp4':
        return 'video/mp4';
      default:
        return 'application/octet-stream';
    }
  }
}

export const storageService = new StorageService();
export default storageService;
