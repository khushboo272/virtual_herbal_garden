import { api } from '../../../lib/api';
import {
  ISystemConfiguration,
  IUpdateSystemConfigPayload,
  ITestAIResponse,
} from '../types/systemConfig.types';

export const systemConfigApi = {
  getSystemConfig: async (): Promise<ISystemConfiguration> => {
    const res = await api.get<ISystemConfiguration>('/system/config');
    return res.data;
  },

  updateSystemConfig: async (
    payload: IUpdateSystemConfigPayload
  ): Promise<ISystemConfiguration> => {
    const res = await api.patch<ISystemConfiguration>('/system/config', payload);
    return res.data;
  },

  testAIConnection: async (payload?: { model?: string }): Promise<ITestAIResponse> => {
    const res = await api.post<ITestAIResponse>('/system/config/test-ai', payload || {});
    return res.data;
  },

  purgeSystemCache: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<{ success: boolean; message: string }>(
      '/system/operations/clear-cache'
    );
    return res.data;
  },

  syncWithEnvDefaults: async (): Promise<ISystemConfiguration> => {
    const res = await api.post<ISystemConfiguration>('/system/config/sync-env');
    return res.data;
  },
};
