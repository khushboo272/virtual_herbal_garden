import { Types } from 'mongoose';

export type StorageAllowedPrefix =
  | 'plants/'
  | 'models/'
  | 'remedies/'
  | 'tours/'
  | 'avatars/'
  | 'uploads/'
  | 'misc/'
  | 'trash/'
  | 'backups/';

export interface IStorageItem {
  key: string;
  name: string;
  size: number;
  lastModified: Date;
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
  lastScannedAt: Date;
  isScanning?: boolean;
}

export interface IPresignUploadRequest {
  key: string;
  contentType: string;
  sizeBytes: number;
}

export interface IPresignUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  headers?: Record<string, string>;
  isMultipart?: boolean;
  uploadId?: string;
}

export interface IStorageTrashDoc {
  _id: Types.ObjectId;
  originalKey: string;
  trashKey: string;
  deletedBy: Types.ObjectId;
  deletedAt: Date;
  size: number;
  contentType: string;
  isReplacedOverwrite?: boolean;
  dbRefsSnapshot: Array<{
    collection: string;
    id: string;
    field: string;
  }>;
}

