export { default as AdminUsersPage } from './pages/AdminUsersPage';
export { default as AdminUserDetailPage } from './pages/AdminUserDetailPage';
export { default as AdminDashboardPage } from './pages/AdminDashboardPage';
export { default as AdminSettingsPage } from './pages/AdminSettingsPage';
export { default as AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
export {
  useAdminUsers,
  useAdminUserDetail,
  useAdminDashboard,
  useAdminAuditLogs,
  useAdminSystemSettings,
} from './hooks';
export { adminService } from './services';
export type {
  AdminUserListItem,
  AdminUserDetail,
  AdminPaginated,
  AdminUserListQuery,
  AuditLogItem,
  AuditLogQuery,
  SystemSetting,
  DashboardData,
  DashboardKpis,
  PlatformAdminItem,
} from './types';
