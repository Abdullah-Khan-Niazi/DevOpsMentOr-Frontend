export interface AdminUserListItem {
  userId: number;
  email: string;
  username: string;
  fullName: string | null;
  isActive: boolean;
  isBanned: boolean;
  isVerified: boolean;
  roles: string[];
  createdAt: string;
  deletedAt: string | null;
  organizationId?: number | null;
  organizationName?: string | null;
  country?: string | null;
}

export interface AdminPaginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminLoginHistoryItem {
  loginId: number;
  loginType: 'email' | 'google' | 'github';
  isSuccessful: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AdminSkillItem {
  skillId: number;
  skillName: string;
  category: string;
  proficiencyLevel: string;
  yearsExperience: number;
  isVerified: boolean;
}

export interface AdminUserDetail {
  userId: number;
  email: string;
  username: string;
  fullName: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isBanned: boolean;
  isVerified: boolean;
  banReason: string | null;
  deletedAt: string | null;
  createdAt: string;
  roles: string[];
  profile: {
    occupation: string | null;
    company: string | null;
    website: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    twitterHandle: string | null;
    discordUsername: string | null;
    reputationScore: number;
    profileViews: number;
    isPublic: boolean;
    country: { countryId: number; countryName: string } | null;
  } | null;
  skills: AdminSkillItem[];
  loginHistory: AdminLoginHistoryItem[];
  followersCount: number;
  followingCount: number;
}

export interface AdminUserListQuery {
  page: number;
  pageSize: number;
  search?: string;
  role?: string;
  isBanned?: 'true' | 'false';
  isActive?: 'true' | 'false';
  isDeleted?: 'true' | 'false';
  organizationId?: number;
  country?: string;
}

export interface InviteUserPayload {
  emails: string[];
  type: 'individual_learner' | 'organization';
  organizationId?: number;
  role?: 'individual_learner' | 'org_admin' | 'professor' | 'org_student' | 'platform_admin';
}

export interface AuditLogItem {
  logId: number;
  adminUserId: number;
  adminFullName: string | null;
  adminEmail: string;
  action: string;
  targetType: string | null;
  targetId: number | null;
  changes: unknown;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogQuery {
  page: number;
  pageSize: number;
  action?: string;
  targetType?: string;
  search?: string;
  from?: string;
  to?: string;
}

export interface AuditMetadata {
  actions: string[];
  targetTypes: string[];
}

export interface SystemSetting {
  settingId: number;
  settingKey: string;
  settingValue: unknown;
  groupName: string | null;
  description: string | null;
  isEditable: boolean;
  updatedAt: string | null;
}

export interface HourlyActivityPoint {
  hour: number;
  label: string;
  count: number;
}

export interface PwnboxTelemetry {
  activePods: number;
  pendingPods: number;
  stoppedPods: number;
  errorPods: number;
  terminatedPods: number;
  totalActiveRamGb: number;
  totalActiveCpuCores: number;
  avgDurationMinutes: number;
  maxSimultaneousPods: number;
}

export interface SystemTelemetry {
  status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  responseSuccessRate: number;
  avgLatencyMs: number;
  uptimeSeconds: number;
}

export interface TelemetryHistoryPoint {
  time: string;
  cpuLoadPercent: number;
  memoryPercent: number;
  memoryUsedMb: number;
  requestsPerMinute: number;
}

export interface HostTelemetry {
  platform: string;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  activeCpuLoadPercent: number;
  loadAvg1m: number;
  loadAvg5m: number;
  loadAvg15m: number;
  avgCpuLoad: number;
  minCpuLoad: number;
  maxCpuLoad: number;
  totalMemoryMb: number;
  usedMemoryMb: number;
  freeMemoryMb: number;
  memoryUsagePercent: number;
  avgMemoryUsagePercent: number;
  minMemoryMb: number;
  maxMemoryMb: number;
  heapUsedMb: number;
  uptimeSeconds: number;
  history?: TelemetryHistoryPoint[];
  allocatedCompute?: AllocatedCompute;
  sevenDayHistory?: HourlyTelemetryPoint[];
}

export interface AllocatedCompute {
  activeContainers: number;
  allocatedRamGb: number;
  allocatedCpuCores: number;
  pendingPods: number;
  errorPods: number;
  stoppedPods: number;
  terminatedPods: number;
  maxPodCapacity: number;
  kubernetesStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
}

export interface HourlyTelemetryPoint {
  timestamp: number;
  time: string;
  label: string;
  date: string;
  hour: number;
  cpuLoadPercent: number;
  cpuMin: number;
  cpuMax: number;
  cpuAvg: number;
  memoryPercent: number;
  memoryMin: number;
  memoryMax: number;
  memoryAvg: number;
  memoryUsedMb: number;
  requestsPerMinute: number;
  requestsTotal: number;
  requestsMin: number;
  requestsMax: number;
  allocatedContainers: number;
  allocatedRamGb: number;
  allocatedCpuCores: number;
  pendingPods: number;
  kubernetesStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
}

export interface CacheTelemetry {
  status: 'CONNECTED' | 'DISCONNECTED';
  hits: number;
  misses: number;
  hitRatioPercent: number;
  usedMemoryBytes: number;
  usedMemoryHuman: string;
  maxMemoryHuman: string;
  maxMemoryBytes: number;
  memoryUsagePercent: number;
  peakMemoryHuman: string;
  totalCommands: number;
}

export interface DatabaseTelemetry {
  status: 'CONNECTED' | 'ERROR';
  totalQueries: number;
  activeConnections: number;
  threadsRunning: number;
  uptimeSeconds: number;
  totalStorageBytes: number;
  storageSizeHuman: string;
  dataSizeHuman: string;
  indexSizeHuman: string;
  bufferPoolBytesData: number;
  bufferPoolSizeHuman: string;
}

export interface AiTelemetry {
  activeConversations: number;
  totalMessagesSent: number;
  totalTokensConsumed: number;
  avgResponseLatencyMs: number;
}

export interface RequestTelemetry {
  totalRequests: number;
  hourlyRequests: number;
  dailyRequests: number;
  weeklyRequests: number;
  avgRequestsPerMinute: number;
}

export interface UserSessionTelemetry {
  currentlyActiveUsers: number;
  activeSessions: number;
  avgStayDurationMinutes: number;
  minStayDurationMinutes: number;
  maxStayDurationMinutes: number;
}

export interface KpiSparklines {
  userbase: number[];
  pods: number[];
  compute: number[];
  learners: number[];
}

export interface UserSegmentationItem {
  segment: string;
  count: number;
  percentage: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface SubscriptionBreakdownItem {
  planType: string;
  count: number;
  percentage: number;
}

export interface PeakActivityPoint {
  label: string;
  count: number;
  date?: string;
}

export interface DashboardKpis {
  totalUsers?: number;
  totalIndividualLearners: number;
  totalOrgStudents?: number;
  totalOrganizations: number;
  activeLearners: number;
  labsCompleted: number | null;
  pwnbox?: PwnboxTelemetry;
  telemetry?: SystemTelemetry;
  hostTelemetry?: HostTelemetry;
  cacheTelemetry?: CacheTelemetry;
  dbTelemetry?: DatabaseTelemetry;
  aiTelemetry?: AiTelemetry;
  requestTelemetry?: RequestTelemetry;
  sessionTelemetry?: UserSessionTelemetry;
  sparklines?: KpiSparklines;
  userSegmentation?: UserSegmentationItem[];
  funnel?: FunnelStage[];
  subscriptionBreakdown?: SubscriptionBreakdownItem[];
  peakActivity?: {
    peakHour: string;
    hourlyDistribution: HourlyActivityPoint[];
    sevenDayDistribution?: PeakActivityPoint[];
    thirtyDayDistribution?: PeakActivityPoint[];
  };
  userDistribution?: {
    freeUsers: number;
    paidUsers: number;
  };
}

export interface DashboardData {
  kpis: DashboardKpis;
  recentAuditLogs: AuditLogItem[];
}

export interface PlatformAdminItem {
  userId: number;
  email: string;
  username: string;
  fullName: string | null;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
}

export interface ActionMessage {
  message: string;
}
