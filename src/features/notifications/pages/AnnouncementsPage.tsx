import '../styles/notifications.css';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { usePublishedAnnouncements } from '../hooks/useNotifications';
import type { AnnouncementPriority } from '../types';

// SCR-F8-03: public announcement archive. Priority drives the accent
// border (`--color-warning` for high, `--color-error` for critical).

const PRIORITY_LABEL: Record<AnnouncementPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export function AnnouncementsPage() {
  const { data, isLoading, isError } = usePublishedAnnouncements();

  return (
    <div className="announcements-page">
      <PageHeader
        title="Announcements"
        description="Platform updates, maintenance windows and security notices."
      />

      {isError ? (
        <ErrorState title="Could not load announcements" message="Please try again later." />
      ) : isLoading ? (
        <LoadingState />
      ) : data && data.length > 0 ? (
        <div className="announcements-page__list">
          {data.map((announcement) => (
            <Card
              key={announcement.announcementId}
              className="announcements-page__card"
              data-priority={announcement.priority}
            >
              <div className="announcements-page__card-head">
                <h2 className="announcements-page__title">{announcement.title}</h2>
                <span
                  className="announcements-page__priority"
                  data-priority={announcement.priority}
                >
                  {PRIORITY_LABEL[announcement.priority]}
                </span>
              </div>
              <p className="announcements-page__content">{announcement.content}</p>
              <p className="announcements-page__meta">
                {announcement.publishedAt
                  ? new Date(announcement.publishedAt).toLocaleDateString()
                  : null}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No announcements yet." />
      )}
    </div>
  );
}

export default AnnouncementsPage;
