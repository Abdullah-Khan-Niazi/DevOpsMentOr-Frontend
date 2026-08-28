import { apiClient } from '@/shared/services';
import type { ActivityTrendDto, AnalyticsOverviewDto } from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F8 §07 admin analytics endpoints (OPS-41/42, SCR-F8-16). */
export const adminAnalyticsService = {
  /** OPS-41: anonymized KPI overview (no individual user data). */
  async getOverview(): Promise<AnalyticsOverviewDto> {
    const { data } = await apiClient.get<{ data: AnalyticsOverviewDto }>(
      '/admin/analytics/overview',
    );
    return unwrap(data);
  },

  /** OPS-42: daily activity trend over the requested window. */
  async getActivityTrend(days = 14): Promise<ActivityTrendDto> {
    const { data } = await apiClient.get<{ data: ActivityTrendDto }>('/admin/analytics/activity', {
      params: { days },
    });
    return unwrap(data);
  },
};

export default adminAnalyticsService;
