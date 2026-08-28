import { apiClient } from '@/shared/services';
import type {
  AchievementDto,
  BadgeDto,
  CertificateDownloadDto,
  GamificationProfileDto,
  PaginatedPointsHistory,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F7 §07 learner gamification endpoints (GAM-01..GAM-05, GAM-13). */
export const gamificationService = {
  /** GAM-01: own gamification profile. */
  async getMyProfile(): Promise<GamificationProfileDto> {
    const { data } = await apiClient.get<{ data: GamificationProfileDto }>('/gamification/me');
    return unwrap(data);
  },

  /** GAM-02: public badge catalog (hidden excluded). */
  async listBadges(): Promise<BadgeDto[]> {
    const { data } = await apiClient.get<{ data: BadgeDto[] }>('/gamification/badges');
    return unwrap(data);
  },

  /** GAM-04: public achievement catalog (active only). */
  async listAchievements(): Promise<AchievementDto[]> {
    const { data } = await apiClient.get<{ data: AchievementDto[] }>('/gamification/achievements');
    return unwrap(data);
  },

  /** GAM-05: own points ledger, paginated. */
  async getPointsHistory(page = 1, limit = 25): Promise<PaginatedPointsHistory> {
    const { data } = await apiClient.get<{ data: PaginatedPointsHistory }>(
      '/gamification/points/history',
      { params: { page, limit } },
    );
    return unwrap(data);
  },

  /** GAM-13: owner-only certificate download URL. */
  async getCertificateDownload(certId: number): Promise<CertificateDownloadDto> {
    const { data } = await apiClient.get<{ data: CertificateDownloadDto }>(
      `/certificates/${certId}/download`,
    );
    return unwrap(data);
  },
};

export default gamificationService;
