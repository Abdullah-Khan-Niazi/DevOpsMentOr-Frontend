import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import type { AdminUserListItem } from '../types';

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatRolesText(roles: string[]): string {
  if (!roles || roles.length === 0) return '-';
  return roles
    .map((r) => r.replace('_', ' '))
    .join(', ');
}

interface AdminUserTableProps {
  users: AdminUserListItem[];
  isLoading: boolean;
}

export function AdminUserTable({ users, isLoading }: AdminUserTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <p className="py-6 text-sm text-muted">Loading users…</p>;
  }

  if (users.length === 0) {
    return <p className="py-6 text-sm text-muted">No users found matching filters.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2 font-medium">User</th>
            <th className="px-3 py-2 font-medium">Roles</th>
            <th className="px-3 py-2 font-medium">Organization</th>
            <th className="px-3 py-2 font-medium">Country</th>
            <th className="px-3 py-2 font-medium text-right">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.userId}
              onClick={() =>
                navigate(ROUTES.ADMIN_USER_DETAIL.replace(':userId', String(user.userId)))
              }
              className="border-b border-border/60 last:border-0 hover:bg-surface/80 cursor-pointer transition-colors group"
            >
              <td className="px-3 py-3">
                <div className="font-medium text-card-foreground group-hover:text-brand-600 transition-colors">
                  {user.fullName ?? user.username}
                </div>
                <div className="text-xs text-muted">
                  @{user.username} · {user.email}
                </div>
              </td>
              <td className="px-3 py-3 text-card-foreground text-xs font-normal">
                {formatRolesText(user.roles)}
              </td>
              <td className="px-3 py-3 text-card-foreground text-xs font-normal">
                {user.organizationName ?? '-'}
              </td>
              <td className="px-3 py-3 text-xs text-muted-foreground">
                {user.country ?? '-'}
              </td>
              <td className="px-3 py-3 text-muted-foreground text-right text-xs tabular-nums">
                {formatDate(user.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUserTable;
