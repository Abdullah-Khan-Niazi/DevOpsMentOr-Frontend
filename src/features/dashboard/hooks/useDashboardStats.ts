import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { dashboardService } from '../services';
import type { DashboardStats } from '../types';

export function useDashboardStats() {
  return useQuery<DashboardStats, ApiError>({
    queryKey: QUERY_KEYS.dashboard.stats,
    queryFn: () => dashboardService.getStats(),
  });
}
