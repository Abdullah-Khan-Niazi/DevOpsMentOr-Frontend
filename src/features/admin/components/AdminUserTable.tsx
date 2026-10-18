import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/shared/components';
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

type SortColumn = 'user' | 'roles' | 'organization' | 'country' | 'joined';

interface AdminUserTableProps {
  users: AdminUserListItem[];
  isLoading: boolean;
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5 text-muted/60 group-hover:text-muted transition-colors shrink-0"
        aria-hidden="true"
      >
        <path d="m5 10 3 3 3-3M5 6l3-3 3 3" />
      </svg>
    );
  }
  if (direction === 'asc') {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5 text-ink transition-transform shrink-0"
        aria-hidden="true"
      >
        <path d="M8 13V3M4 7l4-4 4 4" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5 text-ink transition-transform shrink-0"
      aria-hidden="true"
    >
      <path d="M8 3v10m-4-4 4 4 4-4" />
    </svg>
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
    return (
      <div className="w-full max-w-full overflow-x-auto">
        <div className="divide-y divide-border/60">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-3">
              <div className="space-y-1.5 w-1/3">
                <Skeleton className="h-4 w-36 rounded-xs" />
                <Skeleton className="h-3 w-48 rounded-xs" />
              </div>
              <Skeleton className="h-4 w-28 rounded-xs hidden md:block" />
              <Skeleton className="h-4 w-32 rounded-xs hidden lg:block" />
              <Skeleton className="h-4 w-20 rounded-xs" />
              <Skeleton className="h-4 w-24 rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return <p className="py-6 text-sm text-muted">No users found matching filters.</p>;
  }

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2 font-medium">
              <button
                type="button"
                onClick={() => handleSort('user')}
                className="group flex items-center gap-1.5 cursor-pointer hover:text-card-foreground transition-colors font-medium uppercase tracking-wide text-xs"
              >
                <span>User</span>
                <SortIcon active={sortColumn === 'user'} direction={sortDirection} />
              </button>
            </th>
            <th className="px-3 py-2 font-medium">
              <button
                type="button"
                onClick={() => handleSort('roles')}
                className="group flex items-center gap-1.5 cursor-pointer hover:text-card-foreground transition-colors font-medium uppercase tracking-wide text-xs"
              >
                <span>Roles</span>
                <SortIcon active={sortColumn === 'roles'} direction={sortDirection} />
              </button>
            </th>
            <th className="px-3 py-2 font-medium">
              <button
                type="button"
                onClick={() => handleSort('organization')}
                className="group flex items-center gap-1.5 cursor-pointer hover:text-card-foreground transition-colors font-medium uppercase tracking-wide text-xs"
              >
                <span>Organization</span>
                <SortIcon active={sortColumn === 'organization'} direction={sortDirection} />
              </button>
            </th>
            <th className="px-3 py-2 font-medium">
              <button
                type="button"
                onClick={() => handleSort('country')}
                className="group flex items-center gap-1.5 cursor-pointer hover:text-card-foreground transition-colors font-medium uppercase tracking-wide text-xs"
              >
                <span>Country</span>
                <SortIcon active={sortColumn === 'country'} direction={sortDirection} />
              </button>
            </th>
            <th className="px-3 py-2 font-medium text-right">
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
              className="border-b border-border/60 last:border-0 hover:bg-[#F3EFE6] cursor-pointer transition-colors group"
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
