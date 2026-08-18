import { apiClient } from '@/shared/services';
import type {
  AnnouncementDto,
  CreateAnnouncementPayload,
  NotificationPreferenceDto,
  PaginatedNotifications,
  UpdateAnnouncementPayload,
  UpdateNotificationPreferencesPayload,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F8 §07 learner + admin notification endpoints (OPS-01..08, OPS-21..23). */
export const notificationService = {
  /** OPS-01: own notification inbox, paginated. */
  async getInbox(page = 1, limit = 20, unreadOnly = false): Promise<PaginatedNotifications> {
    const { data } = await apiClient.get<{ data: PaginatedNotifications }>('/notifications', {
      params: { page, limit, unreadOnly },
    });
    return unwrap(data);
  },

  /** OPS-02: mark one notification read (own only). */
  async markRead(notificationId: number): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  /** OPS-03: mark all own notifications read. */
  async markAllRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },

  /** OPS-04: dismiss one notification (own only). */
  async dismiss(notificationId: number): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  /** OPS-05: own channel preferences. */
  async getPreferences(): Promise<NotificationPreferenceDto[]> {
    const { data } = await apiClient.get<{ data: NotificationPreferenceDto[] }>(
      '/notifications/preferences',
    );
    return unwrap(data);
  },

  /** OPS-06: upsert one channel preference. */
  async updatePreference(payload: UpdateNotificationPreferencesPayload): Promise<void> {
    await apiClient.put('/notifications/preferences', payload);
  },

  /** OPS-07: public published announcement list. */
  async listAnnouncements(): Promise<AnnouncementDto[]> {
    const { data } = await apiClient.get<{ data: AnnouncementDto[] }>('/announcements');
    return unwrap(data);
  },

  /** OPS-08: mark an announcement read (session user). */
  async markAnnouncementRead(announcementId: number): Promise<void> {
    await apiClient.post(`/announcements/${announcementId}/read`);
  },
};

/** F8 §07 admin announcement endpoints (OPS-21..23). */
export const adminNotificationService = {
  /** OPS-21: create an announcement (draft). */
  async createAnnouncement(payload: CreateAnnouncementPayload): Promise<AnnouncementDto> {
    const { data } = await apiClient.post<{ data: AnnouncementDto }>(
      '/admin/announcements',
      payload,
    );
    return unwrap(data);
  },

  /** OPS-22: update an announcement. */
  async updateAnnouncement(
    announcementId: number,
    payload: UpdateAnnouncementPayload,
  ): Promise<AnnouncementDto> {
    const { data } = await apiClient.patch<{ data: AnnouncementDto }>(
      `/admin/announcements/${announcementId}`,
      payload,
    );
    return unwrap(data);
  },

  /** OPS-23: publish an announcement. */
  async publishAnnouncement(announcementId: number): Promise<AnnouncementDto> {
    const { data } = await apiClient.patch<{ data: AnnouncementDto }>(
      `/admin/announcements/${announcementId}/publish`,
    );
    return unwrap(data);
  },
};

export default notificationService;
