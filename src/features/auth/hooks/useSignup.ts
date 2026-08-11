import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import type { MessageResponse } from '../types';
import { authService } from '../services';
import type { SignupCredentials } from '../types';

export function useSignup() {
  const navigate = useNavigate();

  return useMutation<MessageResponse, ApiError, SignupCredentials>({
    mutationFn: (credentials) => authService.signup(credentials),
    onSuccess: (data, variables) => {
      void navigate(ROUTES.VERIFY_EMAIL, {
        replace: true,
        state: { email: variables.email, message: data.data.message },
      });
    },
  });
}
