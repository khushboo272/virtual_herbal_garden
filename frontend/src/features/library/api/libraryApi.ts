import { api } from '../../../lib/api';
import type {
  LibraryPlant,
  SearchResult,
  AutocompleteResult,
  PlantReview,
  SearchParams,
} from '../types/library.types';

// ── Plant list / search ───────────────────────────────────────────────────

export async function searchPlants(
  params: SearchParams,
  signal?: AbortSignal,
): Promise<SearchResult> {
  const query: Record<string, string | number | undefined> = {
    q: params.q,
    medicinalUse: params.medicinalUse,
    region: params.region,
    type: params.type,
    category: params.category,
    sort: params.sort,
    page: params.page,
    limit: params.limit ?? 12,
  };
  // Strip undefined keys
  Object.keys(query).forEach((k) => query[k] === undefined && delete query[k]);

  const res = await api.get<LibraryPlant[]>('/plants', query, { signal });
  return {
    plants: Array.isArray(res.data) ? res.data : [],
    meta: res.meta as SearchResult['meta'],
  };
}

// ── Single plant ──────────────────────────────────────────────────────────

export async function getPlant(
  slugOrId: string,
  signal?: AbortSignal,
): Promise<LibraryPlant> {
  const res = await api.get<LibraryPlant>(`/plants/${slugOrId}`, undefined, { signal });
  return res.data;
}

// ── Autocomplete ──────────────────────────────────────────────────────────

export async function getAutocomplete(
  q: string,
  signal?: AbortSignal,
): Promise<AutocompleteResult[]> {
  if (!q || q.trim().length < 1) return [];
  const res = await api.get<AutocompleteResult[]>('/plants/search/autocomplete', { q }, { signal });
  return Array.isArray(res.data) ? res.data : [];
}

// ── Related plants ────────────────────────────────────────────────────────

export async function getRelated(
  plantId: string,
  signal?: AbortSignal,
): Promise<LibraryPlant[]> {
  const res = await api.get<LibraryPlant[]>(`/plants/${plantId}/related`, undefined, { signal });
  return Array.isArray(res.data) ? res.data : [];
}

// ── Reviews ───────────────────────────────────────────────────────────────

export async function getReviews(
  plantId: string,
  page = 1,
  limit = 20,
  signal?: AbortSignal,
): Promise<{ reviews: PlantReview[]; meta: { total: number; totalPages: number } }> {
  const res = await api.get<PlantReview[]>(`/plants/${plantId}/reviews`, { page, limit }, { signal });
  return {
    reviews: Array.isArray(res.data) ? res.data : [],
    meta: (res.meta ?? { total: 0, totalPages: 1 }) as { total: number; totalPages: number },
  };
}

export async function postReview(
  plantId: string,
  body: { rating: number; title?: string; body?: string },
): Promise<PlantReview> {
  const res = await api.post<PlantReview>(`/plants/${plantId}/reviews`, body);
  return res.data;
}

// ── Favorites (bookmarks) ─────────────────────────────────────────────────

export async function addFavorite(plantId: string): Promise<{ _id: string }> {
  const res = await api.post<{ _id: string }>('/users/me/bookmarks', {
    entityType: 'PLANT',
    entityId: plantId,
  });
  return res.data;
}

export async function removeFavorite(bookmarkId: string): Promise<void> {
  await api.delete(`/users/me/bookmarks/${bookmarkId}`);
}

export async function getBookmarks(): Promise<
  { _id: string; entityId: string; entityType: string }[]
> {
  const res = await api.get<{ _id: string; entityId: string; entityType: string }[]>(
    '/users/me/bookmarks',
  );
  return Array.isArray(res.data) ? res.data : [];
}
