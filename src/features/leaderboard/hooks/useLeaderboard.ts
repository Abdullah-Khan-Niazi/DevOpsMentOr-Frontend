import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { leaderboardService } from '../services';

export function useGlobalLeaderboard(page = 1, limit = 25) {
  return useQuery({
    queryKey: QUERY_KEYS.leaderboard.global(`${page}:${limit}`),
    queryFn: () => leaderboardService.getGlobal(page, limit),
    retry: false,
  });
}

export function useCountryLeaderboard(countryCode: string | null, page = 1, limit = 25) {
  return useQuery({
    queryKey: QUERY_KEYS.leaderboard.country(countryCode ?? '', `${page}:${limit}`),
    queryFn: () => leaderboardService.getByCountry(countryCode as string, page, limit),
    enabled: Boolean(countryCode),
    retry: false,
  });
}

export function useSeasonLeaderboard(seasonId: number | null, page = 1, limit = 25) {
  return useQuery({
    queryKey: QUERY_KEYS.leaderboard.season(String(seasonId ?? ''), `${page}:${limit}`),
    queryFn: () => leaderboardService.getSeason(seasonId as number, page, limit),
    enabled: seasonId !== null,
    retry: false,
  });
}

export function useSeasons() {
  return useQuery({
    queryKey: QUERY_KEYS.leaderboard.seasons,
    queryFn: () => leaderboardService.listSeasons(),
    retry: false,
  });
}

export function useSeasonDetail(seasonId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.leaderboard.seasonDetail(String(seasonId ?? '')),
    queryFn: () => leaderboardService.getSeasonDetail(seasonId as number),
    enabled: seasonId !== null,
    retry: false,
  });
}

export function useClassLeaderboard(classId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.leaderboard.class(String(classId ?? '')),
    queryFn: () => leaderboardService.getClass(classId as number),
    enabled: classId !== null,
    retry: false,
  });
}

export function useOrgLeaderboard(orgId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.leaderboard.org(String(orgId ?? '')),
    queryFn: () => leaderboardService.getOrg(orgId as number),
    enabled: orgId !== null,
    retry: false,
  });
}
