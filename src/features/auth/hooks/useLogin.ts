import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';
import type { LoginCredentials } from '../types';

export function useLogin() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<Awaited<ReturnType<typeof authService.login>>, ApiError, LoginCredentials>({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (data) => {
      setSession(data);
      void navigate(ROUTES.DASHBOARD, { replace: true });
    },
  });
}
