import { Card, Icon } from '@/shared/components';

// SCR-F7-01 single achievement row: glyph, name, description, points
// awarded and unlock date. Ordered by the page (unlocked_at DESC).

interface AchievementRowProps {
  name: string;
  description?: string | null;
  pointsAwarded: number;
  unlockedAt: string;
}

export function AchievementRow({
  name,
  description,
  pointsAwarded,
  unlockedAt,
}: AchievementRowProps) {
  return (
    <Card className="achievement-row">
      <div className="achievement-row__icon">
        <Icon name="leaderboard" size={22} />
      </div>
      <div className="achievement-row__body">
        <div className="achievement-row__header">
          <h3 className="achievement-row__name">{name}</h3>
          <span className="achievement-row__points">+{pointsAwarded} pts</span>
        </div>
        {description ? <p className="achievement-row__description">{description}</p> : null}
        <p className="achievement-row__meta">
          Unlocked{' '}
          {new Date(unlockedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
    </Card>
  );
}

export default AchievementRow;
