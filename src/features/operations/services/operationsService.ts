import { apiClient } from '@/shared/services';
import type { EventListDto, FileDownloadDto } from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F8 §07 learner + public operations endpoints (OPS-09..12, OPS-20). */
export const operationsService = {
  /** OPS-09: public active event list. */
  async listEvents(page = 1, limit = 12, upcomingOnly = true): Promise<EventListDto> {
    const { data } = await apiClient.get<{ data: EventListDto }>('/events', {
      params: { page, limit, upcomingOnly },
    });
    return unwrap(data);
  },

  /** OPS-11: register (or waitlist) for an event. */
  async register(eventId: number): Promise<{ status: 'registered' | 'waitlisted' }> {
    const { data } = await apiClient.post<{ data: { status: 'registered' | 'waitlisted' } }>(
      `/events/${eventId}/register`,
    );
    return unwrap(data);
  },

  /** OPS-12: cancel an event registration. */
  async cancelRegistration(eventId: number): Promise<void> {
    await apiClient.delete(`/events/${eventId}/register`);
  },

  /** OPS-20: signed download URL for a file (entitlement-checked server-side). */
  async getDownloadUrl(fileId: number): Promise<FileDownloadDto> {
    const { data } = await apiClient.get<{ data: FileDownloadDto }>(`/files/${fileId}/download`);
    return unwrap(data);
  },
};

export default operationsService;
