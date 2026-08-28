import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { leaderboardService } from '@/features/leaderboard/services';
import { adminGamificationService } from '../services';
import type {
  CreateAchievementPayload,
  CreateBadgePayload,
  CreateSeasonPayload,
  PointsAdjustPayload,
  UpdateAchievementPayload,
  UpdateBadgePayload,
  UpdateSeasonPayload,
} from '../types';

export function useAdminBadges() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.adminGamification.badges,
    queryFn: () => adminGamificationService.listBadges(),
    retry: false,
  });

  const create = useMutation({
    mutationFn: (payload: CreateBadgePayload) => adminGamificationService.createBadge(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminGamification.badges }),
  });

  const update = useMutation({
    mutationFn: ({ badgeId, payload }: { badgeId: number; payload: UpdateBadgePayload }) =>
      adminGamificationService.updateBadge(badgeId, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminGamification.badges }),
  });

  return { query, create, update };
}

export function useAdminAchievements() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.adminGamification.achievements,
    queryFn: () => adminGamificationService.listAchievements(),
    retry: false,
  });

  const create = useMutation({
    mutationFn: (payload: CreateAchievementPayload) =>
      adminGamificationService.createAchievement(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminGamification.achievements }),
  });

  const update = useMutation({
    mutationFn: ({
      achievementId,
      payload,
    }: {
      achievementId: number;
      payload: UpdateAchievementPayload;
    }) => adminGamificationService.updateAchievement(achievementId, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminGamification.achievements }),
  });

  return { query, create, update };
}

export function useAdminSeasons() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.adminGamification.seasons,
    queryFn: () => leaderboardService.listSeasons(),
    retry: false,
  });

  const create = useMutation({
    mutationFn: (payload: CreateSeasonPayload) => adminGamificationService.createSeason(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminGamification.seasons }),
  });

  const update = useMutation({
    mutationFn: ({ seasonId, payload }: { seasonId: number; payload: UpdateSeasonPayload }) =>
      adminGamificationService.updateSeason(seasonId, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminGamification.seasons }),
  });

  return { query, create, update };
}

export function useAdjustPoints() {
  return useMutation({
    mutationFn: (payload: PointsAdjustPayload) => adminGamificationService.adjustPoints(payload),
  });
}

export function useInvalidateCertificate() {
  return useMutation({
    mutationFn: (certId: number) => adminGamificationService.invalidateCertificate(certId),
  });
}

export function useRecomputeLeaderboard() {
  return useMutation({
    mutationFn: () => adminGamificationService.recomputeLeaderboard(),
  });
}
