/** F8 §05 analytics contracts (OPS-41/42, SCR-F8-16). */

export interface AnalyticsOverviewDto {
  activeUsers7d: number;
  newSignups30d: number;
  courseCompletions30d: number;
  pointsAwarded7d: number;
  activeSubscriptions: number;
  notificationsSent7d: number;
  pendingReports: number;
  newReviews7d: number;
}

export interface ActivityPointDto {
  date: string;
  activeUsers: number;
  newSignups: number;
  courseCompletions: number;
  pointsAwarded: number;
}

export interface ActivityTrendDto {
  days: number;
  data: ActivityPointDto[];
}
