import { apiClient } from '@/shared/services';
import type {
  AppSettings,
  UpdateMySettingsInput,
  UpdateSettingsInput,
  UserSetting,
} from '../types';

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    const { data } = await apiClient.get<AppSettings>('/settings');
    return data;
  },

  async updateSettings(payload: UpdateSettingsInput): Promise<AppSettings> {
    const { data } = await apiClient.patch<AppSettings>('/settings', payload);
    return data;
  },

  /** USR-08 */
  async getMySettings(): Promise<UserSetting[]> {
    const { data } = await apiClient.get<{ data: UserSetting[] }>('/users/me/settings');
    return data.data;
  },

  /** USR-09 */
  async updateMySettings(payload: UpdateMySettingsInput): Promise<UserSetting[]> {
    const { data } = await apiClient.patch<{ data: UserSetting[] }>('/users/me/settings', payload);
    return data.data;
  },
};
