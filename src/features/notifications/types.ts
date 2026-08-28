/** F8 §05 domain contracts (SCR-F8-01..03, OPS-01..08, OPS-21..23). */

export type NotificationType =
  | 'system'
  | 'achievement'
  | 'badge'
  | 'mention'
  | 'comment'
  | 'like'
  | 'follow'
  | 'team_invite'
  | 'ctf'
  | 'event'
  | 'security';

export interface NotificationDto {
  notificationId: number;
  type: NotificationType;
  title: string;
  message: string | null;
  linkUrl: string | null;
  iconUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  data: NotificationDto[];
  unreadCount: number;
  total: number;
  page: number;
}

export interface NotificationPreferenceDto {
  userId: number;
  type: NotificationType;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
}

export interface UpdateNotificationPreferencesPayload {
  type: NotificationType;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
}

export type AnnouncementType = 'general' | 'maintenance' | 'feature' | 'security' | 'event';
export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'critical';

/** OPS-07: published announcement row (public list surface). */
export interface AnnouncementDto {
  announcementId: number;
  title: string;
  content: string;
  announcementType: AnnouncementType;
  priority: AnnouncementPriority;
  publishedAt: string | null;
  expiresAt: string | null;
  isRead: boolean;
  createdAt: string;
}

/** OPS-21: admin create payload (createdBy is session-derived server-side). */
export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  announcementType: AnnouncementType;
  priority?: AnnouncementPriority;
  expiresAt?: string | null;
}

/** OPS-22: admin update payload. */
export interface UpdateAnnouncementPayload {
  title?: string;
  content?: string;
  announcementType?: AnnouncementType;
  priority?: AnnouncementPriority;
  expiresAt?: string | null;
}
