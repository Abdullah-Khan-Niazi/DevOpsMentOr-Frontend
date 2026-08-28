/** F8 §05 admin event contracts (OPS-24..26, SCR-F8-10). */

export type EventType = 'webinar' | 'workshop' | 'competition' | 'conference' | 'meetup';
export type AttendeeStatus = 'registered' | 'attended' | 'cancelled' | 'waitlisted';

export interface AdminEventDto {
  eventId: number;
  title: string;
  description: string | null;
  location: string | null;
  eventType: EventType;
  startTime: string;
  endTime: string | null;
  timezone: string | null;
  maxAttendees: number;
  isFree: boolean;
  price: string;
  registrationDeadline: string | null;
  bannerUrl: string | null;
  isActive: boolean;
  registeredCount: number;
  waitlistedCount: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventAttendeeDto {
  registrationId: number;
  userId: number;
  fullName: string | null;
  email: string;
  status: AttendeeStatus;
  attendeeName: string | null;
  attendeeEmail: string | null;
  company: string | null;
  registeredAt: string;
}

export interface EventAttendeeListDto {
  data: EventAttendeeDto[];
  total: number;
  page: number;
}

export interface CreateEventPayload {
  title: string;
  description?: string | null;
  location?: string | null;
  eventType: EventType;
  startTime: string;
  endTime?: string | null;
  timezone?: string | null;
  maxAttendees?: number;
  isFree?: boolean;
  price?: number;
  registrationDeadline?: string | null;
  bannerUrl?: string | null;
}

/** OPS-25: partial event update payload. */
export type UpdateEventPayload = Partial<CreateEventPayload>;
