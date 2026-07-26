import { apiClient } from '@/shared/services';
import type { Report } from '../types';

export const reportsService = {
  async getReports(): Promise<Report[]> {
    const { data } = await apiClient.get<Report[]>('/reports');
    return data;
  },
};
