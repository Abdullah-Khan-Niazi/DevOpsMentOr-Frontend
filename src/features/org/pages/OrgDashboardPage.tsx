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
  Icon,
  TabPanel,
  TabSwitcher,
  type TabSwitcherItem,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useUrlState } from '@/shared/hooks';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useMyOrg, useOrgClasses, useOrgUsers } from '../hooks';
import type { ClassDto, OrgUserDto } from '../types';
import { NewCohortDrawer, OrgInviteDrawer, OrgMemberDetailDrawer } from '../components';
import { safeHttpUrl } from '@/shared/utils';

const TAB_IDS = ['cohorts', 'members'] as const;
type OrgDashboardTab = (typeof TAB_IDS)[number];

const TABS: ReadonlyArray<TabSwitcherItem<OrgDashboardTab>> = [
  { id: 'cohorts', label: 'Cohorts', icon: 'classes' },
  { id: 'members', label: 'Organization Members', icon: 'users' },
];

/** F3 contract §09 SCR-F3-03: org workspace dashboard with NothingOS aesthetic. */
export function OrgDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { query } = useMyOrg();
  const classesQuery = useOrgClasses();
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const canManageOrg = permissions.includes('org:manage');
  const canCreateCohort = permissions.some((p) =>
    ['org:manage', 'org:classes:manage', 'class:manage'].includes(p),
  );
  const orgUsersQuery = useOrgUsers(canManageOrg);

  const canInvite = permissions.some((p) =>
    [
      'org:professors:invite',
      'org:students:invite',
      'class:students:invite',
      'org:manage',
    ].includes(p),
  );
  const canViewSettings = canManageOrg;

  // Active tab lives in the URL. Professors do not receive the org-directory
  // tab; only org admins may see organization members.
  const [urlTab, setUrlTab] = useUrlState<OrgDashboardTab>('tab', TAB_IDS, 'cohorts');
  const activeTab: OrgDashboardTab = canManageOrg ? urlTab : 'cohorts';
  const tabs = canManageOrg ? TABS : TABS.slice(0, 1);

  const setActiveTab = (tabId: OrgDashboardTab) => {
    if (tabId === 'members' && !canManageOrg) return;
    setUrlTab(tabId);
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
            {canCreateCohort ? (
              <Button variant="primary" size="sm" iconName="plus" onClick={openCohortDrawer}>
                New Cohort
              </Button>
            ) : null}
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
            {safeHttpUrl(org.logoUrl) ? (
              <img
                src={safeHttpUrl(org.logoUrl) ?? undefined}
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
                  <Icon
                    name="verified"
                    size={16}
                    title="Verified organization"
                    className="text-muted shrink-0"
                  />
                ) : null}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted font-mono">
                {org.industry ? <span>{org.industry}</span> : null}
                <span>
                  {org.emailDomain ? `@${org.emailDomain} restricted` : 'Open enrollment'}
                </span>
              </div>
            </div>
          </div>
          {canViewSettings ? (
            <Link to={ROUTES.ORG_SETTINGS} className="shrink-0">
              <Button variant="ghost" size="sm" iconName="arrow-right" iconPosition="right">
                Organization settings
              </Button>
            </Link>
          ) : null}
        </div>
      </Card>

      {/* Organization vitals: DB-driven metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => setActiveTab('cohorts')} className="cursor-pointer">
          <OrgKpiTile label="Active Cohorts" value={org.stats.classCount} />
        </div>
        <div
          onClick={() => {
            if (!canManageOrg) return;
            setActiveTab('members');
            setMemberRoleFilter('org_student');
          }}
          className={canManageOrg ? 'cursor-pointer' : undefined}
        >
          <OrgKpiTile
            label="Enrolled Students"
            value={org.stats.studentCount}
            interactive={canManageOrg}
          />
        </div>
        <div
          onClick={() => {
            if (!canManageOrg) return;
            setActiveTab('members');
            setMemberRoleFilter('professor');
          }}
          className={canManageOrg ? 'cursor-pointer' : undefined}
        >
          <OrgKpiTile
            label="Students & Professors"
            value={org.stats.professorCount}
            interactive={canManageOrg}
          />
        </div>
        <div>
          <OrgKpiTile
            label="Seat Utilization"
            value={totalCapacity > 0 ? `${utilizationRate}%` : 'Nominal'}
            interactive={false}
          />
        </div>
      </div>

      <TabSwitcher
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
        ariaLabel="Organization dashboard sections"
        idPrefix="org-dashboard"
      />

      {/* ─── TAB 1: Cohorts Workspaces ─── */}
      <TabPanel idPrefix="org-dashboard" id="cohorts" active={activeTab === 'cohorts'}>
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-card-foreground">Cohorts</h3>
            </div>
            <Link to={ROUTES.ORG_CLASSES}>
              <Button variant="secondary" size="sm" iconName="arrow-right" iconPosition="right">
                View All Cohorts
              </Button>
            </Link>
          </div>

          {classesQuery.isLoading ? (
            <div>
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
            <EmptyState title="No cohorts provisioned yet" />
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-xs text-muted font-mono">
                    <th className="px-4 py-3 font-medium">Cohort</th>
                    <th className="px-4 py-3 font-medium">Lead Professor</th>
                    <th className="px-4 py-3 font-medium">Enrolled Capacity</th>
                    <th className="px-4 py-3 font-medium text-right">Provisioned</th>
                  </tr>
                </thead>
                <tbody>
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
                          navigate(ROUTES.ORG_CLASS_DETAIL.replace(':classId', String(c.classId)), {
                            state: { fromUrl: '/org/dashboard?tab=cohorts' },
                          })
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
      </TabPanel>

      {/* ─── TAB 2: Organization Members & Telemetry (org admins only) ─── */}
      <TabPanel idPrefix="org-dashboard" id="members" active={activeTab === 'members'}>
        <Card className="p-6 space-y-4">
          <div>
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
                className="input-field text-xs font-mono h-9 min-w-[8.125rem]"
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
            <div>
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
            />
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-xs text-muted font-mono">
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Assigned Cohorts</th>
                    <th className="px-4 py-3 font-medium text-center">Modules Done</th>
                    <th className="px-4 py-3 font-medium text-right">Joined</th>
                  </tr>
                </thead>
                <tbody>
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
                            <span className="text-muted/60">-</span>
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
      </TabPanel>

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
        userId={canManageOrg ? selectedUserId : null}
        isOpen={canManageOrg && Boolean(selectedUserId)}
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
  interactive = true,
}: {
  label: string;
  value: string | number;
  interactive?: boolean;
}) {
  return (
    <Card
      className={`group flex flex-col justify-between p-5 transition-all duration-160 ease-[var(--ease-standard)] ${
        interactive ? 'hover:-translate-y-0.5 hover:border-ink cursor-pointer' : ''
      }`}
    >
      <div>
        <p className="text-xs font-medium text-muted transition-colors group-hover:text-card-foreground font-mono">
          {label}
        </p>
        <p className="mt-1.5 text-3xl font-bold tracking-tight text-card-foreground font-mono">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </Card>
  );
}

export default OrgDashboardPage;
