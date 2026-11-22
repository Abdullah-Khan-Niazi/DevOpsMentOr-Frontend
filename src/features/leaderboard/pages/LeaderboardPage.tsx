import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  TabPanel,
  TabSwitcher,
  type TabSwitcherItem,
} from '@/shared/components';
import { QUERY_KEYS } from '@/shared/constants';
import { useUrlState } from '@/shared/hooks';
import { useAuthStore } from '@/features/auth';
import { useGamificationSummary } from '@/features/achievements/hooks/useGamificationSummary';
import { adminOrgService } from '@/features/admin/organizations/services';
import { useMyOrg, useOrgClasses } from '@/features/org/hooks';
import { useCountries } from '@/features/profile/hooks';
import { LeaderboardTable, type LeaderboardRow } from '../components/LeaderboardTable';
import {
  useClassLeaderboard,
  useCountryLeaderboard,
  useGlobalLeaderboard,
  useOrgLeaderboard,
  useSeasonLeaderboard,
  useSeasons,
} from '../hooks/useLeaderboard';
import type { LeaderboardEntryDto, SeasonLeaderboardEntryDto } from '../types';
import { LeaderboardPageSkeleton, LeaderboardTableSkeleton } from './LeaderboardPageSkeleton';

const PAGE_SIZE = 25;

const LEADERBOARD_TABS = ['global', 'country', 'season', 'class', 'organization'] as const;
export type LeaderboardTab = (typeof LEADERBOARD_TABS)[number];

export interface LeaderboardPageProps {
  /** Tab opened when the URL names none (the cohort route opens on the class or organization board). */
  defaultTab?: 'global' | 'class' | 'organization';
}

interface PinnedStanding {
  rank: number;
  name: string;
  points: number;
}

function displayName(entry: { displayName: string | null; fullName: string | null }): string {
  return entry.displayName ?? entry.fullName ?? 'Anonymous';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

/** Rank comes from the server as returned (ties share a rank); the table sorts nothing server-side. */
function toRows(
  items: LeaderboardEntryDto[],
  rankOf: (entry: LeaderboardEntryDto) => number | null,
): LeaderboardRow[] {
  return items.map((entry) => ({
    userId: entry.userId,
    rank: rankOf(entry),
    name: displayName(entry),
    points: entry.totalPoints,
    countryCode: entry.countryCode,
  }));
}

function toSeasonRows(items: SeasonLeaderboardEntryDto[]): LeaderboardRow[] {
  return items.map((entry) => ({
    userId: entry.userId,
    rank: entry.rank,
    name: displayName(entry),
    points: entry.pointsEarned,
  }));
}

/** The viewer's own row, kept below the table when the viewer is not on the current page. */
function PinnedStandingRow({ standing }: { standing: PinnedStanding }) {
  return (
    <div className="leaderboard-table-wrap mt-3" role="region" aria-label="Your standing">
      <table className="leaderboard-table">
        <tbody>
          <tr className="leaderboard-table__row--self">
            <td className="leaderboard-table__rank">{standing.rank}</td>
            <td>
              <span className="leaderboard-table__learner">
                <span className="leaderboard-table__avatar" aria-hidden="true">
                  {initials(standing.name)}
                </span>
                <span>{standing.name}</span>
                <span className="leaderboard-table__self-label">You</span>
              </span>
            </td>
            <td className="leaderboard-table__num">{standing.points}</td>
            <td className="leaderboard-table__flag">–</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

interface StandingsBoardProps {
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  onRetry: () => void;
  rows: LeaderboardRow[];
  emptyTitle: string;
  viewerUserId?: number | null;
  countryFlags?: Map<string, string>;
  pinned?: PinnedStanding | null;
  pagination?: { page: number; total: number; onPageChange: (page: number) => void };
}

/** One ranked board: loading, error, empty, the table, the pinned viewer row and pagination. */
function StandingsBoard({
  isLoading,
  isError,
  errorMessage,
  onRetry,
  rows,
  emptyTitle,
  viewerUserId,
  countryFlags,
  pinned,
  pagination,
}: StandingsBoardProps) {
  if (isLoading) {
    return <LeaderboardTableSkeleton />;
  }
  if (isError) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }
  return (
    <div>
      {rows.length > 0 ? (
        <LeaderboardTable
          rows={rows}
          isLoading={false}
          viewerUserId={viewerUserId}
          countryFlags={countryFlags}
          emptyTitle={emptyTitle}
        />
      ) : (
        <EmptyState title={emptyTitle} />
      )}
      {pinned ? <PinnedStandingRow standing={pinned} /> : null}
      {pagination ? (
        <Pagination
          page={pagination.page}
          pageSize={PAGE_SIZE}
          total={pagination.total}
          totalPages={Math.max(1, Math.ceil(pagination.total / PAGE_SIZE))}
          onPageChange={pagination.onPageChange}
        />
      ) : null}
    </div>
  );
}

/**
 * SCR-F7-02/03/04: leaderboards as URL-driven tabs. Global, country and season are paginated
 * public boards; class and organization boards exist for members with the matching access.
 */
export function LeaderboardPage({ defaultTab = 'global' }: LeaderboardPageProps) {
  const user = useAuthStore((state) => state.user);
  const userId = user?.userId ?? null;
  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
  const isPlatformAdmin = user?.roles.includes('platform_admin') ?? false;
  const isOrgAdmin = user?.roles.includes('org_admin') ?? false;
  const showClassTab = !isPlatformAdmin && permissions.has('gamification:class:read');
  const showOrgTab =
    (permissions.has('gamification:org:read') || isPlatformAdmin) &&
    (isOrgAdmin || isPlatformAdmin);

  const tabs = useMemo<Array<TabSwitcherItem<LeaderboardTab>>>(
    () => [
      { id: 'global', label: 'Global' },
      { id: 'country', label: 'Country' },
      { id: 'season', label: 'Season' },
      ...(showClassTab ? [{ id: 'class' as const, label: 'Class' }] : []),
      ...(showOrgTab ? [{ id: 'organization' as const, label: 'Organization' }] : []),
    ],
    [showClassTab, showOrgTab],
  );

  const [storedTab, setStoredTab] = useUrlState<LeaderboardTab>(
    'tab',
    LEADERBOARD_TABS,
    defaultTab,
  );
  const activeTab: LeaderboardTab = tabs.some((item) => item.id === storedTab)
    ? storedTab
    : 'global';

  const [page, setPage] = useState(1);
  const [countryCode, setCountryCode] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [platformOrgId, setPlatformOrgId] = useState<number | null>(null);

  const countries = useCountries();
  const global = useGlobalLeaderboard(page, PAGE_SIZE);
  const country = useCountryLeaderboard(
    activeTab === 'country' && countryCode ? countryCode : null,
    page,
    PAGE_SIZE,
  );
  const seasons = useSeasons();
  const defaultSeason =
    seasons.data?.find((season) => season.isActive) ?? seasons.data?.[0] ?? null;
  const seasonId = selectedSeasonId ?? defaultSeason?.seasonId ?? null;
  const season = useSeasonLeaderboard(activeTab === 'season' ? seasonId : null, page, PAGE_SIZE);
  const classes = useOrgClasses({ page: 1, pageSize: 100 });
  const classBoard = useClassLeaderboard(activeTab === 'class' ? classId : null);
  const myOrg = useMyOrg();
  const orgId = isPlatformAdmin ? platformOrgId : (myOrg.query.data?.organizationId ?? null);
  const orgBoard = useOrgLeaderboard(activeTab === 'organization' ? orgId : null);
  const adminOrgs = useQuery({
    queryKey: QUERY_KEYS.admin.organizations('picker'),
    queryFn: () => adminOrgService.listOrgs({ page: 1, pageSize: 100 }),
    enabled: isPlatformAdmin && showOrgTab,
    retry: false,
  });
  const summary = useGamificationSummary();

  const countryFlags = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of countries.data ?? []) {
      if (entry.flagEmoji) map.set(entry.countryCode, entry.flagEmoji);
    }
    return map;
  }, [countries.data]);

  const globalItems = global.data?.items ?? [];
  const viewerRank = global.data?.viewerRank ?? null;
  const viewerOnPage = globalItems.some((entry) => entry.userId === userId);
  // The viewer's points are the ledger balance (the leaderboard total is the same ledger sum).
  const pinned: PinnedStanding | null =
    viewerRank !== null && !viewerOnPage && summary.data
      ? {
          rank: viewerRank,
          name: user?.fullName ?? user?.username ?? 'You',
          points: summary.data.balance,
        }
      : null;

  const selectTab = (next: LeaderboardTab) => {
    setStoredTab(next);
    setPage(1);
  };

  const renderFilter = (): ReactNode => {
    switch (activeTab) {
      case 'country':
        return (
          <select
            className="input-field leaderboard-filter"
            value={countryCode}
            onChange={(event) => {
              setCountryCode(event.target.value);
              setPage(1);
            }}
            aria-label="Select country"
          >
            <option value="">Select a country</option>
            {(countries.data ?? []).map((entry) => (
              <option key={entry.countryId} value={entry.countryCode}>
                {entry.flagEmoji ? `${entry.flagEmoji} ` : ''}
                {entry.countryName}
              </option>
            ))}
          </select>
        );
      case 'season':
        return (
          <select
            className="input-field leaderboard-filter"
            value={seasonId ?? ''}
            onChange={(event) => {
              setSelectedSeasonId(Number(event.target.value));
              setPage(1);
            }}
            aria-label="Select season"
          >
            {(seasons.data ?? []).map((item) => (
              <option key={item.seasonId} value={item.seasonId}>
                Season {item.seasonNumber} · {item.seasonName}
              </option>
            ))}
          </select>
        );
      case 'class':
        return (
          <select
            className="input-field leaderboard-filter"
            value={classId ?? ''}
            onChange={(event) => {
              setClassId(event.target.value ? Number(event.target.value) : null);
            }}
            aria-label="Select class"
          >
            <option value="">Select a class</option>
            {(classes.data?.data ?? []).map((cls) => (
              <option key={cls.classId} value={cls.classId}>
                {cls.className}
              </option>
            ))}
          </select>
        );
      case 'organization':
        if (!isPlatformAdmin) return null;
        return (
          <select
            className="input-field leaderboard-filter"
            value={platformOrgId ?? ''}
            onChange={(event) => {
              setPlatformOrgId(event.target.value ? Number(event.target.value) : null);
            }}
            aria-label="Select organization"
          >
            <option value="">Select an organization</option>
            {(adminOrgs.data?.data ?? []).map((org) => (
              <option key={org.organizationId} value={org.organizationId}>
                {org.name}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const renderBody = (): ReactNode => {
    switch (activeTab) {
      case 'global':
        return (
          <StandingsBoard
            isLoading={global.isLoading}
            isError={global.isError}
            errorMessage={global.error?.message ?? 'Could not load the leaderboard.'}
            onRetry={() => void global.refetch()}
            rows={toRows(globalItems, (entry) => entry.globalRank)}
            emptyTitle="No rankings yet"
            viewerUserId={userId}
            countryFlags={countryFlags}
            pinned={pinned}
            pagination={{ page, total: global.data?.total ?? 0, onPageChange: setPage }}
          />
        );

      case 'country':
        if (!countryCode) {
          return <EmptyState title="Select a country" />;
        }
        return (
          <StandingsBoard
            isLoading={country.isLoading}
            isError={country.isError}
            errorMessage={country.error?.message ?? 'Could not load the country leaderboard.'}
            onRetry={() => void country.refetch()}
            rows={toRows(country.data?.items ?? [], (entry) => entry.countryRank)}
            emptyTitle="No rankings in this country yet"
            viewerUserId={userId}
            countryFlags={countryFlags}
            pagination={{
              page,
              total: country.data?.total ?? 0,
              onPageChange: setPage,
            }}
          />
        );

      case 'season':
        if (seasons.isError) {
          return (
            <ErrorState
              message={seasons.error?.message ?? 'Could not load seasons.'}
              onRetry={() => void seasons.refetch()}
            />
          );
        }
        if (seasonId === null) {
          return seasons.isLoading ? (
            <LeaderboardTableSkeleton />
          ) : (
            <EmptyState title="No seasons yet" />
          );
        }
        return (
          <StandingsBoard
            isLoading={season.isLoading}
            isError={season.isError}
            errorMessage={season.error?.message ?? 'Could not load season standings.'}
            onRetry={() => void season.refetch()}
            rows={toSeasonRows(season.data?.items ?? [])}
            emptyTitle="No season standings yet"
            viewerUserId={userId}
            pagination={{
              page,
              total: season.data?.total ?? 0,
              onPageChange: setPage,
            }}
          />
        );

      case 'class':
        if (classes.isError) {
          return (
            <ErrorState
              message={classes.error?.message ?? 'Could not load your classes.'}
              onRetry={() => void classes.refetch()}
            />
          );
        }
        if (classId === null) {
          if (classes.isLoading) {
            return <LeaderboardTableSkeleton />;
          }
          return (
            <EmptyState
              title={(classes.data?.data.length ?? 0) === 0 ? 'No classes yet' : 'Select a class'}
            />
          );
        }
        return (
          <StandingsBoard
            isLoading={classBoard.isLoading}
            isError={classBoard.isError}
            errorMessage={classBoard.error?.message ?? 'Could not load the class leaderboard.'}
            onRetry={() => void classBoard.refetch()}
            rows={toRows(classBoard.data?.items ?? [], (entry) => entry.globalRank)}
            emptyTitle="No student rankings yet"
            viewerUserId={userId}
            countryFlags={countryFlags}
          />
        );

      case 'organization':
        if (isPlatformAdmin) {
          if (adminOrgs.isError) {
            return (
              <ErrorState
                message={adminOrgs.error?.message ?? 'Could not load organizations.'}
                onRetry={() => void adminOrgs.refetch()}
              />
            );
          }
          if (platformOrgId === null) {
            return adminOrgs.isLoading ? (
              <LeaderboardTableSkeleton />
            ) : (
              <EmptyState title="Select an organization" />
            );
          }
        } else {
          if (myOrg.query.isError) {
            return (
              <ErrorState
                message={myOrg.query.error?.message ?? 'Could not load your organization.'}
                onRetry={() => void myOrg.query.refetch()}
              />
            );
          }
          if (orgId === null) {
            return myOrg.query.isLoading ? (
              <LeaderboardTableSkeleton />
            ) : (
              <EmptyState title="No organization yet" />
            );
          }
        }
        return (
          <StandingsBoard
            isLoading={orgBoard.isLoading}
            isError={orgBoard.isError}
            errorMessage={orgBoard.error?.message ?? 'Could not load the organization leaderboard.'}
            onRetry={() => void orgBoard.refetch()}
            rows={toRows(orgBoard.data?.items ?? [], (entry) => entry.globalRank)}
            emptyTitle="No member rankings yet"
            viewerUserId={userId}
            countryFlags={countryFlags}
          />
        );

      default:
        return null;
    }
  };

  if (activeTab === 'global' && global.isLoading) {
    return <LeaderboardPageSkeleton />;
  }

  return (
    <div>
      <PageHeader title="Leaderboard" />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <TabSwitcher
          items={tabs}
          value={activeTab}
          onChange={selectTab}
          ariaLabel="Leaderboard scope"
          idPrefix="leaderboard"
        />
        {renderFilter()}
      </div>

      <div className="mt-6">
        <TabPanel idPrefix="leaderboard" id={activeTab} active>
          {renderBody()}
        </TabPanel>
      </div>
    </div>
  );
}

export default LeaderboardPage;
