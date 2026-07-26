import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { settingsService } from '../services';
import type { AppSettings, UpdateSettingsInput } from '../types';

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation<AppSettings, ApiError, UpdateSettingsInput>({
    mutationFn: (payload) => settingsService.updateSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.settings.all, data);
    },
  });
}
