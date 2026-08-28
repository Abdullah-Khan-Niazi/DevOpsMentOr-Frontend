import { useMemo, useState } from 'react';
import { ErrorState, EmptyState, PageHeader, TabRow } from '@/shared/components';
import { useAuthStore } from '@/features/auth';
import { useMyOrg, useOrgClasses } from '@/features/org/hooks';
import { adminOrgService } from '@/features/admin/organizations/services';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { useClassLeaderboard, useOrgLeaderboard } from '../hooks/useLeaderboard';

// SCR-F7-04: professor / org-admin / platform-admin cohort leaderboards.
// Class tab is scoped to org members (professors, org admins); the org tab
// serves org admins (own org via /org/me) and platform admins (org picker).

type TabId = 'class' | 'organization';

function toRows(
  items: Array<{
    userId: number;
    globalRank: number | null;
    totalPoints: number;
    displayName: string | null;
    fullName: string | null;
    countryCode: string | null;
  }>,
) {
  return items.map((entry) => ({
    userId: entry.userId,
    rank: entry.globalRank,
    name: entry.displayName ?? entry.fullName ?? 'Anonymous',
    points: entry.totalPoints,
    countryCode: entry.countryCode,
  }));
}

export function CohortLeaderboardPage() {
  const user = useAuthStore((state) => state.user);
  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
  const isPlatformAdmin = user?.roles.includes('platform_admin') ?? false;
  const isOrgAdmin = user?.roles.includes('org_admin') ?? false;
  const hasClassRead = permissions.has('gamification:class:read') || isPlatformAdmin;
  const hasOrgRead = permissions.has('gamification:org:read') || isPlatformAdmin;

  const showClassTab = !isPlatformAdmin && hasClassRead;
  const showOrgTab = hasOrgRead && (isOrgAdmin || isPlatformAdmin);

  const [tab, setTab] = useState<TabId>(showClassTab ? 'class' : 'organization');
  const [classId, setClassId] = useState<number | null>(null);
  const [platformOrgId, setPlatformOrgId] = useState<number | null>(null);

  const classes = useOrgClasses({ page: 1, pageSize: 100 });
  const myOrg = useMyOrg();
  const classBoard = useClassLeaderboard(classId);
  const orgBoard = useOrgLeaderboard(
    isPlatformAdmin ? platformOrgId : (myOrg.query.data?.organizationId ?? null),
  );

  const adminOrgs = useQuery({
    queryKey: QUERY_KEYS.admin.organizations('picker'),
    queryFn: () => adminOrgService.listOrgs({ page: 1, pageSize: 100 }),
    enabled: isPlatformAdmin && showOrgTab,
    retry: false,
  });

  const tabs = [
    ...(showClassTab ? [{ id: 'class' as const, label: 'Class' }] : []),
    ...(showOrgTab ? [{ id: 'organization' as const, label: 'Organization' }] : []),
  ];

  const activeTab = tabs.some((t) => t.id === tab) ? tab : (tabs[0]?.id ?? 'class');

  return (
    <div>
      <PageHeader
        title="Cohort leaderboard"
        description="Standings for your class or organization cohorts."
      />
      {tabs.length > 0 ? (
        <TabRow items={tabs} activeId={activeTab} onChange={(id) => setTab(id as TabId)} />
      ) : null}

      <div className="mt-6">
        {activeTab === 'class' ? (
          <div>
            <div className="leaderboard-filter-row">
              <select
                className="input-field leaderboard-filter"
                value={classId ?? ''}
                onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : null)}
                aria-label="Select class"
              >
                <option value="">Select a class</option>
                {(classes.data?.data ?? []).map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>

            {classes.isError ? (
              <ErrorState
                message={classes.error?.message ?? 'Could not load your classes.'}
                onRetry={() => void classes.refetch()}
              />
            ) : classId === null ? (
              <EmptyState
                title="Select a class"
                description="Pick a class from the list to see its leaderboard."
              />
            ) : classBoard.isError ? (
              <ErrorState
                message={classBoard.error?.message ?? 'Could not load the class leaderboard.'}
                onRetry={() => void classBoard.refetch()}
              />
            ) : (
              <div>
                <LeaderboardTable
                  rows={toRows(classBoard.data?.items ?? [])}
                  isLoading={classBoard.isLoading}
                  emptyTitle="No student rankings yet"
                  emptyDescription="Rankings appear as class students earn points."
                />
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'organization' ? (
          <div>
            {isPlatformAdmin ? (
              <div className="leaderboard-filter-row">
                <select
                  className="input-field leaderboard-filter"
                  value={platformOrgId ?? ''}
                  onChange={(e) => setPlatformOrgId(e.target.value ? Number(e.target.value) : null)}
                  aria-label="Select organization"
                >
                  <option value="">Select an organization</option>
                  {(adminOrgs.data?.data ?? []).map((org) => (
                    <option key={org.organizationId} value={org.organizationId}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {isPlatformAdmin && adminOrgs.isError ? (
              <ErrorState
                message={adminOrgs.error?.message ?? 'Could not load organizations.'}
                onRetry={() => void adminOrgs.refetch()}
              />
            ) : isPlatformAdmin && platformOrgId === null ? (
              <EmptyState
                title="Select an organization"
                description="Pick an organization to see its leaderboard."
              />
            ) : orgBoard.isError ? (
              <ErrorState
                message={orgBoard.error?.message ?? 'Could not load the organization leaderboard.'}
                onRetry={() => void orgBoard.refetch()}
              />
            ) : (
              <div>
                <LeaderboardTable
                  rows={toRows(orgBoard.data?.items ?? [])}
                  isLoading={orgBoard.isLoading}
                  emptyTitle="No member rankings yet"
                  emptyDescription="Rankings appear as organization members earn points."
                />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CohortLeaderboardPage;
