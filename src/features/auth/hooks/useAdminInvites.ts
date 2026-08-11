import { useMutation, useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import type { AdminInvitePayload, MessageResponse, PendingAdminInvite } from '../types';

const ADMIN_INVITES_KEY = ['auth', 'admin-invites'] as const;

export function useAdminInvites() {
  const list = useQuery<PendingAdminInvite[], ApiError>({
    queryKey: ADMIN_INVITES_KEY,
    queryFn: () => authService.listAdminInvites(),
  });

  const send = useMutation<MessageResponse, ApiError, AdminInvitePayload>({
    mutationFn: (payload) => authService.sendAdminInvite(payload),
  });

  const revoke = useMutation<void, ApiError, string>({
    mutationFn: (inviteId) => authService.revokeAdminInvite(inviteId),
  });

  return {
    list,
    send,
    revoke,
    refetch: list.refetch,
  };
}
