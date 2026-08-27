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
  from?: string;
  to?: string;
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

export interface DashboardKpis {
  totalIndividualLearners: number;
  totalOrganizations: number;
  activeLearners: number;
  labsCompleted: number | null;
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
