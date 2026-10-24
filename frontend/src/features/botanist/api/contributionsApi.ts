import { api } from '../../../lib/api';
import type {
  IContributionSummary,
  IContributionItem,
  IPlantDraftInput,
  IRemedyDraftInput,
  IAIFeedbackQueueItem,
  IAIFeedbackStats,
  FeedbackVerdict,
} from '../types';

export interface ContributionListParams {
  type?: 'plant' | 'remedy';
  status?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ContributionListResult {
  items: IContributionItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getContributionSummary(): Promise<IContributionSummary> {
  const res = await api.get<IContributionSummary>('/contributions/summary');
  return res.data;
}

export async function listContributions(
  params: ContributionListParams = {},
): Promise<ContributionListResult> {
  const res = await api.get<IContributionItem[]>('/contributions', {
    type: params.type,
    status: params.status,
    q: params.q,
    sort: params.sort,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });

  return {
    items: Array.isArray(res.data) ? res.data : [],
    meta: res.meta ?? {
      page: 1,
      limit: 20,
      total: Array.isArray(res.data) ? res.data.length : 0,
      totalPages: 1,
    },
  };
}

export async function getContribution(
  type: 'plant' | 'remedy',
  id: string,
): Promise<IContributionItem & { rawDoc: unknown; data: unknown }> {
  const res = await api.get<any>(
    `/contributions/${type}/${id}`,
  );
  const dataObj = res.data?.data || res.data?.rawDoc || res.data;
  return {
    ...res.data,
    rawDoc: dataObj,
    data: dataObj,
  };
}

export async function submitContribution(
  type: 'plant' | 'remedy',
  id: string,
): Promise<{ message: string; status: string }> {
  const res = await api.post<{ message: string; status: string }>(
    `/contributions/${type}/${id}/submit`,
  );
  return res.data;
}

export async function withdrawContribution(
  type: 'plant' | 'remedy',
  id: string,
): Promise<{ message: string; status: string }> {
  const res = await api.post<{ message: string; status: string }>(
    `/contributions/${type}/${id}/withdraw`,
  );
  return res.data;
}

export async function deleteContribution(
  type: 'plant' | 'remedy',
  id: string,
): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/contributions/${type}/${id}`);
  return res.data;
}

export async function requestCorrection(
  type: 'plant' | 'remedy',
  id: string,
  note: string,
): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>(
    `/contributions/${type}/${id}/correction-request`,
    { note },
  );
  return res.data;
}

// ── Plant Draft Creation & Updates ─────────────────────────

export async function createPlantDraft(
  data: Partial<IPlantDraftInput>,
): Promise<{ _id: string; slug: string; [key: string]: unknown }> {
  const res = await api.post<{ _id: string; slug: string; [key: string]: unknown }>(
    '/plants',
    data,
  );
  return res.data;
}

export async function updatePlantDraft(
  id: string,
  data: Partial<IPlantDraftInput>,
): Promise<unknown> {
  const res = await api.put(`/plants/${id}`, data);
  return res.data;
}

export async function uploadPlantImage(
  id: string,
  file: File,
): Promise<{ url: string; [key: string]: unknown }> {
  const formData = new FormData();
  formData.append('images', file);
  formData.append('image', file);
  const res = await api.upload<any>(
    `/plants/${id}/images`,
    formData,
  );
  if (Array.isArray(res.data)) {
    const item = res.data[0];
    return { ...item, url: item?.url || item?.fullUrl || item?.cardUrl || '' };
  }
  return { ...res.data, url: res.data?.url || res.data?.fullUrl || '' };
}

export async function uploadPlantModel(
  id: string,
  file: File,
  lod: 'lod0' | 'lod1' | 'lod2' = 'lod0',
): Promise<unknown> {
  const formData = new FormData();
  formData.append('model', file);
  formData.append('lod', lod);
  const res = await api.upload(`/plants/${id}/model`, formData);
  return res.data;
}

// ── Remedy Draft Creation & Updates ────────────────────────

export async function createRemedyDraft(
  data: Partial<IRemedyDraftInput>,
): Promise<{ _id: string; slug: string; [key: string]: unknown }> {
  const res = await api.post<{ _id: string; slug: string; [key: string]: unknown }>(
    '/remedies',
    data,
  );
  return res.data;
}

export async function updateRemedyDraft(
  id: string,
  data: Partial<IRemedyDraftInput>,
): Promise<unknown> {
  const res = await api.put(`/remedies/${id}`, data);
  return res.data;
}

export async function uploadRemedyCover(
  id: string,
  file: File,
): Promise<{ url: string; [key: string]: unknown }> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.upload<any>(
    `/remedies/${id}/image`,
    formData,
  );
  const url = res.data?.url || res.data?.imageUrl || '';
  return { ...res.data, url };
}

// ── AI Feedback Queue ─────────────────────────────────────

export interface AIFeedbackQueueParams {
  state?: 'pending' | 'reviewed' | 'all';
  confidence?: 'low' | 'all';
  isPlant?: boolean;
  page?: number;
  limit?: number;
}

export async function getAIFeedbackQueue(
  params: AIFeedbackQueueParams = {},
): Promise<{ items: IAIFeedbackQueueItem[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const res = await api.get<IAIFeedbackQueueItem[]>('/ai/feedback-queue', {
    state: params.state,
    confidence: params.confidence,
    isPlant: params.isPlant !== undefined ? String(params.isPlant) : undefined,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });

  return {
    items: Array.isArray(res.data) ? res.data : [],
    meta: res.meta ?? {
      page: 1,
      limit: 20,
      total: Array.isArray(res.data) ? res.data.length : 0,
      totalPages: 1,
    },
  };
}

export async function submitAIFeedback(
  id: string,
  data: {
    verdict: FeedbackVerdict;
    correctPlantId?: string;
    comment?: string;
  },
): Promise<unknown> {
  const res = await api.post(`/ai/detect/${id}/feedback`, data);
  return res.data;
}

export async function getAIFeedbackStats(): Promise<IAIFeedbackStats> {
  const res = await api.get<IAIFeedbackStats>('/ai/feedback-stats');
  return res.data;
}

// ── Library Autocomplete for plant picker & duplicate check ──

export async function searchPlantsAutocomplete(
  query: string,
): Promise<{ id: string; commonName: string; scientificName: string; slug: string }[]> {
  if (!query || query.trim().length === 0) return [];
  const res = await api.get<{ id: string; commonName: string; scientificName: string; slug: string }[]>(
    '/plants/autocomplete',
    { q: query.trim() },
  );
  return Array.isArray(res.data) ? res.data : [];
}
