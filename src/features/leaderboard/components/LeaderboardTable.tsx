import { useState, useMemo } from 'react';

// SCR-F7-02/03/04 shared ranked table with column sorting.
// The session user's own row gets an accent-glow highlight (no status pills).

export interface LeaderboardRow {
  userId: number;
  rank: number | null;
  name: string;
  points: number;
  countryCode?: string | null;
}

type SortColumn = 'rank' | 'name' | 'points' | 'country';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100 font-bold' : 'opacity-30'}`}>
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
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

export function LeaderboardTable({
  rows,
  isLoading,
  viewerUserId,
  countryFlags,
  emptyTitle,
  emptyDescription,
}: LeaderboardTableProps) {
  const [sortCol, setSortCol] = useState<SortColumn>('rank');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir(col === 'points' ? 'desc' : 'asc');
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
              className="leaderboard-table__rank cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('rank')}
            >
              Rank <SortIcon active={sortCol === 'rank'} direction={sortDir} />
            </th>
            <th
              className="cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('name')}
            >
              Learner <SortIcon active={sortCol === 'name'} direction={sortDir} />
            </th>
            <th
              className="leaderboard-table__num cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('points')}
            >
              Points <SortIcon active={sortCol === 'points'} direction={sortDir} />
            </th>
            <th
              className="cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('country')}
            >
              Country <SortIcon active={sortCol === 'country'} direction={sortDir} />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const isViewer = row.userId === viewerUserId;
            const flag = row.countryCode ? countryFlags?.get(row.countryCode) : undefined;
            return (
              <tr key={row.userId} className={isViewer ? 'leaderboard-table__row--self' : ''}>
                <td className="leaderboard-table__rank">{row.rank ?? '–'}</td>
                <td>
                  <span className="leaderboard-table__learner">
                    <span className="leaderboard-table__avatar" aria-hidden="true">
                      {initials(row.name)}
                    </span>
                    <span>{row.name}</span>
                    {isViewer ? <span className="leaderboard-table__self-label">You</span> : null}
                  </span>
                </td>
                <td className="leaderboard-table__num">{row.points}</td>
                <td className="leaderboard-table__flag">{flag ?? '–'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default LeaderboardTable;
