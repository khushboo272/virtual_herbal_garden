export type CollectionKey =
  | 'categories'
  | 'plants'
  | 'remedies'
  | 'tours'
  | 'users'
  | 'bookmarks'
  | 'detections'
  | 'gardens'
  | 'reviews'
  | 'roleapplications'
  | 'plantregistrationrequests'
  | 'feedback'
  | 'notifications'
  | 'activitylogs'
  | 'auditlogs'
  | 'featureflags'
  | 'systemconfigs'
  | 'refreshtokens';

export interface CollectionMeta {
  key: CollectionKey;
  label: string;
  uniqueKey: string;
  importable: boolean;
  exportable: boolean;
  editable: boolean;
  deletable: boolean;
  softDelete: boolean;
  refs: Array<{ field: string; targetCollection: CollectionKey; by: 'slug' | '_id' }>;
  defaultColumns: string[];
}

export interface CollectionStatItem {
  key: CollectionKey;
  label: string;
  count: number;
  publishedCount?: number;
  draftCount?: number;
  storageSizeBytes: number;
  avgObjSizeBytes: number;
  indexCount: number;
  lastWriteAt: string | null;
}

export interface OverviewStats {
  serverVersion: string;
  databaseName: string;
  totalDocuments: number;
  totalStorageSizeBytes: number;
  totalCollections: number;
  activeJobsCount: number;
  backupFreshness: {
    lastBackupAt: string | null;
    isStale: boolean; // > 7 days
    totalBackups: number;
  };
  collections: CollectionStatItem[];
  recentJobs: DbJobItem[];
  recentAuditLogs: any[];
}

export type DbJobType = 'import' | 'export' | 'backup' | 'restore' | 'integrity' | 'tool' | 'bulk';
export type DbJobStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

export interface DbJobItem {
  _id: string;
  batchId: string;
  type: DbJobType;
  collectionName?: string;
  status: DbJobStatus;
  progress: {
    current: number;
    total: number;
    percent: number;
    message: string;
  };
  counts: {
    inserted: number;
    updated: number;
    skipped: number;
    deleted: number;
    errors: number;
    total: number;
  };
  errors: Array<{
    row?: number;
    collectionName?: string;
    slug?: string;
    message: string;
  }>;
  isUndone: boolean;
  undoneAt?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DryRunRowResult {
  row: number;
  collectionName: CollectionKey;
  uniqueValue: string;
  action: 'insert' | 'update' | 'skip' | 'error';
  warnings: string[];
  errors: string[];
  diff?: Record<string, { before: any; after: any }>;
  docData: any;
}

export interface DryRunResult {
  batchId: string;
  isBundle: boolean;
  collections: CollectionKey[];
  willInsert: number;
  willUpdate: number;
  willSkip: number;
  errorCount: number;
  summary: {
    willInsert: number;
    willUpdate: number;
    willSkip: number;
    errorsCount: number;
    total: number;
  };
  rows: DryRunRowResult[];
  errors: Array<{
    row?: number;
    collectionName?: string;
    slug?: string;
    message: string;
  }>;
}

export interface BrowseParams {
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: FilterClause[];
}

export type FilterOp =
  | 'eq'
  | 'ne'
  | 'contains'
  | 'regex'
  | 'in'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'exists'
  | 'isTrue'
  | 'isFalse';

export interface FilterClause {
  field: string;
  op: FilterOp;
  value: any;
}

export interface BrowseResult<T = any> {
  docs: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BacklinkItem {
  collection: CollectionKey;
  field: string;
  id: string;
  title: string;
}

export interface DbBackupItem {
  _id: string;
  id: string;
  filename: string;
  r2Key: string;
  size: number;
  collections: CollectionKey[];
  docCounts: Record<string, number>;
  checksum: string;
  createdBy: { _id: string; displayName?: string; email?: string } | string;
  note?: string;
  kind: 'manual' | 'scheduled' | 'pre-restore' | 'pre-import' | 'pre-bulk';
  createdAt: string;
}

export interface IntegrityIssue {
  id: string;
  severity: 'error' | 'warn' | 'info';
  code: string;
  category: 'orphans' | 'duplicates' | 'schema' | 'medical_safety' | 'assets' | '3d_placement' | 'staleness';
  collectionName: CollectionKey;
  docId: string;
  slug?: string;
  field?: string;
  message: string;
  fixable: boolean;
  autoFixAction?: string;
  autoFixPayload?: any;
}

export interface IntegrityReport {
  timestamp: string;
  healthScore: number;
  totalIssues: number;
  errorsCount: number;
  warningsCount: number;
  infoCount: number;
  issues: IntegrityIssue[];
}

export interface BuiltInQuery {
  id: string;
  name: string;
  collection: CollectionKey;
  type: 'find' | 'aggregate';
  filter?: Record<string, any>;
  projection?: Record<string, any>;
  sort?: Record<string, any>;
  pipeline?: Array<Record<string, any>>;
}

