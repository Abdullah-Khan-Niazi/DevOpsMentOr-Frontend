import { Card } from '@/shared/components';

// SCR-F7-01 stats strip: 4 raised tiles with accent figures.
// Loading renders the same tile grid with skeleton figures so layout never
// jumps (guidelines §4 — contextual skeletons, not full-page spinners).

interface StatsBarProps {
  pointsBalance: number | null;
  globalRank: number | null;
  badgeCount: number | null;
  streakDays: number | null;
  isLoading: boolean;
}

function StatTile({
  label,
  value,
  isLoading,
  accent = false,
}: {
  label: string;
  value: string;
  isLoading: boolean;
  accent?: boolean;
}) {
  return (
    <Card className="stats-bar__tile">
      <span className="stats-bar__label">{label}</span>
      {isLoading ? (
        <span className="stats-bar__skeleton" aria-hidden="true" />
      ) : (
        <span className={`stats-bar__value${accent ? ' stats-bar__value--accent' : ''}`}>
          {value}
        </span>
      )}
    </Card>
  );
}

export function StatsBar({
  pointsBalance,
  globalRank,
  badgeCount,
  streakDays,
  isLoading,
}: StatsBarProps) {
  return (
    <div className="stats-bar">
      <StatTile
        label="Points balance"
        value={pointsBalance === null ? '–' : String(pointsBalance)}
        isLoading={isLoading}
        accent
      />
      <StatTile
        label="Global rank"
        value={globalRank === null ? '–' : `#${globalRank}`}
        isLoading={isLoading}
      />
      <StatTile
        label="Badges"
        value={badgeCount === null ? '–' : String(badgeCount)}
        isLoading={isLoading}
      />
      <StatTile
        label="Streak days"
        value={streakDays === null ? '–' : String(streakDays)}
        isLoading={isLoading}
      />
    </div>
  );
}

export default StatsBar;
