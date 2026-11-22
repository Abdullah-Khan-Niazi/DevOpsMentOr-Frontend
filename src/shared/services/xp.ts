import type { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';

/** `xp` block returned by every XP-bearing mutation (contract C§5.4). */
export interface XpChange {
  delta: number;
  balance: number;
}

interface GamificationSummaryCache {
  balance: number;
  [key: string]: unknown;
}

/**
 * Applies the server-reported balance to the cached top-bar summary at once,
 * then invalidates gamification and leaderboard queries so every view refetches.
 */
export function applyXpDelta(queryClient: QueryClient, xp: XpChange | null | undefined): void {
  if (!xp || typeof xp.balance !== 'number' || !Number.isFinite(xp.balance)) return;
  queryClient.setQueryData<GamificationSummaryCache | undefined>(
    QUERY_KEYS.gamification.summary,
    (old) => (old ? { ...old, balance: xp.balance } : old),
  );
  void queryClient.invalidateQueries({ queryKey: ['gamification'] });
  void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
}
