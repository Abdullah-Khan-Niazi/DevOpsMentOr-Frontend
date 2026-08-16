import { apiClient } from '@/shared/services';
import type {
  ClassLeaderboardDto,
  LeaderboardEntryDto,
  OrgLeaderboardDto,
  PaginatedLeaderboard,
  SeasonDetailDto,
  SeasonDto,
  SeasonLeaderboardEntryDto,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F7 §07 leaderboard endpoints (GAM-06..GAM-12). */
export const leaderboardService = {
  /** GAM-06: paginated global leaderboard with the viewer's own rank. */
  async getGlobal(page = 1, limit = 25): Promise<PaginatedLeaderboard<LeaderboardEntryDto>> {
    const { data } = await apiClient.get<{ data: PaginatedLeaderboard<LeaderboardEntryDto> }>(
      '/leaderboard/global',
      { params: { page, limit } },
    );
    return unwrap(data);
  },

  /** GAM-07: paginated country-scoped leaderboard. */
  async getByCountry(
    countryCode: string,
    page = 1,
    limit = 25,
  ): Promise<PaginatedLeaderboard<LeaderboardEntryDto>> {
    const { data } = await apiClient.get<{ data: PaginatedLeaderboard<LeaderboardEntryDto> }>(
      `/leaderboard/country/${countryCode}`,
      { params: { page, limit } },
    );
    return unwrap(data);
  },

  /** GAM-08: paginated season standings. */
  async getSeason(
    seasonId: number,
    page = 1,
    limit = 25,
  ): Promise<PaginatedLeaderboard<SeasonLeaderboardEntryDto>> {
    const { data } = await apiClient.get<{ data: PaginatedLeaderboard<SeasonLeaderboardEntryDto> }>(
      `/leaderboard/season/${seasonId}`,
      { params: { page, limit } },
    );
    return unwrap(data);
  },

  /** GAM-09: class-scoped leaderboard (professor / org admin / platform admin). */
  async getClass(classId: number): Promise<ClassLeaderboardDto> {
    const { data } = await apiClient.get<{ data: ClassLeaderboardDto }>(
      `/leaderboard/class/${classId}`,
    );
    return unwrap(data);
  },

  /** GAM-10: org-scoped leaderboard (org admin / platform admin). */
  async getOrg(orgId: number): Promise<OrgLeaderboardDto> {
    const { data } = await apiClient.get<{ data: OrgLeaderboardDto }>(`/leaderboard/org/${orgId}`);
    return unwrap(data);
  },

  /** GAM-11: season catalog ordered by season number (most recent first). */
  async listSeasons(): Promise<SeasonDto[]> {
    const { data } = await apiClient.get<{ data: SeasonDto[] }>('/seasons');
    return unwrap(data);
  },

  /** GAM-12: season detail with assigned content. */
  async getSeasonDetail(seasonId: number): Promise<SeasonDetailDto> {
    const { data } = await apiClient.get<{ data: SeasonDetailDto }>(`/seasons/${seasonId}`);
    return unwrap(data);
  },
};

export default leaderboardService;
