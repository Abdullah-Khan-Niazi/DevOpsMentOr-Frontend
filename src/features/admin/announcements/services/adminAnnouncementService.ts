import { apiClient } from '@/shared/services';
import type {
  AdminAnnouncementDto,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F8 §07 admin announcement endpoints (OPS-21..23, SCR-F8-09). */
export const adminAnnouncementService = {
  /** Admin list: drafts + published + expired announcements. */
  async listAnnouncements(): Promise<AdminAnnouncementDto[]> {
    const { data } = await apiClient.get<{ data: AdminAnnouncementDto[] }>('/admin/announcements');
    return unwrap(data);
  },

  /** OPS-21: create an announcement (draft). */
  async createAnnouncement(payload: CreateAnnouncementPayload): Promise<AdminAnnouncementDto> {
    const { data } = await apiClient.post<{ data: AdminAnnouncementDto }>(
      '/admin/announcements',
      payload,
    );
    return unwrap(data);
  },

  /** OPS-22: update an announcement. */
  async updateAnnouncement(
    announcementId: number,
    payload: UpdateAnnouncementPayload,
  ): Promise<AdminAnnouncementDto> {
    const { data } = await apiClient.patch<{ data: AdminAnnouncementDto }>(
      `/admin/announcements/${announcementId}`,
      payload,
    );
    return unwrap(data);
  },

  /** OPS-23: publish an announcement. */
  async publishAnnouncement(announcementId: number): Promise<AdminAnnouncementDto> {
    const { data } = await apiClient.patch<{ data: AdminAnnouncementDto }>(
      `/admin/announcements/${announcementId}/publish`,
    );
    return unwrap(data);
  },
};

export default adminAnnouncementService;
