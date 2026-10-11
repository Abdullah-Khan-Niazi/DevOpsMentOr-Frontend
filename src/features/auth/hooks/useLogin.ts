import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';
import type { LoginCredentials, LoginResponse } from '../types';

import { getDefaultRouteForUser } from '../utils/rbac';

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<LoginResponse, ApiError, LoginCredentials>({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (data) => {
      setSession(data);
      if (data.data.user.isVerified) {
        const defaultRoute = getDefaultRouteForUser(data.data.user);
        const params = new URLSearchParams(location.search);
        const redirect = params.get('redirect');

        if (redirect && redirect.startsWith('/') && redirect !== ROUTES.DASHBOARD) {
          void navigate(redirect, { replace: true });
        } else {
          void navigate(defaultRoute, { replace: true });
        }
      }
      // If not verified, LoginForm handles the email verification step.
    },
  });
}
