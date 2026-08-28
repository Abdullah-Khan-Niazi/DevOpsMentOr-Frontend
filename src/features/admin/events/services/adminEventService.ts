import { apiClient } from '@/shared/services';
import type {
  AdminEventDto,
  CreateEventPayload,
  EventAttendeeListDto,
  UpdateEventPayload,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F8 §07 admin event endpoints (OPS-24..26, SCR-F8-10). */
export const adminEventService = {
  /** OPS-24: create an event. */
  async createEvent(payload: CreateEventPayload): Promise<AdminEventDto> {
    const { data } = await apiClient.post<{ data: AdminEventDto }>('/admin/events', payload);
    return unwrap(data);
  },

  /** OPS-25: update an event. */
  async updateEvent(eventId: number, payload: UpdateEventPayload): Promise<AdminEventDto> {
    const { data } = await apiClient.patch<{ data: AdminEventDto }>(
      `/admin/events/${eventId}`,
      payload,
    );
    return unwrap(data);
  },

  /** OPS-26: paginated attendee list for one event. */
  async listAttendees(
    eventId: number,
    page = 1,
    limit = 25,
    status?: EventAttendeeListDto['data'][number]['status'],
  ): Promise<EventAttendeeListDto> {
    const { data } = await apiClient.get<{ data: EventAttendeeListDto }>(
      `/admin/events/${eventId}/attendees`,
      { params: { page, limit, ...(status ? { status } : {}) } },
    );
    return unwrap(data);
  },
};

export default adminEventService;
