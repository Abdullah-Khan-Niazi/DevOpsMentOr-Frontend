/** Leaderboard entry row (GAM-06/07/09/10). */
export interface LeaderboardEntryDto {
  leaderboardId: number;
  userId: number;
  username?: string;
  fullName: string | null;
  displayName: string | null;
  avatarUrl?: string | null;
  totalPoints: number;
  courseCompletionsCount?: number;
  globalRank: number | null;
  countryRank: number | null;
  cohortRank?: number | null;
  rankDelta?: number | null;
  countryCode: string | null;
}

/** Season standings row (GAM-08). */
export interface SeasonLeaderboardEntryDto {
  leaderboardId: number;
  userId: number;
  username?: string;
  pointsEarned: number;
  rank: number | null;
  fullName: string | null;
  displayName: string | null;
  avatarUrl?: string | null;
  countryCode?: string | null;
}

/** Paginated leaderboard envelope returned by GAM-06/07/08. */
export interface PaginatedLeaderboard<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  viewerRank: number | null;
  viewerPoints?: number | null;
  pointsToNextRank?: number | null;
}

/** Season catalog row (GAM-11). */
export interface SeasonDto {
  seasonId: number;
  seasonName: string;
  seasonNumber: number;
  description: string | null;
  bannerUrl: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Season content item (GAM-12). */
export interface SeasonContentItem {
  contentType: string;
  contentId: number;
  releaseOrder: number;
  isReleased: boolean;
  releasedAt: string | null;
}

/** Season detail with assigned content (GAM-12). */
export interface SeasonDetailDto {
  seasonId: number;
  seasonName: string;
  seasonNumber: number;
  description: string | null;
  bannerUrl: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  content: SeasonContentItem[];
}

/** Class-scoped leaderboard (GAM-09). */
export interface ClassLeaderboardDto {
  className: string;
  items: LeaderboardEntryDto[];
  total: number;
  viewerRank?: number | null;
  viewerPoints?: number | null;
  pointsToNextRank?: number | null;
}

/** Org-scoped leaderboard (GAM-10). */
export interface OrgLeaderboardDto {
  items: LeaderboardEntryDto[];
  total: number;
  viewerRank?: number | null;
  viewerPoints?: number | null;
  pointsToNextRank?: number | null;
}
