import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/shared/components/Icon';
import { ROUTES } from '@/shared/constants';
import type { AnnouncementDto } from '../types';

// SCR-F8-03: dismissible banner for the newest published announcement.
// Priority drives the accent (`--color-warning` for high, `--color-error`
// for critical); dismissal is stored in session state only (no backend
// banner-state endpoint exists in F8).

interface AnnouncementBannerProps {
  announcements: AnnouncementDto[];
}

const PRIORITY_LEVEL: Record<AnnouncementDto['priority'], number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(() => new Set());

  const visible = announcements
    .filter((announcement) => !dismissedIds.has(announcement.announcementId))
    .sort((a, b) => PRIORITY_LEVEL[b.priority] - PRIORITY_LEVEL[a.priority]);
  const active = visible[0];

  if (!active) {
    return null;
  }

  return (
    <div
      className="announcement-banner"
      data-priority={active.priority}
      role="region"
      aria-label="Announcement"
    >
      <Icon name="megaphone" className="announcement-banner__icon" />
      <p className="announcement-banner__text">
        <strong>{active.title}</strong>
        <span className="announcement-banner__content">{active.content}</span>
      </p>
      <Link to={ROUTES.ANNOUNCEMENTS} className="announcement-banner__link">
        View all
      </Link>
      <button
        type="button"
        className="announcement-banner__dismiss"
        aria-label="Dismiss announcement"
        onClick={() => setDismissedIds((current) => new Set(current).add(active.announcementId))}
      >
        <Icon name="x-circle" size={16} />
      </button>
    </div>
  );
}

export default AnnouncementBanner;
