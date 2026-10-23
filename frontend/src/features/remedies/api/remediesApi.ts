import { api } from '../../../lib/api';
import type {
  Remedy,
  RemedySearchParams,
  RemedyMeta,
} from '../types/remedy.types';

export async function listRemedies(
  params: RemedySearchParams = {},
  signal?: AbortSignal,
): Promise<{ remedies: Remedy[]; meta: RemedyMeta }> {
  const queryParams: Record<string, string | number | undefined> = {
    page: params.page ?? 1,
    limit: params.limit ?? 12,
    sort: params.sort ?? 'newest',
  };

  if (params.q) queryParams.q = params.q;
  if (params.health) queryParams.health = params.health;
  if (params.difficulty) queryParams.difficulty = params.difficulty;
  if (params.usage) queryParams.usage = params.usage;
  if (params.plant) queryParams.plant = params.plant;

  const res = await api.get<Remedy[]>('/remedies', queryParams, { signal });

  return {
    remedies: Array.isArray(res.data) ? res.data : [],
    meta: (res.meta ?? {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 1,
    }) as RemedyMeta,
  };
}

export async function getRemedy(
  slugOrId: string,
  signal?: AbortSignal,
): Promise<Remedy> {
  const res = await api.get<Remedy>(`/remedies/${slugOrId}`, undefined, { signal });
  return res.data;
}

export async function getRelatedRemedies(
  idOrSlug: string,
  signal?: AbortSignal,
): Promise<Remedy[]> {
  const res = await api.get<Remedy[]>(`/remedies/${idOrSlug}/related`, undefined, { signal });
  return Array.isArray(res.data) ? res.data : [];
}

export async function getRemediesByPlant(
  plantSlugOrId: string,
  limit = 3,
  signal?: AbortSignal,
): Promise<Remedy[]> {
  const result = await listRemedies({ plant: plantSlugOrId, limit }, signal);
  return result.remedies;
}

// ── Bookmarks / Favorites ────────────────────────────────────────────────────

export async function addRemedyFavorite(remedyId: string): Promise<{ _id: string }> {
  const res = await api.post<{ _id: string }>('/users/me/bookmarks', {
    entityType: 'REMEDY',
    entityId: remedyId,
  });
  return res.data;
}

export async function removeRemedyFavorite(bookmarkId: string): Promise<void> {
  await api.delete(`/users/me/bookmarks/${bookmarkId}`);
}

export async function getRemedyBookmarks(): Promise<
  { _id: string; entityId: string; entityType: string }[]
> {
  const res = await api.get<{ _id: string; entityId: string; entityType: string }[]>(
    '/users/me/bookmarks',
    { entityType: 'REMEDY' },
  );
  return Array.isArray(res.data) ? res.data : [];
}

// ── Remedy Image Uploads ───────────────────────────────────────────────────

export async function uploadRemedyImage(id: string, file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.upload<{ imageUrl: string }>(`/remedies/${id}/image`, formData);
  return res.data;
}

export async function deleteRemedyImage(id: string): Promise<void> {
  await api.delete(`/remedies/${id}/image`);
}
