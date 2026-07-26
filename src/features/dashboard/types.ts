export interface DashboardStats {
  totalUsers: number;
  activeRoles: number;
  openReports: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}
