import { Request, Response } from 'express';
import { z } from 'zod';
import { storageService } from './services/storage.service';
import { syncService } from './services/sync.service';
import { StorageTrash } from './models/StorageTrash.model';
import { sendSuccess } from '../../core/utils/apiResponse';
import { createAuditLog } from '../../core/utils/auditLogger';
import { AppError } from '../../core/errors/AppError';
import { UserRole } from '../../types';

const presignUploadSchema = z.object({
  key: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().nonnegative(),
});

const folderSchema = z.object({
  folder: z.string().min(1),
});

const copyMoveSchema = z.object({
  sourceKey: z.string().min(1),
  destKey: z.string().min(1),
});

const deleteSchema = z.object({
  key: z.string().min(1),
  permanent: z.boolean().optional().default(false),
});

const deleteManySchema = z.object({
  keys: z.array(z.string().min(1)),
  permanent: z.boolean().optional().default(false),
});

const updateMetadataSchema = z.object({
  key: z.string().min(1),
  contentType: z.string().optional(),
  cacheControl: z.string().optional(),
  contentDisposition: z.string().optional(),
  customMetadata: z.record(z.string()).optional(),
});

const mapToDbSchema = z.object({
  key: z.string().min(1),
  targetSlug: z.string().optional(),
  targetType: z.string().optional(),
});

export class StorageController {
  async list(req: Request, res: Response) {
    const prefix = (req.query.prefix as string) || '';
    const cursor = (req.query.cursor as string) || undefined;
    const limit = Number(req.query.limit) || 100;
    const delimiter = (req.query.delimiter as string) || '/';

    const result = await storageService.list(
      prefix,
      delimiter,
      cursor,
      limit,
      req.user!.role,
    );
    sendSuccess(res, result);
  }

  async stat(req: Request, res: Response) {
    const key = (req.query.key as string) || '';
    if (!key) throw new AppError('Key parameter is required', 400);

    const result = await storageService.stat(key);
    sendSuccess(res, result);
  }

  async presignUpload(req: Request, res: Response) {
    const { key, contentType, sizeBytes } = presignUploadSchema.parse(req.body);

    const result = await storageService.presignUpload(
      key,
      contentType,
      sizeBytes,
      req.user!.role,
    );

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: 'STORAGE_PRESIGN_UPLOAD',
      targetModel: 'Storage',
      details: { key, contentType, sizeBytes },
    });

    sendSuccess(res, result);
  }

  async presignDownload(req: Request, res: Response) {
    const key = (req.query.key as string) || '';
    const ttl = Number(req.query.ttl) || 300;
    if (!key) throw new AppError('Key parameter is required', 400);

    const url = await storageService.presignDownload(key, ttl);
    sendSuccess(res, { url, key });
  }

  async createFolder(req: Request, res: Response) {
    const { folder } = folderSchema.parse(req.body);
    const createdPath = await storageService.createFolder(folder, req.user!.role);

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: 'STORAGE_CREATE_FOLDER',
      targetModel: 'Storage',
      details: { folder: createdPath },
    });

    sendSuccess(res, { folder: createdPath });
  }

  async copy(req: Request, res: Response) {
    const { sourceKey, destKey } = copyMoveSchema.parse(req.body);
    await storageService.copy(sourceKey, destKey, req.user!.role);

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: 'STORAGE_COPY',
      targetModel: 'Storage',
      details: { sourceKey, destKey },
    });

    sendSuccess(res, { message: 'Object copied successfully', sourceKey, destKey });
  }

  async move(req: Request, res: Response) {
    const { sourceKey, destKey } = copyMoveSchema.parse(req.body);
    await storageService.move(sourceKey, destKey, req.user!.role);

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: 'STORAGE_MOVE',
      targetModel: 'Storage',
      details: { sourceKey, destKey },
    });

    sendSuccess(res, { message: 'Object moved successfully', sourceKey, destKey });
  }

  async delete(req: Request, res: Response) {
    const { key, permanent } = deleteSchema.parse(req.body);

    if (permanent) {
      if ((req.user!.role as string) !== UserRole.SUPER_ADMIN) {
        throw new AppError('Permanent deletion is restricted to SUPER_ADMIN', 403);
      }
    }

    const result = await storageService.delete(
      key,
      permanent,
      req.user!.sub,
      req.user!.role,
    );

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: permanent ? 'STORAGE_PERMANENT_DELETE' : 'STORAGE_SOFT_DELETE',
      targetModel: 'Storage',
      details: { key, permanent, trashKey: result.trashKey },
    });

    sendSuccess(res, result);
  }

  async deleteMany(req: Request, res: Response) {
    const { keys, permanent } = deleteManySchema.parse(req.body);

    if (permanent) {
      if ((req.user!.role as string) !== UserRole.SUPER_ADMIN) {
        throw new AppError('Permanent deletion is restricted to SUPER_ADMIN', 403);
      }
    }

    const result = await storageService.deleteMany(
      keys,
      permanent,
      req.user!.sub,
      req.user!.role,
    );

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: permanent ? 'STORAGE_BULK_PERMANENT_DELETE' : 'STORAGE_BULK_SOFT_DELETE',
      targetModel: 'Storage',
      details: { count: result.deleted, permanent },
    });

    sendSuccess(res, result);
  }

  async deletePrefix(req: Request, res: Response) {
    const folder = (req.body.prefix as string) || '';
    const permanent = Boolean(req.body.permanent);
    if (!folder) throw new AppError('Prefix parameter is required', 400);

    const deleted = await storageService.deletePrefix(
      folder,
      permanent,
      req.user!.sub,
      req.user!.role,
    );

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: 'STORAGE_DELETE_FOLDER',
      targetModel: 'Storage',
      details: { folder, permanent, count: deleted },
    });

    sendSuccess(res, { deleted, folder });
  }

  async updateMetadata(req: Request, res: Response) {
    const { key, ...updates } = updateMetadataSchema.parse(req.body);
    await storageService.updateMetadata(key, updates, req.user!.role);

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: 'STORAGE_UPDATE_METADATA',
      targetModel: 'Storage',
      details: { key, updates },
    });

    sendSuccess(res, { message: 'Metadata updated successfully', key });
  }

  async getBucketInfo(req: Request, res: Response) {
    const forceRescan = req.query.rescan === 'true' || req.query.rescan === '1';
    const stats = await storageService.getBucketInfo(forceRescan);
    sendSuccess(res, stats);
  }

  async downloadZip(req: Request, res: Response) {
    const rawKeys = req.body?.keys || req.query?.keys;
    const keyArray: string[] = Array.isArray(rawKeys)
      ? (rawKeys as string[])
      : typeof rawKeys === 'string'
      ? (rawKeys as string).split(',')
      : [];

    if (keyArray.length === 0) {
      throw new AppError('No keys provided for zip export', 400);
    }

    await storageService.streamZipArchive(keyArray, res);
  }

  async syncCheck(_req: Request, res: Response) {
    const result = await syncService.runSyncCheck();
    sendSuccess(res, result);
  }

  async coverageReport(_req: Request, res: Response) {
    const report = await syncService.getCoverageReport();
    sendSuccess(res, report);
  }

  async listTrash(req: Request, res: Response) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      StorageTrash.find().sort({ deletedAt: -1 }).skip(skip).limit(limit).lean(),
      StorageTrash.countDocuments(),
    ]);

    sendSuccess(res, {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  }

  async restoreTrash(req: Request, res: Response) {
    const trashId = req.body.trashId || req.body.id;
    const trashDoc = await StorageTrash.findById(trashId);
    if (!trashDoc) throw new AppError('Trash entry not found', 404);

    await storageService.move(trashDoc.trashKey, trashDoc.originalKey, req.user!.role);
    await StorageTrash.findByIdAndDelete(trashId);

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: 'STORAGE_RESTORE_TRASH',
      targetModel: 'Storage',
      details: { originalKey: trashDoc.originalKey, trashKey: trashDoc.trashKey },
    });

    sendSuccess(res, { message: 'Asset restored from trash', key: trashDoc.originalKey });
  }

  async emptyTrash(req: Request, res: Response) {
    if ((req.user!.role as string) !== UserRole.SUPER_ADMIN) {
      throw new AppError('Emptying trash is restricted to SUPER_ADMIN', 403);
    }

    const deletedCount = await storageService.deletePrefix('trash/', true, req.user!.sub, req.user!.role);
    await StorageTrash.deleteMany({});

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: 'STORAGE_EMPTY_TRASH',
      targetModel: 'Storage',
      details: { deletedCount },
    });

    sendSuccess(res, { message: 'Trash emptied successfully', deletedCount });
  }

  async mapToDb(req: Request, res: Response) {
    const { key, targetSlug, targetType } = mapToDbSchema.parse(req.body);

    const result = await storageService.mapToDb(key, targetSlug, targetType);

    await createAuditLog({
      req,
      userId: req.user!.sub,
      action: 'STORAGE_MAP_TO_DB',
      targetModel: 'Storage',
      targetId: result._id ? result._id.toString() : undefined,
      details: { key, targetSlug, targetType },
    });

    sendSuccess(res, result);
  }
}

export const storageController = new StorageController();
export default storageController;
