import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  OrgDashboardSkeleton,
  Skeleton,
  PageHeader,
  TabRow,
  type TabItem,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useMyOrg, useOrgClasses, useOrgUsers } from '../hooks';
import type { ClassDto, OrgUserDto } from '../types';
import { NewCohortDrawer, OrgInviteDrawer, OrgMemberDetailDrawer } from '../components';

const TABS: TabItem[] = [
  { id: 'cohorts', label: 'Cohorts' },
  { id: 'members', label: 'Organization Members' },
];

/** F3 contract §09 SCR-F3-03: org workspace dashboard with NothingOS aesthetic. */
export function OrgDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { query } = useMyOrg();
  const classesQuery = useOrgClasses();
  const orgUsersQuery = useOrgUsers();

  const canInvite = useAuthStore((state) =>
    Boolean(
      state.user?.permissions?.some((p) =>
        ['org:professors:invite', 'org:students:invite', 'org:manage'].includes(p),
      ),
    ),
  );
  const canViewSettings = useAuthStore((state) =>
    (state.user?.permissions ?? []).includes('org:manage'),
  );

  // Synchronize active tab with URL query parameters
  const tabParam = searchParams.get('tab') || 'cohorts';
  const activeTab = tabParam === 'members' ? 'members' : 'cohorts';

  const setActiveTab = (tabId: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tabId);
        return next;
      },
      { replace: true },
    );
  };

  // Drawer states bound to search parameters for seamless back button support
  const activeDrawer = searchParams.get('drawer'); // 'cohort' | 'invite' | null
  const selectedUserIdStr = searchParams.get('userId');
  const selectedUserId = selectedUserIdStr ? Number(selectedUserIdStr) : null;

  const openCohortDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('drawer', 'cohort');
      next.delete('userId');
      return next;
    });
  };

  const openInviteDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('drawer', 'invite');
      next.delete('userId');
      return next;
    });
  };

  const openMemberDetail = (userId: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('userId', String(userId));
      next.delete('drawer');
      return next;
    });
  };

  const closeDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('drawer');
      next.delete('userId');
      return next;
    });
  };

  // Member search and role filtering state
  const [memberSearch, setMemberSearch] = useState('');
  type MemberRoleFilter = 'all' | 'org_student' | 'professor' | 'org_admin';
  const [memberRoleFilter, setMemberRoleFilter] = useState<MemberRoleFilter>('all');

  const cohorts = useMemo<ClassDto[]>(
    () => classesQuery.data?.data ?? [],
    [classesQuery.data?.data],
  );

  const { totalCapacity, utilizationRate } = useMemo(() => {
    const totalCap = cohorts.reduce((acc: number, c: ClassDto) => acc + (c.maxStudents || 0), 0);
    const totalEnrolled = query.data?.stats.studentCount ?? 0;
    const rate = totalCap > 0 ? Math.round((totalEnrolled / totalCap) * 100) : 0;
    return { totalCapacity: totalCap, utilizationRate: rate };
  }, [cohorts, query.data]);

  const allMembers = useMemo<OrgUserDto[]>(() => orgUsersQuery.data ?? [], [orgUsersQuery.data]);

  const filteredMembers = useMemo(() => {
    return allMembers.filter((m: OrgUserDto) => {
      if (memberRoleFilter !== 'all' && m.role !== memberRoleFilter) return false;
      if (!memberSearch.trim()) return true;
      const term = memberSearch.trim().toLowerCase();
      const matchName = (m.fullName || '').toLowerCase().includes(term);
      const matchEmail = m.email.toLowerCase().includes(term);
      const matchUsername = m.username.toLowerCase().includes(term);
      return matchName || matchEmail || matchUsername;
    });
  }, [allMembers, memberRoleFilter, memberSearch]);

  if (query.isLoading) {
    return <OrgDashboardSkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Organization Dashboard" />
        <ErrorState
          message={query.error?.message ?? 'Unable to load organization information.'}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const org = query.data;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title="Organization Dashboard"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={openCohortDrawer}>
              + New Cohort
            </Button>
            {canInvite ? (
              <Button variant="secondary" size="sm" onClick={openInviteDrawer}>
                Invite Users
              </Button>
            ) : null}
          </div>
        }
      />

      {/* Organization Identity Strip */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {org.logoUrl ? (
              <img
                src={org.logoUrl}
                alt={`${org.name} logo`}
                className="h-12 w-12 border border-border object-contain shrink-0"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center border border-border bg-surface text-lg font-bold text-card-foreground shrink-0 font-mono">
                {org.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-card-foreground truncate">{org.name}</h2>
                {org.isVerified ? (
                  <span className="border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground font-mono">
                    Verified
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted font-mono">
                {[org.industry, org.emailDomain ? `@${org.emailDomain} restricted` : 'Open enrollment']
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
          {canViewSettings ? (
            <Link to={ROUTES.ORG_SETTINGS} className="shrink-0">
              <Button variant="ghost" size="sm">
                Organization settings &rarr;
              </Button>
            </Link>
          ) : null}
        </div>
      </Card>

      {/* Top Organization Vitals Strip — Pure DB-driven metrics with micro-interactions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => setActiveTab('cohorts')} className="cursor-pointer">
          <OrgKpiTile
            label="Active Cohorts"
            value={org.stats.classCount}
            subtext="Provisioned cohorts in organization"
          />
        </div>
        <div
          onClick={() => {
            setActiveTab('members');
            setMemberRoleFilter('org_student');
          }}
          className="cursor-pointer"
        >
          <OrgKpiTile
            label="Enrolled Students"
            value={org.stats.studentCount}
            subtext="Active learners across all rosters"
          />
        </div>
        <div
          onClick={() => {
            setActiveTab('members');
            setMemberRoleFilter('professor');
          }}
          className="cursor-pointer"
        >
          <OrgKpiTile
            label="Students & Professors"
            value={org.stats.professorCount}
            subtext="Academic professors and cohort educators"
          />
        </div>
        <div>
          <OrgKpiTile
            label="Seat Utilization"
            value={totalCapacity > 0 ? `${utilizationRate}%` : 'Nominal'}
            subtext={
              totalCapacity > 0
                ? `${org.stats.studentCount} of ${totalCapacity} allocated seats`
                : 'Quota ceiling active'
            }
            interactive={false}
          />
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <TabRow items={TABS} activeId={activeTab} onChange={setActiveTab} />

      {/* ─── TAB 1: Cohorts Workspaces ─── */}
      {activeTab === 'cohorts' && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="text-base font-semibold text-card-foreground">Cohorts</h3>
            </div>
            <Link to={ROUTES.ORG_CLASSES}>
              <Button variant="secondary" size="sm">
                View All Cohorts &rarr;
              </Button>
            </Link>
          </div>

          {classesQuery.isLoading ? (
            <div className="divide-y divide-border/60 border-t border-border/80 pt-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center justify-between py-3.5 px-4">
                  <div className="space-y-1.5 w-1/3">
                    <Skeleton className="h-4 w-36 rounded-xs" />
                    <Skeleton className="h-3 w-24 rounded-xs" />
                  </div>
                  <Skeleton className="h-4 w-28 rounded-xs" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-2 w-28 rounded-xs" />
                    <Skeleton className="h-3 w-16 rounded-xs" />
                  </div>
                  <Skeleton className="h-3 w-20 rounded-xs" />
                </div>
              ))}
            </div>
          ) : cohorts.length === 0 ? (
            <EmptyState
              title="No cohorts provisioned yet"
              description="Create your first cohort using the button on top to start inviting students and tracking lab telemetry."
            />
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted font-mono">
                    <th className="px-4 py-3 font-medium">Cohort</th>
                    <th className="px-4 py-3 font-medium">Lead Professor</th>
                    <th className="px-4 py-3 font-medium">Enrolled Capacity</th>
                    <th className="px-4 py-3 font-medium text-right">Provisioned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {cohorts.map((c: ClassDto) => {
                    const percent =
                      c.maxStudents > 0
                        ? Math.min(100, Math.round((c.studentCount / c.maxStudents) * 100))
                        : 0;
                    return (
                      <tr
                        key={c.classId}
                        tabIndex={0}
                        onClick={() =>
                          navigate(
                            ROUTES.ORG_CLASS_DETAIL.replace(':classId', String(c.classId)),
                            { state: { fromUrl: '/org/dashboard?tab=cohorts' } },
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            navigate(
                              ROUTES.ORG_CLASS_DETAIL.replace(':classId', String(c.classId)),
                              { state: { fromUrl: '/org/dashboard?tab=cohorts' } },
                            );
                          }
                        }}
                        className="cursor-pointer hover:bg-surface/80 active:bg-surface transition-colors focus:outline-hidden focus:bg-surface/90"
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-card-foreground block">
                            {c.className}
                          </span>
                          <span className="text-xs text-muted font-mono">{c.slug}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-card-foreground">
                          {c.professorName ?? (
                            <span className="text-muted italic font-mono">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 border border-border bg-surface overflow-hidden">
                              <div
                                className="h-full bg-brand-600 transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted font-mono whitespace-nowrap">
                              {c.studentCount} / {c.maxStudents}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-muted font-mono">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─── TAB 2: Organization Members & Telemetry ─── */}
      {activeTab === 'members' && (
        <Card className="p-6 space-y-4">
          <div className="border-b border-border pb-4">
            <h3 className="text-base font-semibold text-card-foreground">Organization Members</h3>
          </div>

          {/* Member Search and Role Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="grow max-w-md">
              <input
                type="text"
                className="input-field w-full text-xs font-mono"
                placeholder="Search member name, email, or username…"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
            <div>
              <select
                aria-label="Filter by role"
                className="input-field text-xs font-mono h-9 min-w-[130px]"
                value={memberRoleFilter}
                onChange={(e) => setMemberRoleFilter(e.target.value as MemberRoleFilter)}
              >
                <option value="all">All Roles</option>
                <option value="org_student">Students</option>
                <option value="professor">Professors</option>
                <option value="org_admin">Admins</option>
              </select>
            </div>
          </div>

          {orgUsersQuery.isLoading ? (
            <div className="divide-y divide-border/60 border-t border-border/80 pt-2">
              {Array.from({ length: 6 }, (_, j) => (
                <div key={j} className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-center gap-3 w-1/3">
                    <Skeleton variant="circular" className="h-8 w-8 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32 rounded-xs" />
                      <Skeleton className="h-3 w-40 rounded-xs" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20 rounded-xs" />
                  <Skeleton className="h-4 w-28 rounded-xs" />
                  <Skeleton className="h-4 w-12 rounded-xs" />
                  <Skeleton className="h-3 w-20 rounded-xs" />
                </div>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <EmptyState
              title={memberSearch ? 'No matching members' : 'No organization members found'}
              description={
                memberSearch
                  ? 'Try adjusting your search query or filter.'
                  : 'Invite students or professors using the button above to populate your organization workspace.'
              }
            />
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted font-mono">
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Assigned Cohorts</th>
                    <th className="px-4 py-3 font-medium text-center">Modules Done</th>
                    <th className="px-4 py-3 font-medium text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredMembers.map((m: OrgUserDto) => {
                    const roleLabel =
                      m.role === 'org_admin'
                        ? 'Org Admin'
                        : m.role === 'professor'
                          ? 'Professor'
                          : 'Student';

                    return (
                      <tr
                        key={m.userId}
                        tabIndex={0}
                        onClick={() => openMemberDetail(m.userId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            openMemberDetail(m.userId);
                          }
                        }}
                        className="cursor-pointer hover:bg-surface/80 active:bg-surface transition-colors focus:outline-hidden focus:bg-surface/90"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center border border-border bg-surface text-xs font-bold font-mono text-card-foreground shrink-0">
                              {(m.fullName || m.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-card-foreground block text-sm">
                                {m.fullName || m.username}
                              </span>
                              <span className="text-xs text-muted font-mono truncate block">
                                {m.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-card-foreground font-mono">
                          {roleLabel}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted font-mono">
                          {m.classes.length > 0 ? (
                            m.classes.map((c) => c.className).join(', ')
                          ) : (
                            <span className="text-muted/60">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-card-foreground font-mono text-center">
                          {m.completedModules}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted font-mono">
                          {new Date(m.enrolledAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─── SLIDE-OVER DRAWERS ─── */}
      <NewCohortDrawer
        isOpen={activeDrawer === 'cohort'}
        onClose={closeDrawer}
        onSuccess={() => {
          void classesQuery.refetch();
          void query.refetch();
        }}
      />

      <OrgInviteDrawer
        isOpen={activeDrawer === 'invite'}
        onClose={closeDrawer}
        onSuccess={() => {
          void classesQuery.refetch();
          void orgUsersQuery.refetch();
          void query.refetch();
        }}
      />

      <OrgMemberDetailDrawer
        userId={selectedUserId}
        isOpen={Boolean(selectedUserId)}
        onClose={closeDrawer}
        onUpdate={() => {
          void orgUsersQuery.refetch();
          void classesQuery.refetch();
          void query.refetch();
        }}
      />
    </div>
  );
}

function OrgKpiTile({
  label,
  value,
  subtext,
  interactive = true,
}: {
  label: string;
  value: string | number;
  subtext: string;
  interactive?: boolean;
}) {
  return (
    <Card
      className={`group flex flex-col justify-between p-5 transition-all duration-160 ease-[var(--ease-standard)] ${
        interactive ? 'hover:-translate-y-0.5 hover:border-ink cursor-pointer' : ''
      }`}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted transition-colors group-hover:text-card-foreground font-mono">
          {label}
        </p>
        <p className="mt-1.5 text-3xl font-bold tracking-tight text-card-foreground font-mono">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
      <p className="mt-2 text-xs text-muted">{subtext}</p>
    </Card>
  );
}

export default OrgDashboardPage;
