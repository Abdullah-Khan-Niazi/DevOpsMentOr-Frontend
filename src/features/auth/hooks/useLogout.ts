import { useMutation } from '@tanstack/react-query';
import { ROUTES } from '@/shared/constants';
import { getRefreshToken } from '@/shared/services';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      // Read the live value: the 401 interceptor can rotate the pair after the
      // store was hydrated.
      const refreshToken = getRefreshToken();
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
