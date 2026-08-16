import { Card, Icon } from '@/shared/components';
import type { BadgeType } from '../types';

// SCR-F7-01 badge tile. Earned badges get a tier ring (badge_type → token
// intensity, single accent hue per guidelines); locked badges render greyed
// with no ring. iconUrl is preferred, the app award glyph is the fallback.

interface BadgeCardProps {
  badgeName: string;
  badgeType: BadgeType;
  iconUrl: string | null;
  awardedAt: string | null;
  description?: string | null;
}

export function BadgeCard({
  badgeName,
  badgeType,
  iconUrl,
  awardedAt,
  description,
}: BadgeCardProps) {
  const earned = awardedAt !== null;
  const tierClass = earned ? `badge-card--${badgeType}` : 'badge-card--locked';

  return (
    <Card className={`badge-card ${tierClass}`}>
      <div className="badge-card__icon">
        {iconUrl ? (
          <img src={iconUrl} alt="" className="badge-card__img" loading="lazy" />
        ) : (
          <Icon name="award" size={26} />
        )}
      </div>
      <h3 className="badge-card__name">{badgeName}</h3>
      {description ? <p className="badge-card__description">{description}</p> : null}
      <p className="badge-card__meta">
        {earned
          ? `Earned ${new Date(awardedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}`
          : 'Not yet earned'}
      </p>
    </Card>
  );
}

export default BadgeCard;
