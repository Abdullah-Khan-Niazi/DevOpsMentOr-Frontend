import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/shared/components/Icon';
import { ROUTES } from '@/shared/constants';
import { notificationService } from '../services';
import type { AnnouncementDto } from '../types';

const DISMISSED_STORAGE_KEY = 'stardust_dismissed_announcements';

function getStoredDismissedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function persistDismissedId(id: number) {
  try {
    const stored = getStoredDismissedIds();
    stored.add(id);
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...stored]));
  } catch {
    // localStorage unavailable or full
  }
}

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
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(getStoredDismissedIds);

  const visible = announcements
    .filter((announcement) => !dismissedIds.has(announcement.announcementId))
    .sort((a, b) => PRIORITY_LEVEL[b.priority] - PRIORITY_LEVEL[a.priority]);
  const active = visible[0];

  if (!active) {
    return null;
  }

  const handleDismiss = (announcementId: number) => {
    persistDismissedId(announcementId);
    setDismissedIds((prev) => new Set(prev).add(announcementId));
    // Persist to backend so it stays marked read across sessions/devices
    notificationService.markAnnouncementRead(announcementId).catch(() => {});
  };

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
        onClick={() => handleDismiss(active.announcementId)}
      >
        <Icon name="x-circle" size={16} />
      </button>
    </div>
  );
}

export default AnnouncementBanner;
