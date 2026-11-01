import { api } from '../../../lib/api';
import {
  IListStorageResponse,
  IBucketStats,
  IStorageItem,
  ISyncCheckResult,
  ICoverageItem,
  IStorageTrashItem,
} from '../types';

export const storageApi = {
  list: async (prefix = '', cursor?: string, limit = 100): Promise<IListStorageResponse> => {
    const res = await api.get<IListStorageResponse>('/admin/storage/list', {
      prefix,
      cursor,
      limit,
    });
    return (res as any)?.data || res;
  },

  stat: async (key: string): Promise<IStorageItem> => {
    const res = await api.get<IStorageItem>('/admin/storage/stat', { key });
    return (res as any)?.data || res;
  },

  getBucketInfo: async (rescan = false): Promise<IBucketStats> => {
    const res = await api.get<IBucketStats>('/admin/storage/info', {
      rescan: rescan ? 'true' : undefined,
    });
    return (res as any)?.data || res;
  },

  createFolder: async (folder: string): Promise<{ folder: string }> => {
    const res = await api.post<{ folder: string }>('/admin/storage/create-folder', { folder });
    return (res as any)?.data || res;
  },

  presignUpload: async (
    key: string,
    contentType: string,
    sizeBytes: number
  ): Promise<{ uploadUrl: string; publicUrl: string; key: string }> => {
    const res = await api.post<{ uploadUrl: string; publicUrl: string; key: string }>(
      '/admin/storage/presign-upload',
      { key, contentType, sizeBytes }
    );
    return (res as any)?.data || res;
  },

  presignDownload: async (key: string, ttl = 300): Promise<{ url: string; key: string }> => {
    const res = await api.get<{ url: string; key: string }>('/admin/storage/presign-download', {
      key,
      ttl,
    });
    return (res as any)?.data || res;
  },

  copyObject: async (sourceKey: string, destKey: string): Promise<void> => {
    await api.post('/admin/storage/copy', { sourceKey, destKey });
  },

  moveObject: async (sourceKey: string, destKey: string): Promise<void> => {
    await api.post('/admin/storage/move', { sourceKey, destKey });
  },

  deleteObject: async (
    key: string,
    permanent = false,
    reauthToken?: string
  ): Promise<{ action: string; key: string; trashKey?: string }> => {
    const headers = reauthToken ? { 'X-Reauth-Token': reauthToken } : undefined;
    const res = await api.post<{ action: string; key: string; trashKey?: string }>(
      '/admin/storage/delete',
      { key, permanent },
      { headers }
    );
    return (res as any)?.data || res;
  },

  deleteMany: async (
    keys: string[],
    permanent = false,
    reauthToken?: string
  ): Promise<{ deleted: number; keys: string[] }> => {
    const headers = reauthToken ? { 'X-Reauth-Token': reauthToken } : undefined;
    const res = await api.post<{ deleted: number; keys: string[] }>(
      '/admin/storage/delete-many',
      { keys, permanent },
      { headers }
    );
    return (res as any)?.data || res;
  },

  deletePrefix: async (
    prefix: string,
    permanent = false,
    reauthToken?: string
  ): Promise<{ deleted: number; folder: string }> => {
    const headers = reauthToken ? { 'X-Reauth-Token': reauthToken } : undefined;
    const res = await api.post<{ deleted: number; folder: string }>(
      '/admin/storage/delete-prefix',
      { prefix, permanent },
      { headers }
    );
    return (res as any)?.data || res;
  },

  updateMetadata: async (
    key: string,
    updates: {
      contentType?: string;
      cacheControl?: string;
      contentDisposition?: string;
      customMetadata?: Record<string, string>;
    }
  ): Promise<void> => {
    await api.patch('/admin/storage/metadata', { key, ...updates });
  },

  downloadZip: async (keys: string[]): Promise<Blob> => {
    const baseUrl = (api as any).baseURL || '/api';
    const response = await fetch(`${baseUrl}/admin/storage/download-zip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
      },
      body: JSON.stringify({ keys }),
    });

    if (!response.ok) {
      throw new Error(`Failed to download zip: ${response.statusText}`);
    }
    return response.blob();
  },

  syncCheck: async (): Promise<ISyncCheckResult> => {
    const res = await api.get<ISyncCheckResult>('/admin/storage/sync-check');
    return (res as any)?.data || res;
  },

  coverageReport: async (): Promise<ICoverageItem[]> => {
    const res = await api.get<ICoverageItem[]>('/admin/storage/coverage');
    return (res as any)?.data || res;
  },

  listTrash: async (page = 1, limit = 20): Promise<{ items: IStorageTrashItem[]; meta: any }> => {
    const res = await api.get<{ items: IStorageTrashItem[]; meta: any }>('/admin/storage/trash', {
      page,
      limit,
    });
    return (res as any)?.data || res;
  },

  restoreTrash: async (trashId: string): Promise<void> => {
    await api.post('/admin/storage/trash/restore', { trashId });
  },

  emptyTrash: async (reauthToken?: string): Promise<{ deletedCount: number }> => {
    const headers = reauthToken ? { 'X-Reauth-Token': reauthToken } : undefined;
    const res = await api.post<{ deletedCount: number }>(
      '/admin/storage/trash/empty',
      {},
      { headers }
    );
    return (res as any)?.data || res;
  },
};

