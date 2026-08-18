/** F8 §05 platform operations contracts (SCR-F8-04, SCR-F8-08, OPS-09..26). */

export type EventType = 'webinar' | 'workshop' | 'competition' | 'conference' | 'meetup';
export type EventRegistrationStatus = 'registered' | 'waitlisted' | 'cancelled' | null;

export interface EventDto {
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
  isFull: boolean;
  isRegistered: boolean;
  registrationStatus: EventRegistrationStatus;
}

export interface EventListDto {
  data: EventDto[];
  total: number;
  page: number;
}

export interface FileDownloadDto {
  fileId: number;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  downloadUrl: string;
  expiresInSeconds: number;
}

/** SCR-F8-04 filter bar state. */
export interface EventFilters {
  eventType: EventType | 'all';
  upcomingOnly: boolean;
}
