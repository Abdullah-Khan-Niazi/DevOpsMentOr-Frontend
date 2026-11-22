import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, ApiError, void>({
    mutationFn: () => authService.logout(),
    // The server call is best effort: the session always ends locally.
    onSettled: () => {
      clearSession();
      queryClient.clear();
      void navigate(ROUTES.LOGIN, { replace: true });
    },
  });
}
