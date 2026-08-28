import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorState, PageHeader, Pagination } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { useSeasonLeaderboard, useSeasons } from '../hooks/useLeaderboard';
import type { SeasonLeaderboardEntryDto } from '../types';

const PAGE_SIZE = 25;
const MINUTE_MS = 60_000;

function toRows(items: SeasonLeaderboardEntryDto[]) {
  return items.map((entry) => ({
    userId: entry.userId,
    rank: entry.rank,
    name: entry.displayName ?? entry.fullName ?? 'Anonymous',
    points: entry.pointsEarned,
  }));
}

function seasonWindowLabel(startDate: string, endDate: string, now: number): string {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (now < start) {
    return `Starts ${new Date(startDate).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })}`;
  }
  const daysLeft = Math.ceil((end - now) / 86_400_000);
  if (daysLeft > 0) {
    return `Ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  }
  return 'Ended';
}

/** SCR-F7-03: season standings with a season switcher (public). */
export function SeasonLeaderboardPage() {
  const { seasonId: seasonIdParam } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.userId);
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), MINUTE_MS);
    return () => window.clearInterval(interval);
  }, []);

  const seasons = useSeasons();
  const fallback = useMemo(() => {
    const list = seasons.data ?? [];
    return list.find((season) => season.isActive) ?? list[0] ?? null;
  }, [seasons.data]);

  const seasonId = seasonIdParam ? Number(seasonIdParam) : (fallback?.seasonId ?? null);
  const standings = useSeasonLeaderboard(seasonId, page, PAGE_SIZE);

  const selected = (seasons.data ?? []).find((season) => season.seasonId === seasonId) ?? null;
  const data = standings.data;
  const viewerRank = data?.viewerRank ?? null;
  const windowLabel = selected
    ? seasonWindowLabel(selected.startDate, selected.endDate, now)
    : null;

  const started = selected !== null && now >= new Date(selected.startDate).getTime();

  return (
    <div>
      <PageHeader
        title="Season leaderboard"
        description={selected ? `${selected.seasonName} · ${windowLabel ?? ''}`.trim() : undefined}
        actions={
          <select
            className="input-field leaderboard-filter"
            value={seasonId ?? ''}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPage(1);
              if (Number.isFinite(next)) {
                navigate(ROUTES.LEADERBOARD_SEASON.replace(':seasonId', String(next)));
              }
            }}
            aria-label="Select season"
          >
            {(seasons.data ?? []).map((season) => (
              <option key={season.seasonId} value={season.seasonId}>
                Season {season.seasonNumber} · {season.seasonName}
              </option>
            ))}
          </select>
        }
      />

      <p className="leaderboard-viewer-note">
        <Link to={ROUTES.LEADERBOARD} className="leaderboard-back">
          ← All-time leaderboard
        </Link>
        {viewerRank !== null ? (
          <span>
            You are ranked <strong>#{viewerRank}</strong> this season.
          </span>
        ) : null}
      </p>

      {seasons.isError ? (
        <ErrorState
          message={seasons.error?.message ?? 'Could not load seasons.'}
          onRetry={() => void seasons.refetch()}
        />
      ) : seasonId === null ? (
        <ErrorState message="No seasons have been created yet." />
      ) : standings.isError ? (
        <ErrorState
          message={standings.error?.message ?? 'Could not load season standings.'}
          onRetry={() => void standings.refetch()}
        />
      ) : (
        <div>
          <LeaderboardTable
            rows={toRows(data?.items ?? [])}
            isLoading={standings.isLoading}
            viewerUserId={userId}
            emptyTitle={started ? 'No points earned yet' : "Season hasn't started"}
            emptyDescription={
              started
                ? 'Learners earn season points from courses, labs and achievements.'
                : 'Standings open when the season starts.'
            }
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

export default SeasonLeaderboardPage;
