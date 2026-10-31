import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';
import { Types } from 'mongoose';
import DbBackup from '../models/DbBackup.model';
import { getRegistryItem } from '../registry';
import { CollectionKey, DbBackupKind } from '../types';
import { UserRole } from '../../../types';
import { AppError } from '../../../core/utils/apiResponse';
import { isR2Configured, putImage, getObjectBuffer } from '../../../core/storage/r2Storage';
import { browserService } from './browser.service';
import { dbWriteService, DbWriteContext } from './dbWrite.service';

export interface CreateBackupOptions {
  collections?: CollectionKey[];
  kind?: DbBackupKind;
  note?: string;
}

export class BackupService {
  private localBackupDir = path.resolve(process.cwd(), 'backups');

  constructor() {
    if (!fs.existsSync(this.localBackupDir)) {
      try { fs.mkdirSync(this.localBackupDir, { recursive: true }); } catch {}
    }
  }

  /**
   * Create a full or partial database backup
   */
  async createBackup(options: CreateBackupOptions = {}, ctx: DbWriteContext): Promise<any> {
    if (ctx.actorRole !== UserRole.SUPER_ADMIN) {
      throw new AppError('Only Super Admins are permitted to create backups', 403, 'FORBIDDEN');
    }

    const defaultCollections: CollectionKey[] = ['categories', 'plants', 'remedies', 'tours', 'users', 'bookmarks'];
    const targetCollections = options.collections || defaultCollections;

    const backupData: Record<string, any[]> = {};
    const docCounts: Record<string, number> = {};

    for (const key of targetCollections) {
      const reg = getRegistryItem(key);
      if (reg) {
        const docs = await reg.model.find({}).lean();
        const clean = docs.map((d) => browserService.redactDoc(d, reg.redactFields));
        backupData[key] = clean;
        docCounts[key] = clean.length;
      }
    }

    const jsonBuffer = Buffer.from(JSON.stringify(backupData, null, 2), 'utf-8');
    const gzippedBuffer = zlib.gzipSync(jsonBuffer);
    const checksum = crypto.createHash('sha256').update(gzippedBuffer).digest('hex');

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime();
    const backupId = new Types.ObjectId().toString();
    const filename = `${timestamp}-${backupId}.json.gz`;
    const r2Key = `backups/${year}/${month}/${filename}`;

    // Upload to R2 if configured, else store in local backups folder
    if (isR2Configured()) {
      try {
        await putImage({
          key: r2Key,
          buffer: gzippedBuffer,
          contentType: 'application/gzip',
        });
      } catch (err) {
        // Fallback to local disk
        const localPath = path.join(this.localBackupDir, filename);
        fs.writeFileSync(localPath, gzippedBuffer);
      }
    } else {
      const localPath = path.join(this.localBackupDir, filename);
      fs.writeFileSync(localPath, gzippedBuffer);
    }

    const backup = await DbBackup.create({
      _id: new Types.ObjectId(backupId),
      r2Key,
      filename,
      size: gzippedBuffer.length,
      collections: targetCollections,
      docCounts,
      checksum,
      createdBy: new Types.ObjectId(ctx.actorId),
      note: options.note || '',
      kind: options.kind || 'manual',
    });

    await dbWriteService.logAudit(
      'plants',
      'BACKUP_CREATED',
      backup._id as Types.ObjectId,
      null,
      { r2Key, size: backup.size, checksum, kind: backup.kind },
      ctx
    );

    return backup;
  }

  /**
   * Retrieve backup data buffer (from R2 or local disk fallback)
   */
  async getBackupBuffer(backup: any): Promise<Buffer> {
    if (isR2Configured()) {
      try {
        return await getObjectBuffer(backup.r2Key);
      } catch (err) {
        // Try local disk
      }
    }

    const localPath = path.join(this.localBackupDir, backup.filename);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }

    throw new AppError('Backup file not found in storage', 404, 'BACKUP_NOT_FOUND');
  }

  /**
   * Dry run diff for backup restoration
   */
  async dryRunRestore(backupId: string, ctx: DbWriteContext): Promise<any> {
    if (ctx.actorRole !== UserRole.SUPER_ADMIN) {
      throw new AppError('Only Super Admins can preview backups for restoration', 403, 'FORBIDDEN');
    }

    const backup = await DbBackup.findById(backupId);
    if (!backup) throw new AppError('Backup not found', 404, 'NOT_FOUND');

    const gzippedBuffer = await this.getBackupBuffer(backup);
    const actualChecksum = crypto.createHash('sha256').update(gzippedBuffer).digest('hex');

    if (actualChecksum !== backup.checksum) {
      throw new AppError('Backup integrity check failed: Checksum mismatch', 400, 'CHECKSUM_MISMATCH');
    }

    const jsonStr = zlib.gunzipSync(gzippedBuffer).toString('utf-8');
    const backupData: Record<string, any[]> = JSON.parse(jsonStr);

    const diffSummary: Record<string, { inBackup: number; inDb: number; missingInDb: number }> = {};

    for (const [colKey, items] of Object.entries(backupData)) {
      const reg = getRegistryItem(colKey);
      if (reg) {
        const dbCount = await reg.model.countDocuments({});
        diffSummary[colKey] = {
          inBackup: items.length,
          inDb: dbCount,
          missingInDb: Math.max(0, items.length - dbCount),
        };
      }
    }

    return {
      backupId: backup._id,
      filename: backup.filename,
      checksumValid: true,
      collections: backup.collections,
      docCounts: backup.docCounts,
      diffSummary,
    };
  }

  /**
   * Execute Restore with Pre-restore Backup
   */
  async restoreBackup(
    backupId: string,
    mode: 'only_missing' | 'overwrite_matching' | 'full_replace',
    ctx: DbWriteContext
  ): Promise<any> {
    if (ctx.actorRole !== UserRole.SUPER_ADMIN) {
      throw new AppError('Only Super Admins can restore backups', 403, 'FORBIDDEN');
    }

    const backup = await DbBackup.findById(backupId);
    if (!backup) throw new AppError('Backup not found', 404, 'NOT_FOUND');

    // 1. Mandatory automatic pre-restore backup
    await this.createBackup(
      {
        collections: backup.collections as CollectionKey[],
        kind: 'pre-restore',
        note: `Automatic safety snapshot prior to restoring backup ${backup.filename}`,
      },
      ctx
    );

    // 2. Fetch and verify backup buffer
    const gzippedBuffer = await this.getBackupBuffer(backup);
    const checksum = crypto.createHash('sha256').update(gzippedBuffer).digest('hex');
    if (checksum !== backup.checksum) {
      throw new AppError('Checksum mismatch', 400, 'CHECKSUM_MISMATCH');
    }

    const jsonStr = zlib.gunzipSync(gzippedBuffer).toString('utf-8');
    const backupData: Record<string, any[]> = JSON.parse(jsonStr);

    const restoredCounts: Record<string, { inserted: number; updated: number }> = {};

    for (const [colKey, items] of Object.entries(backupData)) {
      const reg = getRegistryItem(colKey);
      if (!reg) continue;

      let inserted = 0;
      let updated = 0;

      if (mode === 'full_replace') {
        await reg.model.deleteMany({});
      }

      for (const item of items) {
        const query = item._id ? { _id: item._id } : { [reg.uniqueKey]: item[reg.uniqueKey] };
        const exists = await reg.model.findOne(query);

        if (!exists) {
          await reg.model.create(item);
          inserted++;
        } else if (mode === 'overwrite_matching' || mode === 'full_replace') {
          await reg.model.replaceOne(query, item);
          updated++;
        }
      }

      restoredCounts[colKey] = { inserted, updated };
    }

    await dbWriteService.logAudit(
      'plants',
      'BACKUP_RESTORED',
      backup._id as Types.ObjectId,
      null,
      { backupId, mode, restoredCounts },
      ctx
    );

    return {
      success: true,
      restoredCounts,
    };
  }

  /**
   * List backups
   */
  async listBackups() {
    return DbBackup.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();
  }

  /**
   * Delete backup
   */
  async deleteBackup(id: string, ctx: DbWriteContext) {
    if (ctx.actorRole !== UserRole.SUPER_ADMIN) {
      throw new AppError('Only Super Admins can delete backups', 403, 'FORBIDDEN');
    }
    const backup = await DbBackup.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    return backup;
  }
}

export const backupService = new BackupService();
