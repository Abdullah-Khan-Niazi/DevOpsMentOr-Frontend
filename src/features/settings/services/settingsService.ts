import { apiClient } from '@/shared/services';
import type { AppSettings, UpdateSettingsInput } from '../types';

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    const { data } = await apiClient.get<AppSettings>('/settings');
    return data;
  },

  async updateSettings(payload: UpdateSettingsInput): Promise<AppSettings> {
    const { data } = await apiClient.patch<AppSettings>('/settings', payload);
    return data;
  },
};
