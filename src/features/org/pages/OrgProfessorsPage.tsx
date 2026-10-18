import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, ErrorState, PageHeader } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOrgUsers } from '../hooks';
import { OrgInviteDrawer, OrgMemberDetailDrawer } from '../components';
import type { OrgUserDto } from '../types';

type MemberRoleTab = 'ALL' | 'PROFESSOR' | 'ORG_STUDENT' | 'ORG_ADMIN';

type SortColumn = 'fullName' | 'email' | 'role' | 'classes' | 'createdAt';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100 font-bold' : 'opacity-30'}`}>
      {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
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

          {/* Role Filter Tabs (Minimal Roundness + Inverted Active Hover) */}
          <div className="flex items-center gap-1 border border-border/80 p-0.5 bg-surface/70 rounded-md text-[10px] sm:text-[11px] font-mono shrink-0 shadow-xs">
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
                className={`px-3 py-1 transition-all duration-150 cursor-pointer rounded-md font-medium active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                  roleTab === tab.key
                    ? 'bg-ink text-pearl-100 font-semibold shadow-xs hover:bg-white hover:text-ink hover:outline hover:outline-1 hover:outline-ink'
                    : 'text-muted hover:text-card-foreground hover:bg-surface-hover/80'
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
          />
        ) : orgUsersQuery.isLoading ? (
          <div className="py-8 text-center text-xs text-muted font-mono">
            Loading organization roster…
          </div>
        ) : sortedMembers.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted font-mono space-y-2">
            <p className="text-sm font-semibold text-card-foreground">No members found</p>
            <p>
              {searchQuery
                ? 'Try adjusting your search criteria or role filter.'
                : 'No members have been added to this roster yet.'}
            </p>
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted font-mono">
                  <th
                    className="px-4 py-3 font-medium cursor-pointer select-none hover:text-card-foreground"
                    onClick={() => handleSort('fullName')}
                  >
                    Member <SortIcon active={sortCol === 'fullName'} direction={sortDir} />
                  </th>
                  <th
                    className="px-4 py-3 font-medium cursor-pointer select-none hover:text-card-foreground"
                    onClick={() => handleSort('role')}
                  >
                    Role <SortIcon active={sortCol === 'role'} direction={sortDir} />
                  </th>
                  <th
                    className="px-4 py-3 font-medium cursor-pointer select-none hover:text-card-foreground"
                    onClick={() => handleSort('classes')}
                  >
                    Assigned Cohorts <SortIcon active={sortCol === 'classes'} direction={sortDir} />
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sortedMembers.map((member: OrgUserDto) => {
                  const roleBadge =
                    member.role === 'org_admin'
                      ? 'border border-border text-muted bg-surface'
                      : member.role === 'professor'
                        ? 'border border-accent text-accent font-semibold bg-accent/10'
                        : 'border border-border/70 text-card-foreground bg-pearl-200';

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
                        <span className={`px-2 py-0.5 rounded-sm uppercase text-[10px] tracking-wide ${roleBadge}`}>
                          {roleLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-card-foreground font-mono">
                        {member.classes && member.classes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {member.classes.map((c) => (
                              <span
                                key={c.classId}
                                className="border border-border px-1.5 py-0.5 rounded-sm bg-surface text-[10px]"
                              >
                                {c.className}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(member.userId);
                          }}
                          className="text-xs font-mono text-muted hover:text-card-foreground hover:underline transition-colors cursor-pointer"
                        >
                          View detail &rarr;
                        </button>
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
