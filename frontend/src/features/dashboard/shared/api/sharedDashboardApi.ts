import { api } from '../../../../lib/api';
import type {
  IBookmark,
  IGarden,
  ISupportRequest,
  IDashboardSearchResult,
} from '../types';

// ── Bookmarks API ─────────────────────────────────────────

export async function getBookmarks(
  type?: string,
  page = 1,
  limit = 20,
): Promise<{ bookmarks: IBookmark[]; meta?: { page: number; limit: number; total: number; totalPages: number } }> {
  const res = await api.get<IBookmark[]>('/users/me/bookmarks', {
    type: type === 'ALL' ? undefined : type,
    page,
    limit,
  });

  return {
    bookmarks: Array.isArray(res.data) ? res.data : [],
    meta: res.meta,
  };
}

export async function addBookmark(
  entityType: 'PLANT' | 'REMEDY' | 'TOUR' | 'ARTICLE',
  entityId: string,
): Promise<IBookmark> {
  const res = await api.post<IBookmark>('/users/me/bookmarks', {
    entityType,
    entityId,
  });
  return res.data;
}

export async function removeBookmark(id: string): Promise<void> {
  await api.delete(`/users/me/bookmarks/${id}`);
}

export async function removeBookmarkByEntity(type: string, entityId: string): Promise<void> {
  await api.delete(`/users/me/bookmarks/entity/${type}/${entityId}`);
}

// ── Garden API ────────────────────────────────────────────

export async function getGarden(): Promise<IGarden> {
  const res = await api.get<IGarden>('/users/me/garden');
  return res.data;
}

export async function addPlantToGarden(
  plantId: string,
  position?: { x: number; y: number; z: number },
): Promise<IGarden> {
  const res = await api.post<IGarden>('/users/me/garden/plants', {
    plantId,
    position,
  });
  return res.data;
}

export async function updateGardenPlant(
  pid: string,
  data: {
    growthStage?: string;
    notes?: string;
    position?: { x: number; y: number; z: number };
  },
): Promise<IGarden> {
  const res = await api.patch<IGarden>(`/users/me/garden/plants/${pid}`, data);
  return res.data;
}

export async function removeGardenPlant(pid: string): Promise<IGarden> {
  const res = await api.delete<IGarden>(`/users/me/garden/plants/${pid}`);
  return res.data;
}

// ── Profile & Auth API ────────────────────────────────────

export async function getProfile(): Promise<any> {
  const res = await api.get('/users/me');
  return res.data;
}

export async function updateProfile(data: { displayName?: string; name?: string; bio?: string }): Promise<any> {
  const res = await api.patch('/users/me', data);
  return res.data;
}

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string; [key: string]: unknown }> {
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await api.upload<{ avatarUrl: string; [key: string]: unknown }>('/users/me/avatar', formData);
  return res.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}

export async function logoutAllDevices(): Promise<void> {
  await api.post('/auth/logout-all');
}

export async function deleteAccount(confirmation: { password?: string; confirmation?: string }): Promise<void> {
  await api.delete('/users/me', confirmation);
}

// ── Support API ───────────────────────────────────────────

export async function submitSupportRequest(subject: string, message: string): Promise<ISupportRequest> {
  const res = await api.post<ISupportRequest>('/support/requests', { subject, message });
  return res.data;
}

export async function getMySupportRequests(): Promise<ISupportRequest[]> {
  const res = await api.get<ISupportRequest[]>('/support/requests/mine');
  return Array.isArray(res.data) ? res.data : [];
}

// ── Grouped Header Search API ─────────────────────────────

export async function searchDashboardGrouped(query: string): Promise<IDashboardSearchResult> {
  if (!query || query.trim().length === 0) {
    return { plants: [], remedies: [] };
  }

  const clean = query.trim();
  const [plantsRes, remediesRes] = await Promise.all([
    api.get<any[]>('/plants/autocomplete', { q: clean }).catch(() => ({ data: [] })),
    api.get<any[]>('/remedies', { q: clean, limit: 5 }).catch(() => ({ data: [] })),
  ]);

  const plants = Array.isArray(plantsRes.data)
    ? plantsRes.data.map((p) => ({
        id: p.id || p._id,
        commonName: p.commonName,
        scientificName: p.scientificName,
        slug: p.slug,
      }))
    : [];

  const remedies = Array.isArray(remediesRes.data)
    ? remediesRes.data.map((r) => ({
        id: r._id || r.id,
        title: r.title,
        summary: r.summary || r.description?.slice(0, 80),
        slug: r.slug,
      }))
    : [];

  return { plants, remedies };
}
