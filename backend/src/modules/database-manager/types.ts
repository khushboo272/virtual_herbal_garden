import { Model } from 'mongoose';
import { ZodSchema } from 'zod';
import { UserRole } from '../../types';

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
  | 'supportrequests'
  | 'tourprogresses'
  | 'notifications'
  | 'activitylogs'
  | 'auditlogs'
  | 'featureflags'
  | 'systemconfigs'
  | 'refreshtokens';

export interface CollectionRef {
  field: string;
  targetCollection: CollectionKey;
  by: '_id' | 'slug';
  isArray?: boolean;
}

export interface CollectionRegistryItem<T = any> {
  key: CollectionKey;
  label: string;
  model: Model<T>;
  uniqueKey: string; // 'slug' | '_id' | 'email' | 'key'
  alternateUniqueKeys?: string[]; // e.g. ['scientificName'] for plants
  importable: boolean;
  exportable: boolean;
  editable: boolean;
  deletable: boolean;
  softDelete: boolean;
  refs: CollectionRef[];
  redactFields: string[];
  readRoles: UserRole[];
  writeRoles: UserRole[];
  destructiveRoles: UserRole[];
  defaultColumns: string[];
  searchFields: string[];
  zodSchema?: ZodSchema<any>;
}

export type ImportMode = 'insert_only' | 'upsert' | 'update_merge' | 'replace';
export type ImportStatusOverride = 'keep' | 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED';

export type DbJobType = 'import' | 'export' | 'backup' | 'restore' | 'integrity' | 'tool' | 'bulk';
export type DbJobStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

export interface DbJobProgress {
  current: number;
  total: number;
  percent: number;
  message: string;
}

export interface DbJobCounts {
  inserted: number;
  updated: number;
  skipped: number;
  deleted: number;
  errors: number;
  total: number;
}

export interface DbJobError {
  row?: number;
  collectionName?: string;
  slug?: string;
  field?: string;
  message: string;
}

export type DbBackupKind = 'manual' | 'scheduled' | 'pre-restore' | 'pre-import' | 'pre-bulk';

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
  healthScore: number; // 0 - 100
  totalIssues: number;
  errorsCount: number;
  warningsCount: number;
  infoCount: number;
  issues: IntegrityIssue[];
}

export type FilterOp =
  | 'eq'
  | 'ne'
  | 'in'
  | 'nin'
  | 'contains'
  | 'regex'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'exists'
  | 'isTrue'
  | 'isFalse';

export interface FilterClause {
  field: string;
  op: FilterOp;
  value: any;
}

export interface QueryConsolePayload {
  collection: CollectionKey;
  filter?: Record<string, any>;
  projection?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  explain?: boolean;
}

export interface AggregateConsolePayload {
  collection: CollectionKey;
  pipeline: Array<Record<string, any>>;
  explain?: boolean;
}
