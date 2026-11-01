import { api } from '../../../lib/api';
import type {
  OverviewStats,
  CollectionMeta,
  CollectionKey,
  DbJobItem,
  DryRunResult,
  BrowseParams,
  BrowseResult,
  BacklinkItem,
  DbBackupItem,
  IntegrityReport,
  IntegrityIssue,
  BuiltInQuery,
} from '../types';

export const databaseApi = {
  // ── Overview & Collections ──
  getOverview: async (): Promise<OverviewStats> => {
    const res = await api.get('/admin/database/overview');
    const raw = res.data?.data || res.data || {};
    return {
      serverVersion: raw.serverVersion || raw.connection?.serverVersion || 'MongoDB',
      databaseName: raw.databaseName || raw.connection?.dbName || 'herbal_garden_dev',
      totalDocuments: raw.totalDocuments ?? raw.dbMetrics?.objectsCount ?? 0,
      totalStorageSizeBytes: raw.totalStorageSizeBytes ?? raw.dbMetrics?.storageSize ?? 0,
      totalCollections: raw.totalCollections ?? raw.dbMetrics?.collectionsCount ?? (raw.collections?.length || 0),
      activeJobsCount: raw.activeJobsCount ?? (raw.runningJobs?.length || 0),
      backupFreshness: {
        lastBackupAt: raw.backupFreshness?.lastBackupAt || raw.backupStatus?.lastBackupAt || null,
        isStale: raw.backupFreshness?.isStale ?? raw.backupStatus?.isBackupStale ?? true,
        totalBackups: raw.backupFreshness?.totalBackups ?? raw.backupStatus?.totalBackups ?? 0,
      },
      collections: (raw.collections || []).map((c: any) => ({
        key: c.key,
        label: c.label || c.key,
        count: c.count ?? 0,
        publishedCount: c.publishedCount,
        draftCount: c.draftCount,
        storageSizeBytes: c.storageSizeBytes ?? c.storageSize ?? 0,
        avgObjSizeBytes: c.avgObjSizeBytes ?? c.avgObjSize ?? 0,
        indexCount: c.indexCount ?? 0,
        lastWriteAt: c.lastWriteAt || null,
      })),
      recentJobs: raw.recentJobs || raw.runningJobs || [],
      recentAuditLogs: raw.recentAuditLogs || raw.recentDbAudits || [],
    };
  },

  getCollections: async (): Promise<CollectionMeta[]> => {
    const res = await api.get('/admin/database/collections');
    return res.data?.data || res.data;
  },

  // ── Import ──
  loadStarterPack: async (): Promise<any> => {
    const res = await api.get('/admin/database/import/starter-pack');
    return res.data?.data || res.data;
  },

  getImportTemplate: async (collection: CollectionKey): Promise<any> => {
    const res = await api.get(`/admin/database/import/template/${collection}`);
    return res.data?.data || res.data;
  },

  getAiPrompt: async (collection: CollectionKey): Promise<{ prompt: string }> => {
    const res = await api.get(`/admin/database/import/ai-prompt/${collection}`);
    return res.data?.data || res.data;
  },

  dryRunImport: async (payload: any, collection?: CollectionKey | 'bundle', options?: any): Promise<DryRunResult> => {
    const res = await api.post('/admin/database/import/dry-run', { payload, collection, options });
    return res.data?.data || res.data;
  },

  commitImport: async (dryRunResult: DryRunResult, options?: any): Promise<{ jobId: string; batchId: string; counts: any }> => {
    const res = await api.post('/admin/database/import/commit', { dryRunResult, options });
    return res.data?.data || res.data;
  },

  // ── Browser & Editor ──
  browseCollection: async <T = any>(colKey: CollectionKey, params: BrowseParams = {}): Promise<BrowseResult<T>> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sortField) query.set('sortField', params.sortField);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.search) query.set('search', params.search);
    if (params.filters && params.filters.length > 0) {
      query.set('filters', JSON.stringify(params.filters));
    }

    const res = await api.get(`/admin/database/browse/${colKey}?${query.toString()}`);
    const data = res.data?.data || res.data;
    // Normalize data shape
    if (Array.isArray(data)) {
      return {
        docs: data,
        total: res.data?.meta?.total || data.length,
        page: res.data?.meta?.page || 1,
        limit: res.data?.meta?.limit || data.length,
        totalPages: res.data?.meta?.totalPages || 1,
        meta: res.data?.meta || { page: 1, limit: data.length, total: data.length, totalPages: 1 },
      };
    }
    return {
      docs: data.docs || [],
      total: data.total ?? data.meta?.total ?? 0,
      page: data.page ?? data.meta?.page ?? 1,
      limit: data.limit ?? data.meta?.limit ?? 20,
      totalPages: data.totalPages ?? data.meta?.totalPages ?? 1,
      meta: data.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  getDocument: async (colKey: CollectionKey, id: string): Promise<any> => {
    const res = await api.get(`/admin/database/browse/${colKey}/${id}`);
    return res.data?.data || res.data;
  },

  getBacklinks: async (colKey: CollectionKey, id: string): Promise<BacklinkItem[]> => {
    const res = await api.get(`/admin/database/browse/${colKey}/${id}/backlinks`);
    return res.data?.data || res.data;
  },

  createDocument: async (colKey: CollectionKey, data: any): Promise<any> => {
    const res = await api.post(`/admin/database/browse/${colKey}`, data);
    return res.data?.data || res.data;
  },

  updateDocument: async (
    colKey: CollectionKey,
    id: string,
    updateData: any,
    expectedUpdatedAt?: string
  ): Promise<any> => {
    const res = await api.put(`/admin/database/browse/${colKey}/${id}`, {
      updateData,
      expectedVersion: expectedUpdatedAt ? { updatedAt: expectedUpdatedAt } : {},
    });
    return res.data?.data || res.data;
  },

  deleteDocument: async (colKey: CollectionKey, id: string): Promise<any> => {
    const res = await api.delete(`/admin/database/browse/${colKey}/${id}`);
    return res.data?.data || res.data;
  },

  bulkAction: async (
    colKey: CollectionKey,
    docIds: string[],
    action: 'delete' | 'publish' | 'unpublish' | 'setField' | 'tag',
    payload?: any
  ): Promise<{ affected: number }> => {
    const res = await api.post(`/admin/database/browse/${colKey}/bulk`, { docIds, action, payload });
    return res.data?.data || res.data;
  },

  // ── Export ──
  exportDataUrl: (collection?: CollectionKey | 'bundle', format: 'json' | 'ndjson' | 'csv' | 'gzip' = 'json') => {
    const token = localStorage.getItem('access_token');
    const colParam = collection ? `collection=${collection}&` : '';
    return `/api/v1/admin/database/export?${colParam}format=${format}&token=${token || ''}`;
  },

  // ── Backups ──
  listBackups: async (): Promise<DbBackupItem[]> => {
    const res = await api.get('/admin/database/backups');
    return res.data?.data || res.data;
  },

  createBackup: async (note?: string): Promise<DbBackupItem> => {
    const res = await api.post('/admin/database/backups', { kind: 'manual', note });
    return res.data?.data || res.data;
  },

  dryRunRestore: async (backupId: string): Promise<any> => {
    const res = await api.post(`/admin/database/backups/${backupId}/dry-run-restore`, {});
    return res.data?.data || res.data;
  },

  restoreBackup: async (backupId: string, mode: 'overwrite_matching' | 'clean_wipe' = 'overwrite_matching'): Promise<any> => {
    const res = await api.post(`/admin/database/backups/${backupId}/restore`, { mode });
    return res.data?.data || res.data;
  },

  deleteBackup: async (backupId: string): Promise<any> => {
    const res = await api.delete(`/admin/database/backups/${backupId}`);
    return res.data?.data || res.data;
  },

  // ── Query Console ──
  getQueryExamples: async (): Promise<BuiltInQuery[]> => {
    const res = await api.get('/admin/database/query/examples');
    return res.data?.data || res.data;
  },

  executeFind: async (payload: {
    collection: CollectionKey;
    filter?: any;
    projection?: any;
    sort?: any;
    limit?: number;
    skip?: number;
    explain?: boolean;
  }): Promise<{ results: any[]; count: number; durationMs: number }> => {
    const res = await api.post('/admin/database/query/find', payload);
    return res.data?.data || res.data;
  },

  executeAggregate: async (payload: {
    collection: CollectionKey;
    pipeline: any[];
    explain?: boolean;
  }): Promise<{ results: any[]; count: number; durationMs: number }> => {
    const res = await api.post('/admin/database/query/aggregate', payload);
    return res.data?.data || res.data;
  },

  // ── Data Integrity ──
  getIntegrityReport: async (): Promise<IntegrityReport> => {
    const res = await api.get('/admin/database/integrity/report');
    return res.data?.data || res.data;
  },

  applyIntegrityFix: async (issue: IntegrityIssue): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/admin/database/integrity/fix', { issue });
    return res.data?.data || res.data;
  },

  ignoreIntegrityIssue: async (issueId: string): Promise<{ success: boolean }> => {
    const res = await api.post('/admin/database/integrity/ignore', { issueId });
    return res.data?.data || res.data;
  },

  // ── Smart Tools ──
  linkR2Assets: async (dryRun = true): Promise<any> => {
    const res = await api.post('/admin/database/tools/link-r2-assets', { dryRun });
    return res.data?.data || res.data;
  },

  getAssetCoverage: async (): Promise<any> => {
    const res = await api.get('/admin/database/tools/asset-coverage');
    return res.data?.data || res.data;
  },

  autoPlace3D: async (dryRun = true): Promise<any> => {
    const res = await api.post('/admin/database/tools/auto-place-3d', { dryRun });
    return res.data?.data || res.data;
  },

  findAndReplace: async (params: {
    collection: CollectionKey;
    field: string;
    findText: string;
    replaceText: string;
    dryRun?: boolean;
  }): Promise<any> => {
    const res = await api.post('/admin/database/tools/find-and-replace', params);
    return res.data?.data || res.data;
  },

  normalizeData: async (params: {
    collection: CollectionKey;
    field: 'tags' | 'medicinalUses' | 'slug';
    dryRun?: boolean;
  }): Promise<any> => {
    const res = await api.post('/admin/database/tools/normalize', params);
    return res.data?.data || res.data;
  },

  getIndexes: async (): Promise<any> => {
    const res = await api.get('/admin/database/tools/indexes');
    return res.data?.data || res.data;
  },

  // ── Jobs & History ──
  getJobs: async (page = 1, limit = 20): Promise<{ jobs: DbJobItem[]; total: number; page: number; totalPages: number }> => {
    const res = await api.get('/admin/database/jobs', { params: { page, limit } });
    const raw = res.data?.data ?? res.data;
    const meta = res.data?.meta ?? res.meta ?? {};
    if (Array.isArray(raw)) {
      return {
        jobs: raw,
        total: meta.total ?? raw.length,
        page: meta.page ?? page,
        totalPages: meta.totalPages ?? (Math.ceil(raw.length / limit) || 1),
      };
    }
    return {
      jobs: raw?.jobs ?? [],
      total: raw?.total ?? meta.total ?? 0,
      page: raw?.page ?? meta.page ?? page,
      totalPages: raw?.totalPages ?? meta.totalPages ?? 1,
    };
  },

  getJob: async (jobId: string): Promise<DbJobItem> => {
    const res = await api.get(`/admin/database/jobs/${jobId}`);
    return res.data?.data || res.data;
  },

  undoBatch: async (jobOrBatchId: string): Promise<{ undoneInserted: number; restoredUpdated: number }> => {
    const res = await api.post(`/admin/database/jobs/${jobOrBatchId}/undo`, {});
    return res.data?.data || res.data;
  },

  // ── AI Debugger ──
  debugError: async (params: {
    errorMessage: string;
    context?: {
      collection?: string;
      operation?: string;
      mode?: string;
      payloadSnippet?: string;
    };
  }): Promise<{ analysis: string; model: string; timestamp: string }> => {
    const res = await api.post('/admin/database/ai-debug', params);
    return res.data?.data || res.data;
  },
};

