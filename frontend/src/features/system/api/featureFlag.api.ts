import { api } from '../../../lib/api';
import {
  IFeatureFlag,
  IFeatureFlagsResponse,
  ICreateFeatureFlagPayload,
  IUpdateFeatureFlagPayload,
} from '../types/featureFlag.types';

export const featureFlagApi = {
  getFeatureFlags: async (): Promise<IFeatureFlagsResponse> => {
    const res = await api.get<IFeatureFlagsResponse>('/system/feature-flags');
    return res.data;
  },

  updateFeatureFlag: async (
    key: string,
    payload: IUpdateFeatureFlagPayload
  ): Promise<IFeatureFlag> => {
    const res = await api.patch<IFeatureFlag>(`/system/feature-flags/${key}`, payload);
    return res.data;
  },

  createFeatureFlag: async (
    payload: ICreateFeatureFlagPayload
  ): Promise<IFeatureFlag> => {
    const res = await api.post<IFeatureFlag>('/system/feature-flags', payload);
    return res.data;
  },

  deleteFeatureFlag: async (key: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<{ success: boolean; message: string }>(
      `/system/feature-flags/${key}`
    );
    return res.data;
  },

  resetFeatureFlags: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<{ success: boolean; message: string }>(
      '/system/feature-flags/reset'
    );
    return res.data;
  },

  getMaintenanceStatus: async (): Promise<IMaintenanceStatus> => {
    const res = await api.get<IMaintenanceStatus>('/system/maintenance/status');
    return res.data;
  },

  updateMaintenanceConfig: async (payload: {
    isEnabled: boolean;
    reopenAt?: string | null;
    headline?: string;
    reason?: string;
    allowedRoles?: ('GUEST' | 'USER' | 'BOTANIST' | 'ADMIN' | 'SUPER_ADMIN')[];
  }): Promise<IFeatureFlag> => {
    const res = await api.patch<IFeatureFlag>('/system/feature-flags/maintenance_mode', {
      isEnabled: payload.isEnabled,
      metadata: {
        reopenAt: payload.reopenAt || null,
        headline: payload.headline || 'System Maintenance in Progress',
        reason: payload.reason || 'We are performing scheduled upgrades and maintenance.',
        allowedRoles: payload.allowedRoles || ['SUPER_ADMIN', 'ADMIN'],
      },
    });
    return res.data;
  },

  getPublicFlags: async (): Promise<Record<string, boolean>> => {
    const res = await api.get<Record<string, boolean>>('/system/flags/public');
    return res.data;
  },
};

