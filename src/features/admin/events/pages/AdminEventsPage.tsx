import '../styles/events-admin.css';
import { useState } from 'react';
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  toast,
} from '@/shared/components';
import { useAdminEventAttendees, useAdminEvents } from '../hooks/useAdminEvents';
import type { EventType } from '../types';

// SCR-F8-10: admin events — create form plus attendee roster lookup.
// Backend F8 exposes OPS-24..26 only (create/update/attendees); there is
// intentionally no admin list endpoint in the F8 contract, so the page is
// form-first and attendees are looked up by event id.

const EVENT_TYPES: EventType[] = ['webinar', 'workshop', 'competition', 'conference', 'meetup'];

const TYPE_LABEL: Record<EventType, string> = {
  webinar: 'Webinar',
  workshop: 'Workshop',
  competition: 'Competition',
  conference: 'Conference',
  meetup: 'Meetup',
};

const STATUS_LABEL: Record<string, string> = {
  registered: 'Registered',
  attended: 'Attended',
  cancelled: 'Cancelled',
  waitlisted: 'Waitlisted',
};

interface EventDraft {
  title: string;
  description: string;
  location: string;
  eventType: EventType;
  startTime: string;
  endTime: string;
  timezone: string;
  maxAttendees: string;
  isFree: boolean;
  price: string;
  registrationDeadline: string;
}

const EMPTY_DRAFT: EventDraft = {
  title: '',
  description: '',
  location: '',
  eventType: 'webinar',
  startTime: '',
  endTime: '',
  timezone: '',
  maxAttendees: '100',
  isFree: true,
  price: '0',
  registrationDeadline: '',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function AdminEventsPage() {
  const { create } = useAdminEvents();
  const [draft, setDraft] = useState<EventDraft>(EMPTY_DRAFT);
  const [attendeeLookup, setAttendeeLookup] = useState('');
  const [attendeeId, setAttendeeId] = useState<number | null>(null);
  const attendees = useAdminEventAttendees(attendeeId ?? 0, 1);

  const setField = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleLookup = () => {
    const eventId = Number(attendeeLookup);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      toast.error('Enter a valid event ID.');
      return;
    }
    setAttendeeId(eventId);
  };

  const handleSubmit = () => {
    if (draft.title.trim().length < 3) {
      toast.error('Title must be at least 3 characters.');
      return;
    }
    if (!draft.startTime) {
      toast.error('Start time is required.');
      return;
    }
    if (draft.endTime && new Date(draft.endTime) <= new Date(draft.startTime)) {
      toast.error('End time must be after the start time.');
      return;
    }
    create.mutate(
      {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        location: draft.location.trim() || null,
        eventType: draft.eventType,
        startTime: new Date(draft.startTime).toISOString(),
        endTime: draft.endTime ? new Date(draft.endTime).toISOString() : null,
        timezone: draft.timezone.trim() || null,
        maxAttendees: Number(draft.maxAttendees) || 0,
        isFree: draft.isFree,
        price: Number(draft.price) || 0,
        registrationDeadline: draft.registrationDeadline
          ? new Date(draft.registrationDeadline).toISOString()
          : null,
      },
      {
        onSuccess: () => {
          toast.success('Event created.');
          setDraft(EMPTY_DRAFT);
        },
        onError: () => toast.error('Could not create the event.'),
      },
    );
  };

  return (
    <div className="events-admin-page">
      <PageHeader
        title="Events"
        description="Create webinars, workshops and competitions; view attendee rosters."
      />

      <Card className="events-admin-page__form">
        <h2 className="events-admin-page__form-title">New event</h2>
        <Input
          label="Title"
          value={draft.title}
          onChange={(event) => setField('title', event.target.value)}
          maxLength={160}
        />
        <label className="events-admin-page__field">
          <span className="events-admin-page__label">Description</span>
          <textarea
            className="events-admin-page__textarea"
            rows={3}
            value={draft.description}
            onChange={(event) => setField('description', event.target.value)}
          />
        </label>
        <div className="events-admin-page__grid">
          <Input
            label="Location"
            value={draft.location}
            onChange={(event) => setField('location', event.target.value)}
          />
          <label className="events-admin-page__field">
            <span className="events-admin-page__label">Type</span>
            <select
              className="events-admin-page__select"
              value={draft.eventType}
              onChange={(event) => setField('eventType', event.target.value as EventType)}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="events-admin-page__grid">
          <label className="events-admin-page__field">
            <span className="events-admin-page__label">Start time</span>
            <input
              type="datetime-local"
              className="events-admin-page__select"
              value={draft.startTime}
              onChange={(event) => setField('startTime', event.target.value)}
            />
          </label>
          <label className="events-admin-page__field">
            <span className="events-admin-page__label">End time</span>
            <input
              type="datetime-local"
              className="events-admin-page__select"
              value={draft.endTime}
              onChange={(event) => setField('endTime', event.target.value)}
            />
          </label>
          <Input
            label="Timezone"
            placeholder="UTC"
            value={draft.timezone}
            onChange={(event) => setField('timezone', event.target.value)}
          />
        </div>
        <div className="events-admin-page__grid">
          <Input
            label="Max attendees"
            type="number"
            min={0}
            value={draft.maxAttendees}
            onChange={(event) => setField('maxAttendees', event.target.value)}
          />
          <label className="events-admin-page__field">
            <span className="events-admin-page__label">Registration deadline</span>
            <input
              type="datetime-local"
              className="events-admin-page__select"
              value={draft.registrationDeadline}
              onChange={(event) => setField('registrationDeadline', event.target.value)}
            />
          </label>
        </div>
        <div className="events-admin-page__grid">
          <label className="events-admin-page__check">
            <input
              type="checkbox"
              checked={draft.isFree}
              onChange={(event) => setField('isFree', event.target.checked)}
            />
            <span>Free event</span>
          </label>
          {!draft.isFree ? (
            <Input
              label="Price (USD)"
              type="number"
              min={0}
              step="0.01"
              value={draft.price}
              onChange={(event) => setField('price', event.target.value)}
            />
          ) : null}
        </div>
        <div className="events-admin-page__form-actions">
          <Button onClick={handleSubmit} isLoading={create.isPending}>
            Create event
          </Button>
        </div>
      </Card>

      <Card className="events-admin-page__attendees">
        <h2 className="events-admin-page__form-title">Attendees</h2>
        <div className="events-admin-page__attendees-lookup">
          <Input
            label="Event ID"
            type="number"
            min={1}
            value={attendeeLookup}
            onChange={(event) => setAttendeeLookup(event.target.value)}
          />
          <Button variant="secondary" onClick={handleLookup}>
            Load roster
          </Button>
        </div>
        {attendeeId !== null ? (
          attendees.isError ? (
            <ErrorState title="Could not load attendees" message="Please try again later." />
          ) : attendees.isLoading ? (
            <LoadingState />
          ) : attendees.data && attendees.data.data.length > 0 ? (
            <table className="events-admin-page__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Registered at</th>
                </tr>
              </thead>
              <tbody>
                {attendees.data.data.map((attendee) => (
                  <tr key={attendee.registrationId}>
                    <td>
                      {attendee.fullName ?? attendee.attendeeName ?? `User ${attendee.userId}`}
                    </td>
                    <td>{attendee.attendeeEmail ?? attendee.email}</td>
                    <td>{STATUS_LABEL[attendee.status]}</td>
                    <td>{formatDate(attendee.registeredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="events-admin-page__empty">No attendees for this event yet.</p>
          )
        ) : null}
      </Card>
    </div>
  );
}

export default AdminEventsPage;
