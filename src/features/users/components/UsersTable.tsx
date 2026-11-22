import { useState, useMemo } from 'react';
import type { User } from '../types';
import { Icon } from '@/shared/components';

type SortColumn = 'name' | 'email' | 'role' | 'status';

interface UsersTableProps {
  users: User[];
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

export function UsersTable({ users }: UsersTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
        case 'name':
          cmp = (a.name ?? '').localeCompare(b.name ?? '');
          break;
        case 'email':
          cmp = (a.email ?? '').localeCompare(b.email ?? '');
          break;
        case 'role':
          cmp = (a.role ?? '').localeCompare(b.role ?? '');
          break;
        case 'status':
          cmp = (a.status ?? '').localeCompare(b.status ?? '');
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [users, sortColumn, sortDirection]);

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface/50 text-muted">
          <tr>
            <th
              aria-sort={
                sortColumn === 'name'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
              className="px-4 py-3 font-semibold text-xs tracking-wider uppercase"
            >
              <button
                type="button"
                onClick={() => handleSort('name')}
                className="group inline-flex items-center gap-1.5 transition-colors hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink rounded-sm"
              >
                <span>Name</span>
                <SortIcon active={sortColumn === 'name'} direction={sortDirection} />
              </button>
            </th>
            <th
              aria-sort={
                sortColumn === 'email'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
              className="px-4 py-3 font-semibold text-xs tracking-wider uppercase"
            >
              <button
                type="button"
                onClick={() => handleSort('email')}
                className="group inline-flex items-center gap-1.5 transition-colors hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink rounded-sm"
              >
                <span>Email</span>
                <SortIcon active={sortColumn === 'email'} direction={sortDirection} />
              </button>
            </th>
            <th
              aria-sort={
                sortColumn === 'role'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
              className="px-4 py-3 font-semibold text-xs tracking-wider uppercase"
            >
              <button
                type="button"
                onClick={() => handleSort('role')}
                className="group inline-flex items-center gap-1.5 transition-colors hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink rounded-sm"
              >
                <span>Role</span>
                <SortIcon active={sortColumn === 'role'} direction={sortDirection} />
              </button>
            </th>
            <th
              aria-sort={
                sortColumn === 'status'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
              className="px-4 py-3 font-semibold text-xs tracking-wider uppercase"
            >
              <button
                type="button"
                onClick={() => handleSort('status')}
                className="group inline-flex items-center gap-1.5 transition-colors hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink rounded-sm"
              >
                <span>Status</span>
                <SortIcon active={sortColumn === 'status'} direction={sortDirection} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user) => (
            <tr key={user.id} className="hover:bg-surface/60 transition-colors">
              <td className="px-4 py-3 font-medium text-card-foreground">{user.name}</td>
              <td className="px-4 py-3 text-muted font-mono text-xs">{user.email}</td>
              <td className="px-4 py-3 text-muted capitalize">{user.role}</td>
              <td className="px-4 py-3 capitalize text-muted">
                <span
                  className={`text-sm font-medium ${
                    user.status === 'active' ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  {user.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
