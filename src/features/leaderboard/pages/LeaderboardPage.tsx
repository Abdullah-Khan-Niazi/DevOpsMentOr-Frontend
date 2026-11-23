import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { generatePath, Link } from 'react-router-dom';
import {
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  Pagination,
  Select,
  TabPanel,
  TabSwitcher,
  type TabSwitcherItem,
} from '@/shared/components';
import { QUERY_KEYS, ROUTES } from '@/shared/constants';
import { useUrlState } from '@/shared/hooks';
import { formatNumber } from '@/shared/utils';
import { useAuthStore } from '@/features/auth';
import { useGamificationSummary } from '@/features/achievements/hooks/useGamificationSummary';
import { adminOrgService } from '@/features/admin/organizations/services';
import { useMyClasses } from '@/features/enrollment/hooks/useEnrollment';
import { useMyOrg, useOrgClasses } from '@/features/org/hooks';
import { useCountries } from '@/features/profile/hooks';
import {
  LeaderboardAvatar,
  LeaderboardTable,
  RankDeltaBadge,
  type LeaderboardRow,
} from '../components/LeaderboardTable';
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
import '../styles/leaderboard.css';

const PAGE_SIZE = 25;

const LEADERBOARD_TABS = ['global', 'country', 'season', 'class', 'organization'] as const;
export type LeaderboardTab = (typeof LEADERBOARD_TABS)[number];

export interface LeaderboardPageProps {
  /** Tab opened when the URL names none (the cohort route opens on the class or organization board). */
  defaultTab?: 'global' | 'class' | 'organization';
}

interface ViewerStanding {
  rank: number;
  points: number | null;
  pointsToNextRank: number | null;
}

function displayName(entry: {
  displayName: string | null;
  fullName: string | null;
  username?: string;
}): string {
  return entry.displayName ?? entry.fullName ?? entry.username ?? 'Anonymous';
}

/** Rank comes from the server as returned (ties share a rank). */
function toRows(
  items: LeaderboardEntryDto[],
  rankOf: (entry: LeaderboardEntryDto) => number | null,
): LeaderboardRow[] {
  return items.map((entry) => ({
    userId: entry.userId,
    rank: rankOf(entry),
    name: displayName(entry),
    username: entry.username ?? null,
    avatarUrl: entry.avatarUrl ?? null,
    points: entry.totalPoints,
    courseCompletionsCount: entry.courseCompletionsCount ?? null,
    rankDelta: entry.rankDelta ?? null,
    countryCode: entry.countryCode,
  }));
}

function toSeasonRows(items: SeasonLeaderboardEntryDto[]): LeaderboardRow[] {
  return items.map((entry) => ({
    userId: entry.userId,
    rank: entry.rank,
    name: displayName(entry),
    username: entry.username ?? null,
    avatarUrl: entry.avatarUrl ?? null,
    points: entry.pointsEarned,
    countryCode: entry.countryCode ?? null,
  }));
}

function LeaderboardPodium({
  entries,
  countryFlags,
  showCourses,
}: {
  entries: LeaderboardRow[];
  countryFlags?: Map<string, string>;
  showCourses: boolean;
}) {
  const topThree = entries.slice(0, 3);
  if (topThree.length < 3) return null;

  const placeClasses = [
    'leaderboard-podium__card--first',
    'leaderboard-podium__card--second',
    'leaderboard-podium__card--third',
  ];

  return (
    <section aria-label="Top 3 leaders" className="leaderboard-podium">
      {topThree.map((entry, index) => {
        const flag = entry.countryCode ? countryFlags?.get(entry.countryCode) : undefined;
        const profileTo = generatePath(ROUTES.PROFILE_VIEW, { userId: String(entry.userId) });
        return (
          <article key={entry.userId} className={`leaderboard-podium__card ${placeClasses[index]}`}>
            <span className="leaderboard-podium__place">
              {index === 0 ? <Icon name="trophy" size={14} /> : <Icon name="medal" size={14} />}
              <span>#{entry.rank ?? index + 1}</span>
            </span>

            <LeaderboardAvatar
              avatarUrl={entry.avatarUrl}
              name={entry.name}
              className="leaderboard-podium__avatar"
            />

            <Link to={profileTo} className="leaderboard-podium__name">
              {entry.name}
              {flag ? ` ${flag}` : ''}
            </Link>

            <div className="flex items-center gap-1.5">
              <span className="leaderboard-podium__points">{formatNumber(entry.points)} XP</span>
              <RankDeltaBadge delta={entry.rankDelta} />
            </div>

            {showCourses &&
            entry.courseCompletionsCount !== undefined &&
            entry.courseCompletionsCount !== null ? (
              <span className="font-mono text-xs text-muted-foreground">
                {formatNumber(entry.courseCompletionsCount)} courses
              </span>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

/** Persistent standing banner summarizing the viewer's rank, points, and distance to next rank. */
function ViewerStandingBar({ standing }: { standing: ViewerStanding }) {
  return (
    <div className="leaderboard-standing" role="region" aria-label="Your standing">
      <div className="leaderboard-standing__meta">
        <span>Your standing</span>
        <span className="leaderboard-standing__rank">#{formatNumber(standing.rank)}</span>
        {standing.points !== null ? (
          <span className="font-mono font-semibold tabular-nums">
            {formatNumber(standing.points)} XP
          </span>
        ) : null}
      </div>
      <span className="leaderboard-standing__delta">
        {standing.rank === 1
          ? 'Leading the board'
          : standing.pointsToNextRank !== null && standing.pointsToNextRank > 0
            ? `${formatNumber(standing.pointsToNextRank)} XP to next rank`
            : 'Active ranking'}
      </span>
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
  standing?: ViewerStanding | null;
  showPodium?: boolean;
  showCourses?: boolean;
  showCountry?: boolean;
  pagination?: { page: number; total: number; onPageChange: (page: number) => void };
}

/** One ranked board: loading, error, empty, viewer standing bar, top-3 podium, table and pagination. */
function StandingsBoard({
  isLoading,
  isError,
  errorMessage,
  onRetry,
  rows,
  emptyTitle,
  viewerUserId,
  countryFlags,
  standing,
  showPodium = false,
  showCourses = true,
  showCountry = true,
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
      {standing ? <ViewerStandingBar standing={standing} /> : null}
      {showPodium ? (
        <LeaderboardPodium
          entries={rows}
          countryFlags={countryFlags}
          showCourses={showCourses}
        />
      ) : null}
      {rows.length > 0 ? (
        <LeaderboardTable
          rows={rows}
          isLoading={false}
          viewerUserId={viewerUserId}
          countryFlags={countryFlags}
          emptyTitle={emptyTitle}
          showCourses={showCourses}
          showCountry={showCountry}
        />
      ) : (
        <EmptyState icon="leaderboard" title={emptyTitle} />
      )}
      {pagination && pagination.total > PAGE_SIZE ? (
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
 * SCR-F7-02/03/04: Consumer-ready leaderboards with Top-3 Podium, Viewer Standing strip,
 * single-row scope switcher + inline filter, and role-gated cohort boards.
 */
export function LeaderboardPage({ defaultTab = 'global' }: LeaderboardPageProps) {
  const user = useAuthStore((state) => state.user);
  const userId = user?.userId ?? null;
  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
  const isPlatformAdmin = user?.roles.includes('platform_admin') ?? false;
  const isOrgAdmin = user?.roles.includes('org_admin') ?? false;
  const isProfessor = user?.roles.includes('professor') ?? false;
  const isStudent = user?.roles.includes('org_student') ?? false;
  const canManageClasses = isOrgAdmin || isProfessor;

  const showClassTab =
    !isPlatformAdmin && (permissions.has('gamification:class:read') || isStudent);
  const showOrgTab =
    (permissions.has('gamification:org:read') || isPlatformAdmin) &&
    (isOrgAdmin || isPlatformAdmin);

  const tabs = useMemo<Array<TabSwitcherItem<LeaderboardTab>>>(
    () => [
      { id: 'global', label: 'Global', icon: 'globe' },
      { id: 'country', label: 'Country', icon: 'flag' },
      { id: 'season', label: 'Season', icon: 'calendar' },
      ...(showClassTab ? [{ id: 'class' as const, label: 'Class', icon: 'my-class' as const }] : []),
      ...(showOrgTab
        ? [{ id: 'organization' as const, label: 'Organization', icon: 'organization' as const }]
        : []),
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
  const effectiveCountryCode = countryCode || (countries.data?.[0]?.countryCode ?? '');

  const global = useGlobalLeaderboard(page, PAGE_SIZE);
  const country = useCountryLeaderboard(
    activeTab === 'country' && effectiveCountryCode ? effectiveCountryCode : null,
    page,
    PAGE_SIZE,
  );

  const seasons = useSeasons();
  const defaultSeason =
    seasons.data?.find((season) => season.isActive) ?? seasons.data?.[0] ?? null;
  const seasonId = selectedSeasonId ?? defaultSeason?.seasonId ?? null;
  const season = useSeasonLeaderboard(activeTab === 'season' ? seasonId : null, page, PAGE_SIZE);

  const orgClasses = useOrgClasses(
    { page: 1, pageSize: 100 },
    showClassTab && canManageClasses && activeTab === 'class',
  );
  const studentClasses = useMyClasses(
    showClassTab && !canManageClasses && isStudent && activeTab === 'class',
  );
  const classOptions = useMemo(() => {
    if (canManageClasses) {
      return (orgClasses.data?.data ?? []).map((cls) => ({
        classId: cls.classId,
        className: cls.className,
      }));
    }
    return (studentClasses.data ?? []).map((cls) => ({
      classId: cls.classId,
      className: cls.className,
    }));
  }, [canManageClasses, orgClasses.data?.data, studentClasses.data]);

  const effectiveClassId = classId ?? classOptions[0]?.classId ?? null;
  const classBoard = useClassLeaderboard(activeTab === 'class' ? effectiveClassId : null);

  const myOrg = useMyOrg(showOrgTab && !isPlatformAdmin && activeTab === 'organization');
  const adminOrgs = useQuery({
    queryKey: QUERY_KEYS.admin.organizations('picker'),
    queryFn: () => adminOrgService.listOrgs({ page: 1, pageSize: 100 }),
    enabled: isPlatformAdmin && showOrgTab && activeTab === 'organization',
    retry: false,
  });

  const effectivePlatformOrgId = platformOrgId ?? adminOrgs.data?.data?.[0]?.organizationId ?? null;
  const orgId = isPlatformAdmin ? effectivePlatformOrgId : (myOrg.query.data?.organizationId ?? null);
  const orgBoard = useOrgLeaderboard(activeTab === 'organization' ? orgId : null);
  const summary = useGamificationSummary();

  const countryFlags = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of countries.data ?? []) {
      if (entry.flagEmoji) map.set(entry.countryCode, entry.flagEmoji);
    }
    return map;
  }, [countries.data]);

  const globalStanding: ViewerStanding | null =
    global.data?.viewerRank !== null && global.data?.viewerRank !== undefined
      ? {
          rank: global.data.viewerRank,
          points: global.data.viewerPoints ?? summary.data?.balance ?? null,
          pointsToNextRank: global.data.pointsToNextRank ?? null,
        }
      : null;

  const countryStanding: ViewerStanding | null =
    country.data?.viewerRank !== null && country.data?.viewerRank !== undefined
      ? {
          rank: country.data.viewerRank,
          points: country.data.viewerPoints ?? summary.data?.balance ?? null,
          pointsToNextRank: country.data.pointsToNextRank ?? null,
        }
      : null;

  const seasonStanding: ViewerStanding | null =
    season.data?.viewerRank !== null && season.data?.viewerRank !== undefined
      ? {
          rank: season.data.viewerRank,
          points: season.data.viewerPoints ?? null,
          pointsToNextRank: season.data.pointsToNextRank ?? null,
        }
      : null;

  const classStanding: ViewerStanding | null =
    classBoard.data?.viewerRank !== null && classBoard.data?.viewerRank !== undefined
      ? {
          rank: classBoard.data.viewerRank,
          points: classBoard.data.viewerPoints ?? null,
          pointsToNextRank: classBoard.data.pointsToNextRank ?? null,
        }
      : null;

  const orgStanding: ViewerStanding | null =
    orgBoard.data?.viewerRank !== null && orgBoard.data?.viewerRank !== undefined
      ? {
          rank: orgBoard.data.viewerRank,
          points: orgBoard.data.viewerPoints ?? null,
          pointsToNextRank: orgBoard.data.pointsToNextRank ?? null,
        }
      : null;

  const selectTab = (next: LeaderboardTab) => {
    setStoredTab(next);
    setPage(1);
  };

  const renderFilter = (): ReactNode => {
    switch (activeTab) {
      case 'country': {
        const list = countries.data ?? [];
        if (list.length === 0) return null;
        return (
          <Select
            inline
            size="sm"
            aria-label="Select country"
            value={effectiveCountryCode}
            options={list.map((entry) => ({
              value: entry.countryCode,
              label: `${entry.flagEmoji ? `${entry.flagEmoji} ` : ''}${entry.countryName}`,
            }))}
            onChange={(event) => {
              setCountryCode(event.target.value);
              setPage(1);
            }}
          />
        );
      }
      case 'season': {
        const list = seasons.data ?? [];
        if (list.length === 0) return null;
        return (
          <Select
            inline
            size="sm"
            aria-label="Select season"
            value={seasonId !== null ? String(seasonId) : ''}
            options={list.map((item) => ({
              value: String(item.seasonId),
              label: `Season ${item.seasonNumber} · ${item.seasonName}`,
            }))}
            onChange={(event) => {
              setSelectedSeasonId(Number(event.target.value));
              setPage(1);
            }}
          />
        );
      }
      case 'class':
        if (classOptions.length === 0) return null;
        return (
          <Select
            inline
            size="sm"
            aria-label="Select class"
            value={effectiveClassId !== null ? String(effectiveClassId) : ''}
            options={classOptions.map((cls) => ({
              value: String(cls.classId),
              label: cls.className,
            }))}
            onChange={(event) => {
              setClassId(event.target.value ? Number(event.target.value) : null);
            }}
          />
        );
      case 'organization': {
        if (!isPlatformAdmin) return null;
        const list = adminOrgs.data?.data ?? [];
        if (list.length === 0) return null;
        return (
          <Select
            inline
            size="sm"
            aria-label="Select organization"
            value={effectivePlatformOrgId !== null ? String(effectivePlatformOrgId) : ''}
            options={list.map((org) => ({
              value: String(org.organizationId),
              label: org.name,
            }))}
            onChange={(event) => {
              setPlatformOrgId(event.target.value ? Number(event.target.value) : null);
            }}
          />
        );
      }
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
            rows={toRows(global.data?.items ?? [], (entry) => entry.globalRank)}
            emptyTitle="No rankings yet"
            viewerUserId={userId}
            countryFlags={countryFlags}
            standing={globalStanding}
            showPodium={page === 1}
            pagination={{ page, total: global.data?.total ?? 0, onPageChange: setPage }}
          />
        );

      case 'country':
        if (!effectiveCountryCode) {
          return countries.isLoading ? (
            <LeaderboardTableSkeleton />
          ) : (
            <EmptyState icon="flag" title="No countries configured yet" />
          );
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
            standing={countryStanding}
            showPodium={page === 1}
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
            <EmptyState icon="calendar" title="No seasons yet" />
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
            countryFlags={countryFlags}
            standing={seasonStanding}
            showPodium={page === 1}
            showCourses={false}
            pagination={{
              page,
              total: season.data?.total ?? 0,
              onPageChange: setPage,
            }}
          />
        );

      case 'class': {
        const classesLoading = canManageClasses ? orgClasses.isLoading : studentClasses.isLoading;
        const classesError = canManageClasses ? orgClasses.error : studentClasses.error;
        const retryClasses = canManageClasses ? orgClasses.refetch : studentClasses.refetch;
        if (classesError) {
          return (
            <ErrorState
              message={classesError.message ?? 'Could not load your classes.'}
              onRetry={() => void retryClasses()}
            />
          );
        }
        if (effectiveClassId === null) {
          return classesLoading ? (
            <LeaderboardTableSkeleton />
          ) : (
            <EmptyState icon="my-class" title="No classes yet" />
          );
        }
        return (
          <StandingsBoard
            isLoading={classBoard.isLoading}
            isError={classBoard.isError}
            errorMessage={classBoard.error?.message ?? 'Could not load the class leaderboard.'}
            onRetry={() => void classBoard.refetch()}
            rows={toRows(
              classBoard.data?.items ?? [],
              (entry) => entry.cohortRank ?? entry.globalRank,
            )}
            emptyTitle="No student rankings yet"
            viewerUserId={userId}
            countryFlags={countryFlags}
            standing={classStanding}
            showPodium
          />
        );
      }

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
          if (effectivePlatformOrgId === null) {
            return adminOrgs.isLoading ? (
              <LeaderboardTableSkeleton />
            ) : (
              <EmptyState icon="organization" title="No organizations found" />
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
              <EmptyState icon="organization" title="No organization yet" />
            );
          }
        }
        return (
          <StandingsBoard
            isLoading={orgBoard.isLoading}
            isError={orgBoard.isError}
            errorMessage={orgBoard.error?.message ?? 'Could not load the organization leaderboard.'}
            onRetry={() => void orgBoard.refetch()}
            rows={toRows(
              orgBoard.data?.items ?? [],
              (entry) => entry.cohortRank ?? entry.globalRank,
            )}
            emptyTitle="No member rankings yet"
            viewerUserId={userId}
            countryFlags={countryFlags}
            standing={orgStanding}
            showPodium
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
    <div className="pb-12">
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
