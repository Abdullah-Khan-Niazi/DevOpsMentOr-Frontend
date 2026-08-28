import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/shared/components/Icon';
import { relativeTime } from '../utils';
import type { NotificationDto, NotificationType } from '../types';

// SCR-F8-01: one inbox row — type icon (color-coded by type), title,
// truncated message, relative timestamp, unread dot, dismiss ×.

interface NotificationItemProps {
  notification: NotificationDto;
  onRead: (notificationId: number) => void;
  onDismiss: (notificationId: number) => void;
}

const TYPE_ICON: Record<NotificationType, ReactNode> = {
  system: <Icon name="settings" size={18} />,
  achievement: <Icon name="award" size={18} />,
  badge: <Icon name="award" size={18} />,
  mention: <Icon name="users" size={18} />,
  comment: <Icon name="roles" size={18} />,
  like: <Icon name="award" size={18} />,
  follow: <Icon name="users" size={18} />,
  team_invite: <Icon name="organization" size={18} />,
  ctf: <Icon name="flag" size={18} />,
  event: <Icon name="calendar" size={18} />,
  security: <Icon name="audit-logs" size={18} />,
};

export function NotificationItem({ notification, onRead, onDismiss }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.notificationId);
    }
  };

  const body = (
    <>
      <span className="notification-item__icon" data-type={notification.type} aria-hidden="true">
        {TYPE_ICON[notification.type] ?? <Icon name="bell" size={18} />}
      </span>
      <span className="notification-item__body">
        <span className="notification-item__title-row">
          <span className="notification-item__title">{notification.title}</span>
          {!notification.isRead ? (
            <span className="notification-item__unread" aria-label="Unread" />
          ) : null}
        </span>
        {notification.message ? (
          <span className="notification-item__message">{notification.message}</span>
        ) : null}
        <span className="notification-item__time">{relativeTime(notification.createdAt)}</span>
      </span>
      <button
        type="button"
        className="notification-item__dismiss"
        aria-label="Dismiss notification"
        onClick={(event) => {
          event.preventDefault();
          onDismiss(notification.notificationId);
        }}
      >
        <Icon name="x-circle" size={16} />
      </button>
    </>
  );

  const className = `notification-item${notification.isRead ? '' : ' notification-item--unread'}`;

  if (notification.linkUrl) {
    return (
      <Link to={notification.linkUrl} className={className} onClick={handleClick}>
        {body}
      </Link>
    );
  }
  return (
    <div className={className} onClick={handleClick}>
      {body}
    </div>
  );
}

export default NotificationItem;
