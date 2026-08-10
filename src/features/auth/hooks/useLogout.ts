import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';

export function useLogout() {
  const navigate = useNavigate();
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    },
    onSettled: () => {
      clearSession();
      void navigate(ROUTES.LOGIN, { replace: true });
    },
  });
}
