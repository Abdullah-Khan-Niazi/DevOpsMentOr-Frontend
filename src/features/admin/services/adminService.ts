import { apiClient } from '@/shared/services';
import type {
  ActionMessage,
  AdminPaginated,
  AdminUserDetail,
  AdminUserListItem,
  AdminUserListQuery,
  AuditLogItem,
  AuditLogQuery,
  DashboardData,
  PlatformAdminItem,
  SystemSetting,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

export const adminService = {
  /** ADM-01 */
  async listUsers(query: AdminUserListQuery): Promise<AdminPaginated<AdminUserListItem>> {
    const { data } = await apiClient.get<{ data: AdminPaginated<AdminUserListItem> }>(
      '/admin/users',
      {
        params: {
          page: query.page,
          pageSize: query.pageSize,
          ...(query.search ? { search: query.search } : {}),
          ...(query.role ? { role: query.role } : {}),
          ...(query.isBanned ? { isBanned: query.isBanned } : {}),
          ...(query.isActive ? { isActive: query.isActive } : {}),
        },
      },
    );
    return unwrap(data);
  },

  /** ADM-02 */
  async getUserDetail(userId: number): Promise<AdminUserDetail> {
    const { data } = await apiClient.get<{ data: AdminUserDetail }>(`/admin/users/${userId}`);
    return unwrap(data);
  },

  /** ADM-03 */
  async banUser(userId: number, banReason: string): Promise<ActionMessage> {
    const { data } = await apiClient.patch<{ data: ActionMessage }>(`/admin/users/${userId}/ban`, {
      banReason,
    });
    return unwrap(data);
  },

  /** ADM-04 */
  async unbanUser(userId: number): Promise<ActionMessage> {
    const { data } = await apiClient.patch<{ data: ActionMessage }>(`/admin/users/${userId}/unban`);
    return unwrap(data);
  },

  /** ADM-05 */
  async deleteUser(userId: number): Promise<ActionMessage> {
    const { data } = await apiClient.delete<{ data: ActionMessage }>(`/admin/users/${userId}`);
    return unwrap(data);
  },

  /** ADM-06 */
  async getDashboard(): Promise<DashboardData> {
    const { data } = await apiClient.get<{ data: DashboardData }>('/admin/dashboard');
    return unwrap(data);
  },

  /** ADM-07 */
  async listAuditLogs(query: AuditLogQuery): Promise<AdminPaginated<AuditLogItem>> {
    const { data } = await apiClient.get<{ data: AdminPaginated<AuditLogItem> }>(
      '/admin/audit-logs',
      {
        params: {
          page: query.page,
          pageSize: query.pageSize,
          ...(query.action ? { action: query.action } : {}),
          ...(query.from ? { from: query.from } : {}),
          ...(query.to ? { to: query.to } : {}),
        },
      },
    );
    return unwrap(data);
  },

  /** ADM-08 */
  async listSystemSettings(): Promise<SystemSetting[]> {
    const { data } = await apiClient.get<{ data: SystemSetting[] }>('/admin/settings');
    return unwrap(data);
  },

  /** ADM-09 */
  async updateSystemSetting(key: string, settingValue: unknown): Promise<SystemSetting> {
    const { data } = await apiClient.patch<{ data: SystemSetting }>(`/admin/settings/${key}`, {
      settingValue,
    });
    return unwrap(data);
  },

  /** ADM-10 */
  async listPlatformAdmins(): Promise<PlatformAdminItem[]> {
    const { data } = await apiClient.get<{ data: PlatformAdminItem[] }>('/admin/platform-admins');
    return unwrap(data);
  },
};

export default adminService;
