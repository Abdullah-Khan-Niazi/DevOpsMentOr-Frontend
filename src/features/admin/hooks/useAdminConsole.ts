import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { adminService } from '../services';
import type { AdminUserListQuery, AuditLogQuery } from '../types';

export function useAdminUsers(query: AdminUserListQuery, enabled = true) {
  const params = JSON.stringify(query);
  return useQuery({
    queryKey: QUERY_KEYS.admin.users(params),
    queryFn: () => adminService.listUsers(query),
    enabled,
  });
}

export function useAdminUserDetail(userId: number, enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.admin.userDetail(userId),
    queryFn: () => adminService.getUserDetail(userId),
    enabled: enabled && userId > 0,
    retry: false,
  });

  const ban = useMutation({
    mutationFn: (banReason: string) => adminService.banUser(userId, banReason),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userDetail(userId) }),
  });

  const unban = useMutation({
    mutationFn: () => adminService.unbanUser(userId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userDetail(userId) }),
  });

  const remove = useMutation({
    mutationFn: () => adminService.deleteUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userDetail(userId) });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  return { query, ban, unban, remove };
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.admin.dashboard,
    queryFn: () => adminService.getDashboard(),
  });
}

export function useAdminAuditLogs(query: AuditLogQuery, enabled = true) {
  const params = JSON.stringify(query);
  return useQuery({
    queryKey: QUERY_KEYS.admin.auditLogs(params),
    queryFn: () => adminService.listAuditLogs(query),
    enabled,
  });
}

export function useAdminSystemSettings() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.admin.systemSettings,
    queryFn: () => adminService.listSystemSettings(),
  });

  const update = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      adminService.updateSystemSetting(key, value),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.systemSettings }),
  });

  return { query, update };
}

export type AdminQueryError = ApiError;
