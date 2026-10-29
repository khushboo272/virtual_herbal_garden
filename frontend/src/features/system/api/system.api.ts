import { api } from '../../../lib/api';
import {
  ICapability,
  IAdminAccount,
  IAuditLogItem,
  IAuditSummary,
  ISecurityEvents,
  ISessionItem,
  INotificationPreferences,
  ITwoFactorStatus,
  SystemRole,
  ISystemOverview,
  ISubsystemPings,
} from '../types/system.types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const systemApi = {
  // ── Role Management & Permissions ──
  getRolesMatrix: async () => {
    const res = await api.get<{ capabilities: ICapability[]; hierarchy: Record<string, number> }>('/system/roles/matrix');
    return res.data;
  },

  getAdmins: async () => {
    const res = await api.get<IAdminAccount[]>('/system/admins');
    return res.data;
  },

  updateUserRole: async (id: string, role: SystemRole, reauthToken?: string) => {
    const res = await api.patch<{ id: string; role: SystemRole; displayName: string }>(
      `/system/users/${id}/role`,
      { role },
      { headers: reauthToken ? { 'x-reauth-token': reauthToken } : undefined },
    );
    return res.data;
  },

  getUserSessions: async (userId: string) => {
    const res = await api.get<ISessionItem[]>(`/system/users/${userId}/sessions`);
    return res.data;
  },

  revokeUserSession: async (userId: string, sessionId: string, reauthToken: string) => {
    const res = await api.delete<{ message: string }>(
      `/system/users/${userId}/sessions/${sessionId}`,
      undefined,
      { headers: { 'x-reauth-token': reauthToken } },
    );
    return res.data;
  },

  // ── Audit Logs ──
  getAuditLogs: async (params: {
    actor?: string;
    action?: string;
    targetType?: string;
    severity?: string;
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get<IAuditLogItem[]>('/system/audit-logs', params as any);
    return {
      logs: res.data || [],
      meta: res.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  getAuditLogDetail: async (id: string) => {
    const res = await api.get<IAuditLogItem>(`/system/audit-logs/${id}`);
    return res.data;
  },

  getAuditSummary: async () => {
    const res = await api.get<IAuditSummary>('/system/audit/summary');
    return res.data;
  },

  exportAuditLogsCsv: async (params: Record<string, any>, reauthToken: string) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') query.append(key, String(val));
    });

    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE}/system/audit-logs/export.csv?${query.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'x-reauth-token': reauthToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to export audit logs');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  getSecurityEvents: async () => {
    const res = await api.get<ISecurityEvents>('/system/security/events');
    return res.data;
  },

  // ── Step-Up & 2FA ──
  reauth: async (password?: string, totpCode?: string) => {
    const res = await api.post<{ reauthToken: string }>('/auth/reauth', { password, totpCode });
    return res.data;
  },

  get2faStatus: async () => {
    const res = await api.get<ITwoFactorStatus>('/auth/2fa/status');
    return res.data;
  },

  setup2fa: async () => {
    const res = await api.post<{ secret: string; otpauthUrl: string; qrCodeUrl: string }>('/auth/2fa/setup');
    return res.data;
  },

  verify2fa: async (totpCode: string) => {
    const res = await api.post<{ message: string; backupCodes: string[] }>('/auth/2fa/verify', { totpCode });
    return res.data;
  },

  regenerateBackupCodes: async (reauthToken: string) => {
    const res = await api.post<{ backupCodes: string[] }>(
      '/auth/2fa/regenerate-backup-codes',
      {},
      { headers: { 'x-reauth-token': reauthToken } },
    );
    return res.data;
  },

  disable2fa: async (code: string, reauthToken: string) => {
    const res = await api.post<{ message: string }>(
      '/auth/2fa/disable',
      { code },
      { headers: { 'x-reauth-token': reauthToken } },
    );
    return res.data;
  },

  // ── Sessions & Preferences (Shared) ──
  getMySessions: async () => {
    const res = await api.get<ISessionItem[]>('/users/me/sessions');
    return res.data;
  },

  deleteMySession: async (id: string) => {
    const res = await api.delete<{ message: string }>(`/users/me/sessions/${id}`);
    return res.data;
  },

  revokeOtherSessions: async () => {
    const res = await api.post<{ message: string }>('/users/me/sessions/revoke-others');
    return res.data;
  },

  getMyPreferences: async () => {
    const res = await api.get<INotificationPreferences>('/users/me/preferences');
    return res.data;
  },

  updateMyPreferences: async (preferences: Partial<INotificationPreferences>) => {
    const res = await api.patch<INotificationPreferences>('/users/me/preferences', preferences);
    return res.data;
  },

  getMyLoginHistory: async () => {
    const res = await api.get<any[]>('/users/me/login-history');
    return res.data;
  },

  adminSearch: async (q: string) => {
    const res = await api.get<{ users: any[]; tours: any[] }>('/admin/search', { q });
    return res.data;
  },

  // ── System Overview & Operations ──
  getSystemOverview: async () => {
    const res = await api.get<ISystemOverview>('/system/overview');
    return res.data;
  },

  pingSubsystems: async () => {
    const res = await api.post<ISubsystemPings>('/system/operations/ping-subsystems');
    return res.data;
  },

  clearSystemCache: async () => {
    const res = await api.post<{ success: boolean; message: string; timestamp: string }>('/system/operations/clear-cache');
    return res.data;
  },

  purgeExpiredSessions: async () => {
    const res = await api.post<{ success: boolean; purgedCount: number; message: string; timestamp: string }>('/system/operations/purge-expired-sessions');
    return res.data;
  },
};

