// SCR-F7-02/03/04 shared ranked table. Rows are normalized by the page so the
// same table renders global, country, season, class and org standings. The
// session user's own row gets an accent-glow highlight (no status pills).

export interface LeaderboardRow {
  userId: number;
  rank: number | null;
  name: string;
  points: number;
  countryCode?: string | null;
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
            <th className="leaderboard-table__rank">Rank</th>
            <th>Learner</th>
            <th className="leaderboard-table__num">Points</th>
            <th>Country</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
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
