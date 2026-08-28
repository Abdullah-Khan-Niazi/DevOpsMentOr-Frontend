import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { adminAnalyticsService } from '../services';

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: QUERY_KEYS.adminAnalytics.overview,
    queryFn: () => adminAnalyticsService.getOverview(),
    retry: false,
  });
}

export function useActivityTrend(days = 14) {
  return useQuery({
    queryKey: QUERY_KEYS.adminAnalytics.activity(days),
    queryFn: () => adminAnalyticsService.getActivityTrend(days),
    retry: false,
  });
}
