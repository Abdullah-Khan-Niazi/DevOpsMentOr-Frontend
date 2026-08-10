import { Link } from 'react-router-dom';
import type { AdminUserListItem } from '../types';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Status text only — no pill badges (§10 DO NOT CREATE UserStatusPill). */
function statusText(user: AdminUserListItem): string {
  if (user.deletedAt) return 'Deleted';
  if (user.isBanned) return 'Banned';
  if (!user.isActive) return 'Inactive';
  return 'Active';
}

interface AdminUserTableProps {
  users: AdminUserListItem[];
  isLoading: boolean;
}

export function AdminUserTable({ users, isLoading }: AdminUserTableProps) {
  if (isLoading) {
    return <p className="py-6 text-sm text-slate-500">Loading users…</p>;
  }

  if (users.length === 0) {
    return <p className="py-6 text-sm text-slate-500">No users found matching filters.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
          <th className="px-3 py-2 font-medium">User</th>
          <th className="px-3 py-2 font-medium">Roles</th>
          <th className="px-3 py-2 font-medium">Status</th>
          <th className="px-3 py-2 font-medium">Joined</th>
          <th className="px-3 py-2 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr
            key={user.userId}
            className="border-b border-border/60 last:border-0 hover:bg-slate-50/60"
          >
            <td className="px-3 py-2.5">
              <div className="font-medium text-slate-900">{user.fullName ?? user.username}</div>
              <div className="text-xs text-slate-500">
                @{user.username} · {user.email}
              </div>
            </td>
            <td className="px-3 py-2.5 text-slate-600">
              {user.roles.length === 0 ? '—' : user.roles.join(', ')}
            </td>
            <td className="px-3 py-2.5 text-slate-700">{statusText(user)}</td>
            <td className="px-3 py-2.5 text-slate-600">{formatDate(user.createdAt)}</td>
            <td className="px-3 py-2.5">
              <Link
                to={`/admin/users/${user.userId}`}
                className="inline-block rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
              >
                View
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default AdminUserTable;
