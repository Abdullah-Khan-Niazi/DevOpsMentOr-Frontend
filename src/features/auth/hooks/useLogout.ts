import { useMutation } from '@tanstack/react-query';
import { ROUTES } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';

export function useLogout() {
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
      window.location.replace(ROUTES.LOGIN);
    },
  });
}
