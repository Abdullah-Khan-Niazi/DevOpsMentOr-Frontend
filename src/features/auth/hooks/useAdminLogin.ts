import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';
import type { AdminLoginCredentials, LoginResponse } from '../types';

export function useAdminLogin() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<LoginResponse, ApiError, AdminLoginCredentials>({
    mutationFn: (credentials) => authService.adminLogin(credentials),
    onSuccess: (data) => {
      setSession(data);
      void navigate(ROUTES.ADMIN_PLATFORM_ADMINS, { replace: true });
    },
  });
}
