import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, Icon } from '@/shared/components';
import { AdminUserTableSkeleton } from '../pages/AdminUsersSkeleton';
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
  return roles.map((r) => r.replace('_', ' ')).join(', ');
}

type SortColumn = 'user' | 'roles' | 'organization' | 'country' | 'joined';

interface AdminUserTableProps {
  users: AdminUserListItem[];
  isLoading: boolean;
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) {
    return (
      <Icon
        name="sort"
        size={14}
        className="w-3.5 h-3.5 text-muted/60 group-hover:text-muted transition-colors shrink-0"
      />
    );
  }
  if (direction === 'asc') {
    return (
      <Icon
        name="arrow-up"
        size={14}
        className="w-3.5 h-3.5 text-ink transition-transform shrink-0"
      />
    );
  }
  return (
    <Icon
      name="arrow-down"
      size={14}
      className="w-3.5 h-3.5 text-ink transition-transform shrink-0"
    />
  );
}

export function AdminUserTable({ users, isLoading }: AdminUserTableProps) {
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = useState<SortColumn>('joined');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedUsers = useMemo(() => {
    const list = [...users];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'user': {
          const nameA = (a.fullName ?? a.username).toLowerCase();
          const nameB = (b.fullName ?? b.username).toLowerCase();
          cmp = nameA.localeCompare(nameB);
          break;
        }
        case 'roles': {
          const rolesA = (a.roles ?? []).join(', ');
          const rolesB = (b.roles ?? []).join(', ');
          cmp = rolesA.localeCompare(rolesB);
          break;
        }
        case 'organization': {
          const orgA = (a.organizationName ?? '').toLowerCase();
          const orgB = (b.organizationName ?? '').toLowerCase();
          cmp = orgA.localeCompare(orgB);
          break;
        }
        case 'country': {
          const cA = (a.country ?? '').toLowerCase();
          const cB = (b.country ?? '').toLowerCase();
          cmp = cA.localeCompare(cB);
          break;
        }
        case 'joined': {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          cmp = tA - tB;
          break;
        }
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [users, sortColumn, sortDirection]);

  if (isLoading) {
    return <AdminUserTableSkeleton />;
  }

  if (users.length === 0) {
    return <EmptyState icon="users" title="No users match these filters" />;
  }

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-muted">
            <th
              className="px-3 py-2 font-medium"
              aria-sort={
                sortColumn === 'user'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('user')}
                className="group flex items-center gap-1.5 cursor-pointer hover:text-card-foreground transition-colors font-medium uppercase tracking-wide text-xs"
              >
                <span>User</span>
                <SortIcon active={sortColumn === 'user'} direction={sortDirection} />
              </button>
            </th>
            <th
              className="px-3 py-2 font-medium"
              aria-sort={
                sortColumn === 'roles'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('roles')}
                className="group flex items-center gap-1.5 cursor-pointer hover:text-card-foreground transition-colors font-medium uppercase tracking-wide text-xs"
              >
                <span>Roles</span>
                <SortIcon active={sortColumn === 'roles'} direction={sortDirection} />
              </button>
            </th>
            <th
              className="px-3 py-2 font-medium"
              aria-sort={
                sortColumn === 'organization'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('organization')}
                className="group flex items-center gap-1.5 cursor-pointer hover:text-card-foreground transition-colors font-medium uppercase tracking-wide text-xs"
              >
                <span>Organization</span>
                <SortIcon active={sortColumn === 'organization'} direction={sortDirection} />
              </button>
            </th>
            <th
              className="px-3 py-2 font-medium"
              aria-sort={
                sortColumn === 'country'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('country')}
                className="group flex items-center gap-1.5 cursor-pointer hover:text-card-foreground transition-colors font-medium uppercase tracking-wide text-xs"
              >
                <span>Country</span>
                <SortIcon active={sortColumn === 'country'} direction={sortDirection} />
              </button>
            </th>
            <th
              className="px-3 py-2 font-medium text-right"
              aria-sort={
                sortColumn === 'joined'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('joined')}
                className="group inline-flex items-center gap-1.5 cursor-pointer hover:text-card-foreground transition-colors font-medium uppercase tracking-wide text-xs ml-auto"
              >
                <span>Joined</span>
                <SortIcon active={sortColumn === 'joined'} direction={sortDirection} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user) => (
            <tr
              key={user.userId}
              onClick={() =>
                navigate(ROUTES.ADMIN_USER_DETAIL.replace(':userId', String(user.userId)))
              }
              className="hover:bg-surface-hover cursor-pointer transition-colors group"
            >
              <td className="px-3 py-3">
                <div className="font-medium text-card-foreground group-hover:text-brand-600 transition-colors">
                  {user.fullName ?? user.username}
                </div>
                <div className="text-xs text-muted">
                  @{user.username} {user.email}
                </div>
              </td>
              <td className="px-3 py-3 text-card-foreground text-xs font-normal">
                {formatRolesText(user.roles)}
              </td>
              <td className="px-3 py-3 text-card-foreground text-xs font-normal">
                {user.organizationName ?? '-'}
              </td>
              <td className="px-3 py-3 text-xs text-muted-foreground">{user.country ?? '-'}</td>
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
