import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';
import type { LoginResponse, SignupCredentials } from '../types';

export function useSignup() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<LoginResponse, ApiError, SignupCredentials>({
    mutationFn: (credentials) => authService.signup(credentials),
    onSuccess: (data) => {
      setSession(data);
      void navigate(ROUTES.DASHBOARD, { replace: true });
    },
  });
}
