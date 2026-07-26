import { apiClient } from '@/shared/services';
import type { DashboardStats } from '../types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
    return data;
  },
};
