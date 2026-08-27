import { useMemo, useState } from 'react';
import { ErrorState, PageHeader, Pagination } from '@/shared/components';
import { useAuthStore } from '@/features/auth';
import { useCountries } from '@/features/profile/hooks';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { useCountryLeaderboard, useGlobalLeaderboard } from '../hooks/useLeaderboard';
import type { LeaderboardEntryDto } from '../types';

const PAGE_SIZE = 25;

function toRows(items: LeaderboardEntryDto[]) {
  return items.map((entry) => ({
    userId: entry.userId,
    rank: entry.globalRank,
    name: entry.displayName ?? entry.fullName ?? 'Anonymous',
    points: entry.totalPoints,
    countryCode: entry.countryCode,
  }));
}

/** SCR-F7-02: global leaderboard with an optional country filter (public). */
export function LeaderboardPage() {
  const userId = useAuthStore((state) => state.user?.userId);
  const [countryCode, setCountryCode] = useState<string>('');
  const [page, setPage] = useState(1);

  const countries = useCountries();
  const global = useGlobalLeaderboard(page, PAGE_SIZE);
  const country = useCountryLeaderboard(countryCode || null, page, PAGE_SIZE);

  const countryFlags = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of countries.data ?? []) {
      if (entry.flagEmoji) map.set(entry.countryCode, entry.flagEmoji);
    }
    return map;
  }, [countries.data]);

  const active = countryCode ? country : global;
  const data = active.data;
  const viewerRank = data?.viewerRank ?? null;

  return (
    <div>
      <PageHeader
        title="Global leaderboard"
        description="Ranked by lifetime points. Standings recompute every 15 minutes."
        actions={
          <select
            className="input-field leaderboard-filter"
            value={countryCode}
            onChange={(e) => {
              setCountryCode(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by country"
          >
            <option value="">All countries</option>
            {(countries.data ?? []).map((entry) => (
              <option key={entry.countryId} value={entry.countryCode}>
                {entry.flagEmoji ? `${entry.flagEmoji} ` : ''}
                {entry.countryName}
              </option>
            ))}
          </select>
        }
      />

      {viewerRank !== null ? (
        <p className="leaderboard-viewer-note">
          You are ranked <strong>#{viewerRank}</strong> on this leaderboard.
        </p>
      ) : null}

      {active.isError ? (
        <ErrorState
          message={active.error?.message ?? 'Could not load the leaderboard.'}
          onRetry={() => void active.refetch()}
        />
      ) : (
        <div>
          <LeaderboardTable
            rows={toRows(data?.items ?? [])}
            isLoading={active.isLoading}
            viewerUserId={userId}
            countryFlags={countryFlags}
            emptyTitle="No rankings yet"
            emptyDescription="Rankings appear once learners earn points."
          />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data?.total ?? 0}
            totalPages={Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;
