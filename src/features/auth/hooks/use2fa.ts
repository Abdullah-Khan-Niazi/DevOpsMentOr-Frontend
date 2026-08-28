import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import type { MessageResponse, Verify2faPayload } from '../types';

export function use2fa() {
  const enable = useMutation<TwoFactorSetup, ApiError, void>({
    mutationFn: () => authService.enable2fa(),
  });

  const verify = useMutation<MessageResponse, ApiError, Verify2faPayload>({
    mutationFn: (payload) => authService.verify2fa(payload),
  });

  const disable = useMutation<MessageResponse, ApiError, Verify2faPayload>({
    mutationFn: (payload) => authService.disable2fa(payload),
  });

  return { enable, verify, disable };
}

type TwoFactorSetup = {
  secret: string;
  otpAuthUri: string;
};
