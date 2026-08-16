import { apiClient } from '@/shared/services';
import type { BadgeDto, AchievementDto, CertificateDto } from '@/features/achievements/types';
import type { LeaderboardEntryDto, SeasonDto } from '@/features/leaderboard/types';
import type {
  CreateAchievementPayload,
  CreateBadgePayload,
  CreateSeasonPayload,
  LeaderboardRecomputeResult,
  PointsAdjustPayload,
  PointsAdjustResult,
  UpdateAchievementPayload,
  UpdateBadgePayload,
  UpdateSeasonPayload,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F7 §07 admin gamification endpoints (GAM-15..GAM-23). */
export const adminGamificationService = {
  /** Admin badge catalog (includes hidden badges). */
  async listBadges(): Promise<BadgeDto[]> {
    const { data } = await apiClient.get<{ data: BadgeDto[] }>('/admin/badges');
    return unwrap(data);
  },

  /** GAM-15 */
  async createBadge(payload: CreateBadgePayload): Promise<BadgeDto> {
    const { data } = await apiClient.post<{ data: BadgeDto }>('/admin/badges', payload);
    return unwrap(data);
  },

  /** GAM-16 */
  async updateBadge(badgeId: number, payload: UpdateBadgePayload): Promise<BadgeDto> {
    const { data } = await apiClient.patch<{ data: BadgeDto }>(`/admin/badges/${badgeId}`, payload);
    return unwrap(data);
  },

  /** Admin achievement catalog (includes inactive). */
  async listAchievements(): Promise<AchievementDto[]> {
    const { data } = await apiClient.get<{ data: AchievementDto[] }>('/admin/achievements');
    return unwrap(data);
  },

  /** GAM-17 */
  async createAchievement(payload: CreateAchievementPayload): Promise<AchievementDto> {
    const { data } = await apiClient.post<{ data: AchievementDto }>('/admin/achievements', payload);
    return unwrap(data);
  },

  /** GAM-18 */
  async updateAchievement(
    achievementId: number,
    payload: UpdateAchievementPayload,
  ): Promise<AchievementDto> {
    const { data } = await apiClient.patch<{ data: AchievementDto }>(
      `/admin/achievements/${achievementId}`,
      payload,
    );
    return unwrap(data);
  },

  /** GAM-19 */
  async createSeason(payload: CreateSeasonPayload): Promise<SeasonDto> {
    const { data } = await apiClient.post<{ data: SeasonDto }>('/admin/seasons', payload);
    return unwrap(data);
  },

  /** GAM-20 */
  async updateSeason(seasonId: number, payload: UpdateSeasonPayload): Promise<SeasonDto> {
    const { data } = await apiClient.patch<{ data: SeasonDto }>(
      `/admin/seasons/${seasonId}`,
      payload,
    );
    return unwrap(data);
  },

  /** GAM-21 */
  async adjustPoints(payload: PointsAdjustPayload): Promise<PointsAdjustResult> {
    const { data } = await apiClient.post<{ data: PointsAdjustResult }>(
      '/admin/gamification/points/adjust',
      payload,
    );
    return unwrap(data);
  },

  /** GAM-22 */
  async invalidateCertificate(certId: number): Promise<CertificateDto> {
    const { data } = await apiClient.patch<{ data: CertificateDto }>(
      `/admin/certificates/${certId}/invalidate`,
    );
    return unwrap(data);
  },

  /** GAM-23 */
  async recomputeLeaderboard(): Promise<LeaderboardRecomputeResult> {
    const { data } = await apiClient.post<{ data: LeaderboardRecomputeResult }>(
      '/admin/leaderboard/recompute',
    );
    return unwrap(data);
  },
};

export type { LeaderboardEntryDto };
export default adminGamificationService;
