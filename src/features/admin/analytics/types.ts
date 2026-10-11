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

export interface FunnelStageDto {
  stage: string;
  count: number;
  percentage: number;
}

export interface CountryDistributionDto {
  countryCode: string;
  countryName: string;
  userCount: number;
}

export interface SubscriptionBreakdownDto {
  planType: string;
  count: number;
}

export interface ActivityHeatmapDayDto {
  date: string;
  count: number;
  level: number;
}

export interface PwnboxAnalyticsDto {
  totalInstances: number;
  activeInstances: number;
  pendingInstances: number;
  errorInstances: number;
  terminatedInstances: number;
  totalRamGb: number;
  totalCpuCores: number;
  avgDurationMinutes: number;
}

export interface UserSessionAnalyticsDto {
  currentlyActiveUsers: number;
  activeSessions: number;
  avgStayDurationMinutes: number;
  minStayDurationMinutes: number;
  maxStayDurationMinutes: number;
}

export interface MultiMetricHeatmapsDto {
  activity: ActivityHeatmapDayDto[];
  logins: ActivityHeatmapDayDto[];
  labs: ActivityHeatmapDayDto[];
  signups: ActivityHeatmapDayDto[];
  orgs: ActivityHeatmapDayDto[];
}

export interface DetailedAnalyticsDto {
  overview: AnalyticsOverviewDto;
  funnel: FunnelStageDto[];
  countries: CountryDistributionDto[];
  subscriptionBreakdown: SubscriptionBreakdownDto[];
  heatmap: ActivityHeatmapDayDto[];
  heatmaps?: MultiMetricHeatmapsDto;
  pwnbox: PwnboxAnalyticsDto;
  sessionStats?: UserSessionAnalyticsDto;
}
