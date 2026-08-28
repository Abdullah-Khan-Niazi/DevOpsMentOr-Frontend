import { Link } from 'react-router-dom';
import { Icon } from '@/shared/components/Icon';
import { ROUTES } from '@/shared/constants';
import { useUnreadCount } from '../hooks/useNotifications';

// SCR-F8-01: sidebar bell with unread-count badge. Polls the inbox
// (unreadOnly, limit 1) every 60s while the tab is visible, then navigates
// to the full inbox on click.

export function NotificationBell() {
  const { data: unreadCount, isLoading } = useUnreadCount();
  const count = unreadCount ?? 0;

  return (
    <Link
      to={ROUTES.NOTIFICATIONS}
      className="notification-bell"
      aria-label={`Notifications${count ? ` (${count} unread)` : ''}`}
    >
      <Icon name="bell" className="notification-bell__icon" />
      {!isLoading && count > 0 ? (
        <span className="notification-bell__badge">{count > 99 ? '99+' : count}</span>
      ) : null}
    </Link>
  );
}

export default NotificationBell;
