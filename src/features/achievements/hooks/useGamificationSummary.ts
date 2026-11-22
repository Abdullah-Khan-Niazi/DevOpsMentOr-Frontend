import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { gamificationService } from '../services/gamificationService';

export function useGamificationSummary() {
  const permissions = useAuthStore((state) => state.user?.permissions);
  const canRead = permissions?.includes('gamification:profile:read') ?? false;

  return useQuery({
    queryKey: QUERY_KEYS.gamification.summary,
    queryFn: () => gamificationService.getSummary(),
    staleTime: 30_000,
    enabled: canRead,
    retry: false,
  });
}
