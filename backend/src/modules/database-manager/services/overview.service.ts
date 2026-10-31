import mongoose from 'mongoose';
import { getAllRegistryItems } from '../registry';
import DbBackup from '../models/DbBackup.model';
import DbJob from '../models/DbJob.model';
import AuditLog from '../../admin/AuditLog.model';

export class OverviewService {
  async getOverviewStats() {
    const db = mongoose.connection.db;

    // 1. Database level stats
    let dbStats: any = {};
    let serverVersion = 'MongoDB 6.0+';
    try {
      if (db) {
        dbStats = await db.stats();
        const buildInfo = await db.admin().buildInfo();
        if (buildInfo?.version) serverVersion = `MongoDB ${buildInfo.version}`;
      }
    } catch {}

    // 2. Per-collection stats
    const items = getAllRegistryItems();
    const collectionStats: Array<{
      key: string;
      label: string;
      count: number;
      publishedCount: number;
      draftCount: number;
      storageSize: number;
      storageSizeBytes?: number;
      avgObjSize: number;
      avgObjSizeBytes?: number;
      indexCount: number;
      lastWriteAt?: Date;
    }> = [];

    for (const reg of items) {
      let count = 0;
      let publishedCount = 0;
      let draftCount = 0;
      let storageSize = 0;
      let avgObjSize = 0;
      let indexCount = 0;
      let lastWriteAt: Date | undefined = undefined;

      try {
        count = await reg.model.countDocuments({});

        if ('isPublished' in (reg.model.schema.paths || {})) {
          publishedCount = await reg.model.countDocuments({ isPublished: true });
          draftCount = count - publishedCount;
        }

        const latest = await reg.model.findOne({}, 'updatedAt createdAt').sort({ updatedAt: -1, createdAt: -1 }).lean();
        if (latest) {
          lastWriteAt = (latest as any).updatedAt || (latest as any).createdAt;
        }

        if (db) {
          try {
            const stats: any = await db.command({ collStats: reg.model.collection.name });
            storageSize = stats.size || stats.storageSize || 0;
            avgObjSize = stats.avgObjSize || 0;
            indexCount = stats.nindexes || 0;
          } catch {
            indexCount = Object.keys(reg.model.schema.indexes()).length;
          }
        }
      } catch {}

      collectionStats.push({
        key: reg.key,
        label: reg.label,
        count,
        publishedCount,
        draftCount,
        storageSize,
        storageSizeBytes: storageSize,
        avgObjSize,
        avgObjSizeBytes: avgObjSize,
        indexCount,
        lastWriteAt,
      });
    }

    // 3. Backup health
    const lastBackup = await DbBackup.findOne({ isDeleted: false }).sort({ createdAt: -1 }).lean();
    let lastBackupAgeDays: number | null = null;
    let isBackupStale = false;

    if (lastBackup) {
      const diffMs = Date.now() - new Date(lastBackup.createdAt).getTime();
      lastBackupAgeDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (lastBackupAgeDays > 7) isBackupStale = true;
    } else {
      isBackupStale = true;
    }

    const totalBackups = await DbBackup.countDocuments({ isDeleted: false });

    // 4. Running Jobs
    const runningJobs = await DbJob.find({ status: 'running' }).lean();

    // 5. Recent Audit Events
    const recentDbAudits = await AuditLog.find({ action: { $regex: '^DB_' } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'displayName email role')
      .lean();

    const totalDocuments = dbStats.objects || collectionStats.reduce((sum, c) => sum + (c.count || 0), 0);
    const totalStorageSizeBytes = dbStats.storageSize || collectionStats.reduce((sum, c) => sum + (c.storageSize || 0), 0);
    const dbName = mongoose.connection.name || 'herbal_garden_dev';

    return {
      serverVersion,
      databaseName: dbName,
      totalDocuments,
      totalCollections: collectionStats.length,
      totalStorageSizeBytes,
      backupFreshness: {
        lastBackupAt: lastBackup?.createdAt || null,
        lastBackupAgeDays,
        isStale: isBackupStale,
        totalBackups,
      },
      collections: collectionStats,
      recentJobs: runningJobs,
      recentAuditLogs: recentDbAudits,
      activeJobsCount: runningJobs.length,
      // Backward compatibility fields
      connection: {
        isConnected: mongoose.connection.readyState === 1,
        host: mongoose.connection.host || 'cluster-atlas',
        dbName,
        serverVersion,
      },
      dbMetrics: {
        collectionsCount: dbStats.collections || collectionStats.length,
        objectsCount: totalDocuments,
        dataSize: dbStats.dataSize || 0,
        storageSize: totalStorageSizeBytes,
        indexesCount: dbStats.indexes || 0,
      },
      backupStatus: {
        lastBackupAt: lastBackup?.createdAt || null,
        lastBackupAgeDays,
        isBackupStale,
        totalBackups,
      },
      runningJobs,
      recentDbAudits,
    };
  }

  /**
   * History with pagination and filters
   */
  async getJobHistory(page = 1, limit = 20, type?: string) {
    const query: Record<string, any> = {};
    if (type) query.type = type;

    const skip = (page - 1) * limit;

    const [total, jobs] = await Promise.all([
      DbJob.countDocuments(query),
      DbJob.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'displayName email role')
        .lean(),
    ]);

    return {
      jobs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const overviewService = new OverviewService();
