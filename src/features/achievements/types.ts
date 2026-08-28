export type BadgeType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'special';

/** `points_history.source_type` values returned by the backend. */
export type PointsSourceType =
  | 'machine_own'
  | 'challenge_solve'
  | 'course_complete'
  | 'achievement'
  | 'daily_bonus'
  | 'admin_adjustment'
  | 'penalty';

/** Badge award trigger rule (contract §05; currently not returned by reads). */
export interface BadgeCriteria {
  triggerType:
    'course_complete' | 'lab_complete' | 'achievement_unlock' | 'manual' | 'points_threshold';
  triggerValue: Record<string, unknown>;
}

/** GAM-02: public badge catalog row (hidden badges already excluded server-side). */
export interface BadgeDto {
  badgeId: number;
  badgeName: string;
  slug: string;
  description: string | null;
  badgeType: BadgeType;
  iconUrl: string | null;
  pointsRequired: number;
  criteria: BadgeCriteria | null;
  isHidden: boolean;
  createdAt: string;
}

/** GAM-01: badge earned by the learner. */
export interface UserBadgeDto {
  badgeId: number;
  badgeName: string;
  badgeType: BadgeType;
  iconUrl: string | null;
  awardedAt: string;
}

/** GAM-04: public achievement catalog row. */
export interface AchievementDto {
  achievementId: number;
  name: string;
  description: string | null;
  pointsAwarded: number;
  triggerType: string | null;
  isActive: boolean;
  createdAt: string;
}

/** GAM-01: achievement unlocked by the learner. */
export interface UserAchievementDto {
  achievementId: number;
  name: string;
  pointsAwarded: number;
  unlockedAt: string;
}

/** GAM-01: certificate owned by the learner. */
export interface CertificateDto {
  certificateId: number;
  certificateNumber: string;
  courseTitle: string;
  grade: number | null;
  issuedAt: string;
  isValid: boolean;
}

/** GAM-05: points ledger row. */
export interface PointsHistoryDto {
  historyId: number;
  pointsChange: number;
  pointsBalanceAfter: number;
  sourceType: PointsSourceType;
  sourceId: number | null;
  description: string | null;
  createdAt: string;
}

/** GAM-01: full learner gamification profile payload. */
export interface GamificationProfileDto {
  points: {
    balance: number;
    totalEarned: number;
  };
  globalRank: number | null;
  countryRank: number | null;
  badges: UserBadgeDto[];
  achievements: UserAchievementDto[];
  certificates: CertificateDto[];
  currentStreakDays: number;
}

/** GAM-13: certificate download URL. */
export interface CertificateDownloadDto {
  certificateId: number;
  url: string | null;
}

export interface PaginatedPointsHistory {
  items: PointsHistoryDto[];
  total: number;
}
