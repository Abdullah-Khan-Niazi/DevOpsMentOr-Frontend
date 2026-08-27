import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import type { LoginHistoryEntry } from '../types';

const LOGIN_HISTORY_KEY = ['auth', 'login-history'] as const;

export function useLoginHistory() {
  return useQuery<LoginHistoryEntry[], ApiError>({
    queryKey: LOGIN_HISTORY_KEY,
    queryFn: () => authService.getLoginHistory(),
  });
}
