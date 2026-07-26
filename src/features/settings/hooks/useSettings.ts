import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { settingsService } from '../services';
import type { AppSettings } from '../types';

export function useSettings() {
  return useQuery<AppSettings, ApiError>({
    queryKey: QUERY_KEYS.settings.all,
    queryFn: () => settingsService.getSettings(),
  });
}
