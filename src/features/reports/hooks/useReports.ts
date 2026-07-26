import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { reportsService } from '../services';
import type { Report } from '../types';

export function useReports() {
  return useQuery<Report[], ApiError>({
    queryKey: QUERY_KEYS.reports.all,
    queryFn: () => reportsService.getReports(),
  });
}
