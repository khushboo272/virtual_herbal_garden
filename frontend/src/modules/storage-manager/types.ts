export interface IStorageItem {
  key: string;
  name: string;
  size: number;
  lastModified: string | Date;
  etag?: string;
  contentType: string;
  publicUrl: string;
  isFolder: boolean;
  dbUsageCount: number;
  dbReferences?: Array<{
    collection: string;
    id: string;
    name: string;
    field: string;
  }>;
}

export interface IStorageFolder {
  prefix: string;
  name: string;
  itemCount?: number;
}

export interface IListStorageResponse {
  prefix: string;
  folders: IStorageFolder[];
  items: IStorageItem[];
  nextCursor?: string;
  isTruncated: boolean;
  totalCount?: number;
}

export interface IBucketStats {
  totalObjects: number;
  totalBytes: number;
  perFolderUsage: Record<string, { objects: number; bytes: number }>;
  freeTierLimitBytes: number;
  freeTierWarningThresholdBytes: number;
  lastScannedAt: string | Date;
  isScanning?: boolean;
}

export interface ISyncCheckResult {
  orphans: Array<{ key: string; size: number; lastModified: string | Date; suggestedPlantSlug?: string }>;
  brokenLinks: Array<{ collection: string; id: string; name: string; field: string; url: string; key: string }>;
  wrongLocations: Array<{ key: string; currentFolder: string; expectedFolder: string }>;
  caseMismatches: Array<{ key: string; normalizedKey: string }>;
  stats: {
    totalR2Keys: number;
    totalDbLinks: number;
    orphanCount: number;
    brokenLinkCount: number;
  };
}

export interface ICoverageItem {
  id: string;
  name: string;
  slug: string;
  type: 'plant' | 'remedy' | 'tour';
  hasHero: boolean;
  galleryCount: number;
  hasGlb: boolean;
  hasLod: boolean;
  hasCover: boolean;
  missingItems: string[];
}

export interface IStorageTrashItem {
  _id: string;
  originalKey: string;
  trashKey: string;
  deletedBy: string | { displayName?: string; email?: string };
  deletedAt: string | Date;
  size: number;
  contentType: string;
  isReplacedOverwrite?: boolean;
  dbRefsSnapshot: Array<{
    collection: string;
    id: string;
    field: string;
  }>;
}

export type StorageFilterType = 'ALL' | 'IMAGE' | 'MODEL' | 'JSON' | 'OTHER';
export type StorageDbFilter = 'ALL' | 'LINKED' | 'UNLINKED';
export type StorageViewMode = 'grid' | 'list';
export type StorageSortField = 'name' | 'size' | 'lastModified' | 'type';
export type StorageSortDirection = 'asc' | 'desc';

