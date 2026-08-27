import type { BadgeDto, CertificateDto } from '@/features/achievements/types';
import type { SeasonDto } from '@/features/leaderboard/types';

/** GAM-15 request body (mirrors createBadgeSchema). */
export interface CreateBadgePayload {
  badgeName: string;
  slug: string;
  description?: string;
  badgeType: BadgeDto['badgeType'];
  iconUrl?: string;
  pointsRequired: number;
  criteria?: {
    triggerType:
      'course_complete' | 'lab_complete' | 'achievement_unlock' | 'manual' | 'points_threshold';
    triggerValue: Record<string, unknown>;
  };
  isHidden: boolean;
}

/** GAM-16 request body (mirrors updateBadgeSchema). */
export type UpdateBadgePayload = Partial<CreateBadgePayload>;

/** GAM-17 request body (mirrors createAchievementSchema). */
export interface CreateAchievementPayload {
  name: string;
  description?: string;
  pointsAwarded: number;
  triggerType: 'lab_completions' | 'course_completions' | 'streak_days' | 'points_balance';
  triggerValue: Record<string, unknown>;
  isActive: boolean;
}

/** GAM-18 request body (mirrors updateAchievementSchema). */
export type UpdateAchievementPayload = Partial<CreateAchievementPayload>;

/** Season content assignment (lab-only per AC-09). */
export interface SeasonContentPayload {
  contentType: 'lab';
  contentId: number;
  releaseOrder: number;
  isReleased: boolean;
}

/** GAM-19 request body (mirrors createSeasonSchema). */
export interface CreateSeasonPayload {
  seasonName: string;
  seasonNumber: number;
  description?: string;
  bannerUrl?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

/** GAM-20 request body (mirrors updateSeasonSchema). */
export interface UpdateSeasonPayload {
  seasonName?: string;
  seasonNumber?: number;
  description?: string | null;
  bannerUrl?: string | null;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  content?: SeasonContentPayload[];
}

/** GAM-21 request body (mirrors pointsAdjustSchema). */
export interface PointsAdjustPayload {
  targetUserId: number;
  pointsChange: number;
  description: string;
}

/** GAM-21 response. */
export interface PointsAdjustResult {
  historyId: number;
  newBalance: number;
}

/** GAM-23 response. */
export interface LeaderboardRecomputeResult {
  processedUsers: number;
  snapshotRows: number;
}

export type { BadgeDto, CertificateDto, SeasonDto };
