import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { settingsService } from '../services';
import type { UpdateMySettingsInput, UserSetting } from '../types';

export function useMySettings() {
  return useQuery<UserSetting[], ApiError>({
    queryKey: QUERY_KEYS.preferences.mySettings,
    queryFn: () => settingsService.getMySettings(),
  });
}

export function useUpdateMySettings() {
  const queryClient = useQueryClient();
  return useMutation<UserSetting[], ApiError, UpdateMySettingsInput>({
    mutationFn: (payload) => settingsService.updateMySettings(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.preferences.mySettings }),
  });
}
