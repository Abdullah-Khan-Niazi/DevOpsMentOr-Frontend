import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';
import type { LoginCredentials, LoginResponse } from '../types';

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<LoginResponse, ApiError, LoginCredentials>({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (data) => {
      setSession(data);
      if (data.data.user.isVerified) {
        const perms = data.data.user.permissions ?? [];
        const params = new URLSearchParams(location.search);
        const redirect = params.get('redirect');

        if (redirect && redirect.startsWith('/')) {
          void navigate(redirect, { replace: true });
        } else if (perms.includes('platform.admin.access')) {
          void navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
        } else {
          void navigate(ROUTES.DASHBOARD, { replace: true });
        }
      }
      // If not verified, LoginForm handles the email verification step.
    },
  });
}
