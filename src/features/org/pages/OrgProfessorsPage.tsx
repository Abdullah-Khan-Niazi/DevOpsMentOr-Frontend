import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, PageHeader, Icon } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOrgUsers } from '../hooks';
import { OrgInviteDrawer, OrgMemberDetailDrawer } from '../components';
import type { OrgUserDto } from '../types';
import { OrgProfessorsPageSkeleton } from './OrgProfessorsPageSkeleton';

type MemberRoleTab = 'ALL' | 'PROFESSOR' | 'ORG_STUDENT' | 'ORG_ADMIN';

type SortColumn = 'fullName' | 'email' | 'role' | 'classes' | 'createdAt';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span
      className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100 font-bold' : 'opacity-30'}`}
    >
      <Icon name={active ? (direction === 'asc' ? 'arrow-up' : 'arrow-down') : 'sort'} size={14} />
    </span>
  );
}

/**
 * F3 contract §09 SCR-F3-04: Students & Professors directory with
 * role filters, search, sorting, detail inspection, and invite drawer.
 */
export function OrgProfessorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const canInvite = useAuthStore((state) =>
    (state.user?.permissions ?? []).some((p) =>
      ['org:professors:invite', 'org:members:invite', 'org.users.write'].includes(p),
    ),
  );

  const orgUsersQuery = useOrgUsers();

  const [roleTab, setRoleTab] = useState<MemberRoleTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [sortCol, setSortCol] = useState<SortColumn>('fullName');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const isInviteDrawerOpen = searchParams.get('drawer') === 'invite';

  const openInviteDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('drawer', 'invite');
      return next;
    });
  };

  const closeInviteDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('drawer');
      return next;
    });
  };

  const handleSort = (column: SortColumn) => {
    if (sortCol === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(column);
      setSortDir('asc');
    }
  };

  const filteredMembers = useMemo(() => {
    const list = orgUsersQuery.data ?? [];
    return list.filter((m) => {
      // Role filter
      if (roleTab === 'PROFESSOR' && m.role !== 'professor') return false;
      if (roleTab === 'ORG_STUDENT' && m.role !== 'org_student') return false;
      if (roleTab === 'ORG_ADMIN' && m.role !== 'org_admin') return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (m.fullName ?? '').toLowerCase();
        const email = m.email.toLowerCase();
        const username = (m.username ?? '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !username.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [orgUsersQuery.data, roleTab, searchQuery]);

  const sortedMembers = useMemo(() => {
    const sorted = [...filteredMembers];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortCol) {
        case 'fullName':
          valA = (a.fullName ?? a.email).toLowerCase();
          valB = (b.fullName ?? b.email).toLowerCase();
          break;
        case 'email':
          valA = a.email.toLowerCase();
          valB = b.email.toLowerCase();
          break;
        case 'role':
          valA = a.role;
          valB = b.role;
          break;
        case 'classes':
          valA = a.classes?.length ?? 0;
          valB = b.classes?.length ?? 0;
          break;
        case 'createdAt':
          valA = a.userId;
          valB = b.userId;
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredMembers, sortCol, sortDir]);

  const roleCounts = useMemo(() => {
    const all = orgUsersQuery.data ?? [];
    return {
      all: all.length,
      professors: all.filter((u) => u.role === 'professor').length,
      students: all.filter((u) => u.role === 'org_student').length,
      admins: all.filter((u) => u.role === 'org_admin').length,
    };
  }, [orgUsersQuery.data]);

  if (orgUsersQuery.isLoading) return <OrgProfessorsPageSkeleton />;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title="Students &amp; Professors"
        backTo={ROUTES.ORG_DASHBOARD}
        actions={
          canInvite ? (
            <Button variant="primary" size="sm" onClick={openInviteDrawer}>
              + Invite Member
            </Button>
          ) : undefined
        }
      />

      <Card className="p-6 space-y-4">
        {/* Search Bar & Minimal Roundness Segmented Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search input */}
          <div className="grow max-w-md">
            <input
              type="text"
              className="w-full border border-border bg-surface px-3 py-1.5 text-xs font-mono text-card-foreground placeholder:text-muted focus:outline-none focus:border-accent rounded-md"
              placeholder="Search member name, email, or username…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Role Filter Tabs - universal .tab-switcher */}
          <div className="tab-switcher shrink-0 text-[0.625rem] sm:text-[0.6875rem]">
            {(
              [
                { key: 'ALL', label: `All (${roleCounts.all})` },
                { key: 'PROFESSOR', label: `Professors (${roleCounts.professors})` },
                { key: 'ORG_STUDENT', label: `Students (${roleCounts.students})` },
                { key: 'ORG_ADMIN', label: `Admins (${roleCounts.admins})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleTab(tab.key)}
                className={`tab-switcher__tab ${
                  roleTab === tab.key ? 'tab-switcher__tab--active' : ''
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {orgUsersQuery.isError ? (
          <ErrorState
            message={orgUsersQuery.error?.message ?? 'Unable to load organization members.'}
            onRetry={() => void orgUsersQuery.refetch()}
            retrying={orgUsersQuery.isRefetching}
          />
        ) : sortedMembers.length === 0 ? (
          <EmptyState
            icon="users"
            title={searchQuery ? 'No matching members found' : 'No members yet'}
          />
        ) : (
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted font-mono">
                  <th
                    className="px-4 py-3 font-medium"
                    aria-sort={
                      sortCol === 'fullName'
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('fullName')}
                      className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                    >
                      Member <SortIcon active={sortCol === 'fullName'} direction={sortDir} />
                    </button>
                  </th>
                  <th
                    className="px-4 py-3 font-medium"
                    aria-sort={
                      sortCol === 'role' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('role')}
                      className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                    >
                      Role <SortIcon active={sortCol === 'role'} direction={sortDir} />
                    </button>
                  </th>
                  <th
                    className="px-4 py-3 font-medium"
                    aria-sort={
                      sortCol === 'classes'
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('classes')}
                      className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                    >
                      Assigned Cohorts{' '}
                      <SortIcon active={sortCol === 'classes'} direction={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((member: OrgUserDto) => {
                  const roleBadge =
                    member.role === 'org_admin'
                      ? 'text-muted'
                      : member.role === 'professor'
                        ? 'text-accent font-semibold'
                        : 'text-card-foreground';

                  const roleLabel =
                    member.role === 'org_admin'
                      ? 'Admin'
                      : member.role === 'professor'
                        ? 'Professor'
                        : 'Student';

                  return (
                    <tr
                      key={member.userId}
                      onClick={() => setSelectedUserId(member.userId)}
                      className="cursor-pointer hover:bg-surface/80 active:bg-surface transition-colors focus:outline-hidden focus:bg-surface/90"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-card-foreground text-sm">
                          {member.fullName ?? member.username ?? '-'}
                        </div>
                        <div className="text-xs text-muted font-mono">{member.email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        <span className={roleBadge}>{roleLabel}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-card-foreground font-mono">
                        {member.classes && member.classes.length > 0 ? (
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {member.classes.map((c) => (
                              <span key={c.classId}>{c.className}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted text-[0.6875rem]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(member.userId);
                          }}
                        >
                          View detail
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Member Details Drawer */}
      <OrgMemberDetailDrawer
        userId={selectedUserId}
        isOpen={selectedUserId !== null}
        onClose={() => setSelectedUserId(null)}
        onUpdate={() => void orgUsersQuery.refetch()}
      />

      {/* Invite Member Drawer */}
      <OrgInviteDrawer
        isOpen={isInviteDrawerOpen}
        onClose={closeInviteDrawer}
        defaultRole={roleTab === 'PROFESSOR' ? 'professor' : 'student'}
        onSuccess={() => void orgUsersQuery.refetch()}
      />
    </div>
  );
}

export default OrgProfessorsPage;
