import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import type { ForgotPasswordPayload, MessageResponse, ResetPasswordPayload } from '../types';

export function useForgotPassword() {
  return useMutation<MessageResponse, ApiError, ForgotPasswordPayload>({
    mutationFn: (payload) => authService.forgotPassword(payload),
  });
}

export function useResetPassword() {
  return useMutation<MessageResponse, ApiError, ResetPasswordPayload>({
    mutationFn: (payload) => authService.resetPassword(payload),
  });
}
