import '../styles/notifications.css';
import { useState } from 'react';
import { Button, EmptyState, ErrorState, PageHeader, Pagination, toast } from '@/shared/components';
import { NotificationItem } from '../components/NotificationItem';
import {
  useDismissNotification,
  useInbox,
  useMarkAllRead,
  useMarkRead,
} from '../hooks/useNotifications';

// SCR-F8-01: notification inbox — paginated list with per-row read/dismiss
// and a "Mark all read" header action. Every row action is session-scoped
// server-side (AC-14 IDOR mitigation).

const INBOX_PAGE_SIZE = 20;

export function NotificationInboxPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useInbox(page);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const dismiss = useDismissNotification();

  const handleMarkRead = (notificationId: number) => {
    markRead.mutate(notificationId, {
      onError: () => toast.error('Could not mark notification as read.'),
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onError: () => toast.error('Could not mark notifications as read.'),
      onSuccess: () => toast.success('All notifications marked as read.'),
    });
  };

  const handleDismiss = (notificationId: number) => {
    dismiss.mutate(notificationId, {
      onError: () => toast.error('Could not dismiss notification.'),
    });
  };

  return (
    <div className="notifications-page">
      <PageHeader
        title="Notifications"
        description="Updates on your achievements, events, labs and security."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isLoading || (data?.unreadCount ?? 0) === 0}
          >
            Mark all read
          </Button>
        }
      />

      {isError ? (
        <ErrorState
          title="Could not load notifications"
          message={error?.message ?? 'Please try again later.'}
        />
      ) : isLoading ? (
        <div className="notifications-page__skeleton" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="notification-item notification-item--skeleton" />
          ))}
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          <ul className="notifications-page__list">
            {data.data.map((notification) => (
              <li key={notification.notificationId}>
                <NotificationItem
                  notification={notification}
                  onRead={handleMarkRead}
                  onDismiss={handleDismiss}
                />
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            pageSize={INBOX_PAGE_SIZE}
            total={data.total}
            totalPages={Math.max(1, Math.ceil(data.total / INBOX_PAGE_SIZE))}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="You're all caught up."
          description="New notifications about events, achievements and platform updates will appear here."
        />
      )}
    </div>
  );
}

export default NotificationInboxPage;
