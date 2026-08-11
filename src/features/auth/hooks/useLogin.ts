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

  const redirectTo = () => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    // Only honor same-app relative paths (prevent open-redirect).
    if (redirect && redirect.startsWith('/')) {
      return redirect;
    }
    return ROUTES.DASHBOARD;
  };

  return useMutation<LoginResponse, ApiError, LoginCredentials>({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (data) => {
      setSession(data);
      void navigate(redirectTo(), { replace: true });
    },
  });
}
