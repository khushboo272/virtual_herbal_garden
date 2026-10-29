import { api } from '../../../lib/api';
import type {
  DashboardSummaryData,
  ModerationSummary,
  ModerationQueueItem,
  ModerationItemDetail,
  ContentItem,
  ContentImpact,
  AdminUserListItem,
  AdminUserDetail,
  RoleApplicationItem,
  PaginationData,
  UserRole,
} from '../types/admin.types';
import {
  adminUsersResponseSchema,
  adminUserDetailSchema,
  moderationSummarySchema,
  moderationQueueResponseSchema,
  contentListResponseSchema,
  dashboardSummarySchema,
  roleApplicationsResponseSchema,
} from '../types/adminSchemas';

// --- Dashboard ---
export async function getDashboardSummary(): Promise<DashboardSummaryData> {
  const res = await api.get('/admin/dashboard-summary');
  const raw = res.data?.data || res.data;
  const parsed = dashboardSummarySchema.safeParse(raw);
  if (!parsed.success) {
    console.error('[adminApi] Failed to parse dashboard summary:', parsed.error);
    return raw;
  }
  return parsed.data as DashboardSummaryData;
}

// --- Moderation Queue ---
export async function getModerationSummary(): Promise<ModerationSummary> {
  const res = await api.get('/admin/moderation/summary');
  const raw = res.data?.data || res.data;
  const parsed = moderationSummarySchema.safeParse(raw);
  if (!parsed.success) {
    console.error('[adminApi] Failed to parse moderation summary:', parsed.error);
    return { plants: 0, remedies: 0, applications: 0, total: 0 };
  }
  return parsed.data;
}

export async function getModerationQueue(params: {
  type: 'plant' | 'remedy';
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: ModerationQueueItem[]; pagination: PaginationData }> {
  const res = await api.get('/admin/moderation', params);
  const raw = res.data;
  const dataObj = raw?.data !== undefined ? raw.data : raw;
  const rawItems = Array.isArray(dataObj)
    ? dataObj
    : Array.isArray(dataObj?.items)
    ? dataObj.items
    : Array.isArray(raw?.items)
    ? raw.items
    : [];
  const rawPagination =
    raw?.meta ||
    dataObj?.pagination ||
    raw?.pagination || { total: rawItems.length, page: params.page || 1, limit: params.limit || 20, totalPages: 1 };

  const parsed = moderationQueueResponseSchema.safeParse({
    items: rawItems,
    pagination: rawPagination,
  });

  if (!parsed.success) {
    console.error('[adminApi] Failed to parse moderation queue response:', parsed.error);
    throw new Error('Invalid moderation queue response format received from server.');
  }

  return parsed.data as { items: ModerationQueueItem[]; pagination: PaginationData };
}

export async function getModerationItemDetail(
  type: 'plant' | 'remedy',
  id: string,
): Promise<ModerationItemDetail> {
  const res = await api.get(`/admin/moderation/${type}/${id}`);
  return res.data?.data || res.data;
}

export async function approveModerationItem(
  type: 'plant' | 'remedy',
  id: string,
  data: { feature?: boolean; comment?: string } = {},
): Promise<{ message: string }> {
  const res = await api.post(`/admin/moderation/${type}/${id}/approve`, data);
  return res.data?.data || res.data;
}

export async function rejectModerationItem(
  type: 'plant' | 'remedy',
  id: string,
  data: { reason: string },
): Promise<{ message: string }> {
  const res = await api.post(`/admin/moderation/${type}/${id}/reject`, data);
  return res.data?.data || res.data;
}

export async function requestChangesModerationItem(
  type: 'plant' | 'remedy',
  id: string,
  data: { comment: string },
): Promise<{ message: string }> {
  const res = await api.post(`/admin/moderation/${type}/${id}/request-changes`, data);
  return res.data?.data || res.data;
}

// --- Content Management ---
export async function getContentList(
  type: 'plants' | 'remedies',
  params: {
    status?: string;
    owner?: string;
    featured?: boolean | string;
    q?: string;
    sort?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<{ items: ContentItem[]; pagination: PaginationData }> {
  const res = await api.get(`/admin/content/${type}`, params);
  const raw = res.data;
  const dataObj = raw?.data !== undefined ? raw.data : raw;
  const rawItems = Array.isArray(dataObj)
    ? dataObj
    : Array.isArray(dataObj?.items)
    ? dataObj.items
    : [];
  const rawPagination =
    raw?.meta ||
    dataObj?.pagination ||
    raw?.pagination || { total: rawItems.length, page: params.page || 1, limit: params.limit || 20, totalPages: 1 };

  const parsed = contentListResponseSchema.safeParse({
    items: rawItems,
    pagination: rawPagination,
  });

  if (!parsed.success) {
    console.error('[adminApi] Failed to parse content list response:', parsed.error);
    throw new Error('Invalid content list format received from server.');
  }

  return parsed.data as { items: ContentItem[]; pagination: PaginationData };
}

export async function publishContent(type: 'plants' | 'remedies', id: string): Promise<any> {
  const res = await api.post(`/admin/content/${type}/${id}/publish`);
  return res.data?.data || res.data;
}

export async function unpublishContent(type: 'plants' | 'remedies', id: string): Promise<any> {
  const res = await api.post(`/admin/content/${type}/${id}/unpublish`);
  return res.data?.data || res.data;
}

export async function toggleFeatureContent(type: 'plants' | 'remedies', id: string): Promise<any> {
  const res = await api.post(`/admin/content/${type}/${id}/toggle-feature`);
  return res.data?.data || res.data;
}

export async function getContentImpact(type: 'plants' | 'remedies', id: string): Promise<ContentImpact> {
  const res = await api.get(`/admin/content/${type}/${id}/impact`);
  return res.data?.data || res.data;
}

export async function deleteContent(
  type: 'plants' | 'remedies',
  id: string,
  confirmSlug: string,
): Promise<any> {
  const res = await api.delete(`/admin/content/${type}/${id}`, { data: { confirmSlug } });
  return res.data?.data || res.data;
}

export async function bulkUnpublishContent(
  type: 'plants' | 'remedies',
  ids: string[],
): Promise<{ processed: number; success: boolean }> {
  const res = await api.post(`/admin/content/${type}/bulk-unpublish`, { ids });
  return res.data?.data || res.data;
}

export async function bulkPublishContent(
  type: 'plants' | 'remedies',
  ids: string[],
): Promise<{ processed: number; success: boolean }> {
  const res = await api.post(`/admin/content/${type}/bulk-publish`, { ids });
  return res.data?.data || res.data;
}

export async function bulkFeatureContent(
  type: 'plants' | 'remedies',
  ids: string[],
  isFeatured: boolean,
): Promise<{ processed: number; success: boolean }> {
  const res = await api.post(`/admin/content/${type}/bulk-feature`, { ids, isFeatured });
  return res.data?.data || res.data;
}

export async function bulkStatusContent(
  type: 'plants' | 'remedies',
  ids: string[],
  status: string,
): Promise<{ processed: number; success: boolean }> {
  const res = await api.post(`/admin/content/${type}/bulk-status`, { ids, status });
  return res.data?.data || res.data;
}

export async function bulkDeleteContent(
  type: 'plants' | 'remedies',
  ids: string[],
): Promise<{ processed: number; success: boolean }> {
  const res = await api.post(`/admin/content/${type}/bulk-delete`, { ids });
  return res.data?.data || res.data;
}

// --- User Management ---
export async function getAdminUsers(params: {
  q?: string;
  role?: string;
  status?: string;
  provider?: string;
  sort?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ items: AdminUserListItem[]; pagination: PaginationData; activeToday?: number; activeThisWeek?: number }> {
  const res = await api.get('/admin/users', params);
  const raw = res.data;
  const dataObj = raw?.data !== undefined ? raw.data : raw;

  const rawItems = Array.isArray(dataObj?.items)
    ? dataObj.items
    : Array.isArray(dataObj?.users)
    ? dataObj.users
    : Array.isArray(dataObj)
    ? dataObj
    : [];

  const rawPagination =
    raw?.meta ||
    dataObj?.pagination ||
    dataObj?.meta || {
      total: rawItems.length,
      page: params.page || 1,
      limit: params.limit || 20,
      totalPages: Math.ceil(rawItems.length / (params.limit || 20)) || 1,
    };

  const parsed = adminUsersResponseSchema.safeParse({
    items: rawItems,
    pagination: rawPagination,
    activeToday: dataObj?.activeToday ?? 0,
    activeThisWeek: dataObj?.activeThisWeek ?? 0,
  });

  if (!parsed.success) {
    console.error('[adminApi] Failed to parse admin users response:', parsed.error);
    throw new Error('Invalid users response format received from server.');
  }

  return parsed.data as { items: AdminUserListItem[]; pagination: PaginationData; activeToday?: number; activeThisWeek?: number };
}

export async function getAdminUserDetail(id: string): Promise<AdminUserDetail> {
  const res = await api.get(`/admin/users/${id}`);
  const raw = res.data;
  const data = raw?.data || raw;
  const parsed = adminUserDetailSchema.safeParse(data);
  if (!parsed.success) {
    console.warn('[adminApi] User detail schema warning:', parsed.error);
    return data as AdminUserDetail;
  }
  return parsed.data as AdminUserDetail;
}

export async function updateUserRole(id: string, role: UserRole): Promise<any> {
  const res = await api.patch(`/admin/users/${id}/role`, { role });
  return res.data?.data || res.data;
}

export async function banUser(
  id: string,
  data: { isActive: boolean; banReason?: string; bannedUntil?: string | null },
): Promise<any> {
  const res = await api.patch(`/admin/users/${id}/ban`, data);
  return res.data?.data || res.data;
}

export async function forceLogoutUser(id: string): Promise<any> {
  const res = await api.post(`/admin/users/${id}/force-logout`);
  return res.data?.data || res.data;
}

// --- Role Applications ---
export async function getRoleApplications(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ items: RoleApplicationItem[]; pagination: PaginationData }> {
  const res = await api.get('/admin/role-applications', params);
  const raw = res.data;
  const dataObj = raw?.data !== undefined ? raw.data : raw;
  const rawItems = Array.isArray(dataObj)
    ? dataObj
    : Array.isArray(dataObj?.items)
    ? dataObj.items
    : [];
  const rawPagination =
    raw?.meta ||
    dataObj?.pagination ||
    raw?.pagination || { total: rawItems.length, page: params.page || 1, limit: params.limit || 20, totalPages: 1 };

  const parsed = roleApplicationsResponseSchema.safeParse({
    items: rawItems,
    pagination: rawPagination,
  });

  if (!parsed.success) {
    console.error('[adminApi] Failed to parse role applications response:', parsed.error);
    throw new Error('Invalid role applications format received from server.');
  }

  return parsed.data as { items: RoleApplicationItem[]; pagination: PaginationData };
}

export async function approveRoleApplication(id: string, note?: string): Promise<any> {
  const res = await api.post(`/admin/role-applications/${id}/approve`, { note });
  return res.data?.data || res.data;
}

export async function rejectRoleApplication(id: string, reason: string): Promise<any> {
  const res = await api.post(`/admin/role-applications/${id}/reject`, { reason });
  return res.data?.data || res.data;
}

// --- User-Facing Contributor Application ---
export async function submitRoleApplication(data: {
  motivation: string;
  qualifications: string;
  links?: string[];
}): Promise<any> {
  const res = await api.post('/role-applications', data);
  return res.data?.data || res.data;
}

export async function getMyRoleApplication(): Promise<RoleApplicationItem | null> {
  const res = await api.get('/role-applications/mine');
  return res.data?.data || res.data;
}
