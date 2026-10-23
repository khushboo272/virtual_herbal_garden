import { api } from '../../../lib/api';
import type {
  Tour,
  TourListParams,
  TourListResponse,
  TourProgress,
  QuizSubmissionResult,
  TourAdminListItem,
  TourAdminAnalytics,
  TourDetailAnalytics,
} from '../types/tour.types';

export async function listTours(
  params: TourListParams = {},
  signal?: AbortSignal,
): Promise<TourListResponse> {
  const queryParams: Record<string, string | number | undefined> = {
    page: params.page ?? 1,
    limit: params.limit ?? 12,
    sort: params.sort ?? 'featured',
  };

  if (params.q) queryParams.q = params.q;
  if (params.health) queryParams.health = params.health;
  if (params.level) queryParams.level = params.level;
  if (params.plant) queryParams.plant = params.plant;

  const res = await api.get<Tour[]>('/tours', queryParams, { signal });

  return {
    tours: Array.isArray(res.data) ? res.data : [],
    meta: (res.meta ?? {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 1,
      facets: { health: [], level: [] },
    }) as TourListResponse['meta'],
  };
}

export async function getTour(
  slugOrId: string,
  preview = false,
  signal?: AbortSignal,
): Promise<Tour> {
  const query = preview ? { preview: '1' } : undefined;
  const res = await api.get<Tour>(`/tours/${slugOrId}`, query, { signal });
  return res.data;
}

export async function getMeProgress(): Promise<TourProgress[]> {
  const res = await api.get<TourProgress[]>('/tours/me/progress');
  return Array.isArray(res.data) ? res.data : [];
}

export async function getTourProgress(slug: string): Promise<TourProgress> {
  const res = await api.get<TourProgress>(`/tours/${slug}/progress`);
  return res.data;
}

export async function completeCheckpoint(slug: string, key: string): Promise<TourProgress> {
  const res = await api.post<TourProgress>(`/tours/${slug}/checkpoints/${key}/complete`, {});
  return res.data;
}

export async function submitQuiz(
  slug: string,
  key: string,
  answers: number[],
): Promise<QuizSubmissionResult> {
  const res = await api.post<QuizSubmissionResult>(`/tours/${slug}/checkpoints/${key}/quiz`, {
    answers,
  });
  return res.data;
}

export async function syncProgress(slug: string, completedKeys: string[]): Promise<TourProgress> {
  const res = await api.post<TourProgress>(`/tours/${slug}/progress/sync`, { completedKeys });
  return res.data;
}

export async function rateTour(
  slug: string,
  rating: number,
  comment?: string,
): Promise<{ message: string; rating: number }> {
  const res = await api.post<{ message: string; rating: number }>(`/tours/${slug}/rating`, {
    rating,
    comment,
  });
  return res.data;
}

export async function restartTour(slug: string): Promise<TourProgress> {
  const res = await api.delete<TourProgress>(`/tours/${slug}/progress`);
  return res.data;
}

// ── Admin Endpoints ──
export async function getAdminToursList(): Promise<TourAdminListItem[]> {
  const res = await api.get<TourAdminListItem[]>('/tours/admin/list');
  return Array.isArray(res.data) ? res.data : [];
}

export async function getAdminAnalytics(): Promise<TourAdminAnalytics> {
  const res = await api.get<TourAdminAnalytics>('/tours/admin/analytics');
  return res.data;
}

export async function getTourAnalytics(id: string): Promise<TourDetailAnalytics> {
  const res = await api.get<TourDetailAnalytics>(`/tours/${id}/analytics`);
  return res.data;
}

export async function createTour(data: Partial<Tour>): Promise<Tour> {
  const res = await api.post<Tour>('/tours', data);
  return res.data;
}

export async function updateTour(id: string, data: Partial<Tour>): Promise<Tour> {
  const res = await api.patch<Tour>(`/tours/${id}`, data);
  return res.data;
}

export async function publishTour(id: string): Promise<Tour> {
  const res = await api.patch<Tour>(`/tours/${id}/publish`, {});
  return res.data;
}

export async function unpublishTour(id: string): Promise<Tour> {
  const res = await api.patch<Tour>(`/tours/${id}/unpublish`, {});
  return res.data;
}

export async function deleteTour(id: string): Promise<void> {
  await api.delete(`/tours/${id}`);
}

export async function uploadTourCover(
  id: string,
  file: File,
): Promise<{ coverImage: string; coverThumb: string }> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.upload<{ coverImage: string; coverThumb: string }>(
    `/tours/${id}/cover`,
    formData,
  );
  return res.data;
}

export async function deleteTourCover(id: string): Promise<void> {
  await api.delete(`/tours/${id}/cover`);
}

export async function uploadCheckpointImage(
  id: string,
  key: string,
  file: File,
): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.upload<{ imageUrl: string }>(
    `/tours/${id}/checkpoints/${key}/image`,
    formData,
  );
  return res.data;
}

/**
 * Returns up to 3 tours featuring a given plant slug.
 * Exported from barrel for cross-module integration (PlantDetailPage).
 */
export async function getToursByPlant(plantSlug: string): Promise<Tour[]> {
  try {
    const res = await listTours({ plant: plantSlug, limit: 3 });
    return res.tours;
  } catch {
    return [];
  }
}
