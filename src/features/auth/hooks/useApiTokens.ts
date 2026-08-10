import { useMutation, useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import type { ApiToken, ApiTokenCreated, CreateApiTokenPayload } from '../types';

const API_TOKENS_KEY = ['auth', 'api-tokens'] as const;

export function useApiTokens() {
  const list = useQuery<ApiToken[], ApiError>({
    queryKey: API_TOKENS_KEY,
    queryFn: () => authService.listApiTokens(),
  });

  const create = useMutation<ApiTokenCreated, ApiError, CreateApiTokenPayload>({
    mutationFn: (payload) => authService.createApiToken(payload),
  });

  const revoke = useMutation<void, ApiError, number>({
    mutationFn: (tokenId) => authService.revokeApiToken(tokenId),
  });

  return {
    list,
    create,
    revoke,
    refetch: list.refetch,
  };
}
