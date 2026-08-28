import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { gamificationService } from '../services';

export function useGamificationProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.gamification.profile,
    queryFn: () => gamificationService.getMyProfile(),
    retry: false,
  });
}

export function useBadgeCatalog() {
  return useQuery({
    queryKey: QUERY_KEYS.gamification.badgeCatalog,
    queryFn: () => gamificationService.listBadges(),
    retry: false,
  });
}

export function useAchievementCatalog() {
  return useQuery({
    queryKey: QUERY_KEYS.gamification.achievementCatalog,
    queryFn: () => gamificationService.listAchievements(),
    retry: false,
  });
}

export function usePointsHistory(page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.gamification.pointsHistory(page),
    queryFn: () => gamificationService.getPointsHistory(page),
    retry: false,
  });
}

export function useCertificateDownload() {
  return useMutation({
    mutationFn: (certId: number) => gamificationService.getCertificateDownload(certId),
  });
}
