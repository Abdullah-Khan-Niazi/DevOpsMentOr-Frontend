import { useMemo, useState } from 'react';
import { generatePath, Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { formatNumber, safeHttpUrl } from '@/shared/utils';

// SCR-F7-02/03/04 shared ranked table with column sorting, safe avatars, rank deltas and profile links.

export interface LeaderboardRow {
  userId: number;
  rank: number | null;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  points: number;
  courseCompletionsCount?: number | null;
  rankDelta?: number | null;
  countryCode?: string | null;
}

type SortColumn = 'rank' | 'name' | 'courses' | 'points' | 'country';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span
      aria-hidden="true"
      className={`ml-1 inline-block transition-opacity ${active ? 'font-bold opacity-100' : 'opacity-35'}`}
    >
      {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );
}

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
  isLoading: boolean;
  viewerUserId?: number | null;
  /** countryCode → flag emoji lookup (from the F2 countries catalog). */
  countryFlags?: Map<string, string>;
  emptyTitle: string;
  emptyDescription?: string;
  showCourses?: boolean;
  showCountry?: boolean;
}

export function leaderboardInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

export function LeaderboardAvatar({
  avatarUrl,
  name,
  className = 'leaderboard-table__avatar',
}: {
  avatarUrl?: string | null;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const safeAvatar = !failed ? safeHttpUrl(avatarUrl) : null;

  return (
    <span className={className} aria-hidden="true">
      {safeAvatar ? (
        <img
          src={safeAvatar}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="leaderboard-table__avatar-img"
          onError={() => setFailed(true)}
        />
      ) : (
        leaderboardInitials(name)
      )}
    </span>
  );
}

export function RankDeltaBadge({ delta }: { delta?: number | null }) {
  if (!delta) return null;
  const up = delta > 0;
  return (
    <span
      className={`leaderboard-delta ${up ? 'leaderboard-delta--up' : 'leaderboard-delta--down'}`}
      title={up ? `Up ${delta} ranks` : `Down ${Math.abs(delta)} ranks`}
    >
      {up ? `▲${delta}` : `▼${Math.abs(delta)}`}
    </span>
  );
}

export function LeaderboardTable({
  rows,
  isLoading,
  viewerUserId,
  countryFlags,
  emptyTitle,
  emptyDescription,
  showCourses = true,
  showCountry = true,
}: LeaderboardTableProps) {
  const [sortCol, setSortCol] = useState<SortColumn>('rank');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir(col === 'points' || col === 'courses' ? 'desc' : 'asc');
    }
  };

  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortCol) {
        case 'rank':
          valA = a.rank ?? 999999;
          valB = b.rank ?? 999999;
          break;
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'courses':
          valA = a.courseCompletionsCount ?? 0;
          valB = b.courseCompletionsCount ?? 0;
          break;
        case 'points':
          valA = a.points;
          valB = b.points;
          break;
        case 'country':
          valA = a.countryCode ?? '';
          valB = b.countryCode ?? '';
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [rows, sortCol, sortDir]);

  if (isLoading) {
    return (
      <div className="leaderboard-table-wrap" aria-hidden="true">
        <div className="leaderboard-table leaderboard-table--skeleton" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="leaderboard-empty">
        <h3 className="leaderboard-empty__title">{emptyTitle}</h3>
        {emptyDescription ? (
          <p className="leaderboard-empty__description">{emptyDescription}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="leaderboard-table-wrap">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th
              className="leaderboard-table__rank"
              aria-sort={
                sortCol === 'rank' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('rank')}
                className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none"
              >
                Rank <SortIcon active={sortCol === 'rank'} direction={sortDir} />
              </button>
            </th>
            <th
              aria-sort={
                sortCol === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('name')}
                className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none"
              >
                Learner <SortIcon active={sortCol === 'name'} direction={sortDir} />
              </button>
            </th>
            {showCourses ? (
              <th
                className="leaderboard-table__courses"
                aria-sort={
                  sortCol === 'courses' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                }
              >
                <button
                  type="button"
                  onClick={() => handleSort('courses')}
                  className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none"
                >
                  Courses <SortIcon active={sortCol === 'courses'} direction={sortDir} />
                </button>
              </th>
            ) : null}
            <th
              className="leaderboard-table__num"
              aria-sort={
                sortCol === 'points' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('points')}
                className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none"
              >
                Points <SortIcon active={sortCol === 'points'} direction={sortDir} />
              </button>
            </th>
            {showCountry ? (
              <th
                className="leaderboard-table__flag"
                aria-sort={
                  sortCol === 'country' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                }
              >
                <button
                  type="button"
                  onClick={() => handleSort('country')}
                  className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none"
                >
                  Country <SortIcon active={sortCol === 'country'} direction={sortDir} />
                </button>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const isViewer = row.userId === viewerUserId;
            const flag = row.countryCode ? countryFlags?.get(row.countryCode) : undefined;
            const profileTo = generatePath(ROUTES.PROFILE_VIEW, { userId: String(row.userId) });
            return (
              <tr key={row.userId} className={isViewer ? 'leaderboard-table__row--self' : ''}>
                <td className="leaderboard-table__rank">
                  <span>{row.rank !== null ? `#${row.rank}` : '–'}</span>
                  <RankDeltaBadge delta={row.rankDelta} />
                </td>
                <td>
                  <span className="leaderboard-table__learner">
                    <LeaderboardAvatar avatarUrl={row.avatarUrl} name={row.name} />
                    <span className="min-w-0 truncate">
                      <Link to={profileTo} className="leaderboard-table__name-link">
                        {row.name}
                      </Link>
                      {row.username ? (
                        <span className="leaderboard-table__username">@{row.username}</span>
                      ) : null}
                      {isViewer ? <span className="leaderboard-table__self-label">You</span> : null}
                    </span>
                  </span>
                </td>
                {showCourses ? (
                  <td className="leaderboard-table__courses">
                    {row.courseCompletionsCount !== undefined && row.courseCompletionsCount !== null
                      ? formatNumber(row.courseCompletionsCount)
                      : '–'}
                  </td>
                ) : null}
                <td className="leaderboard-table__num">{formatNumber(row.points)} XP</td>
                {showCountry ? (
                  <td className="leaderboard-table__flag">
                    {flag ?? row.countryCode ?? '–'}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default LeaderboardTable;
