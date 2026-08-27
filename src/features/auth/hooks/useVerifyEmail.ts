import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import type { MessageResponse, ResendVerificationPayload, VerifyEmailPayload } from '../types';

export function useVerifyEmail() {
  return useMutation<MessageResponse, ApiError, VerifyEmailPayload>({
    mutationFn: (payload) => authService.verifyEmail(payload),
  });
}

export function useResendVerification() {
  return useMutation<MessageResponse, ApiError, ResendVerificationPayload>({
    mutationFn: (payload) => authService.resendVerification(payload),
  });
}
