import '../styles/operations.css';
import { useState } from 'react';
import { EmptyState, ErrorState, PageHeader, Pagination, toast } from '@/shared/components';
import { useAuthStore } from '@/features/auth';
import { EventCard } from '../components/EventCard';
import { useCancelRegistration, useEvents, useRegisterEvent } from '../hooks/useOperations';
import type { EventType } from '../types';

// SCR-F8-04: public events page — filter bar (type + upcoming toggle) over a
// responsive card grid. Registration requires a session; waitlist toasts
// surface when capacity is reached server-side.

const PAGE_SIZE = 12;

const TYPE_OPTIONS: Array<{ value: EventType | 'all'; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'competition', label: 'Competition' },
  { value: 'conference', label: 'Conference' },
  { value: 'meetup', label: 'Meetup' },
];

export function EventsPage() {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState<EventType | 'all'>('all');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const { data, isLoading, isError } = useEvents(page, upcomingOnly);
  const register = useRegisterEvent();
  const cancel = useCancelRegistration();

  const handleRegister = (eventId: number) => {
    if (!user) {
      toast.error('Sign in to register for events.');
      return;
    }
    register.mutate(eventId, {
      onSuccess: (result) => {
        if (result.status === 'waitlisted') {
          toast.success('Event is full — you have been waitlisted.');
        } else {
          toast.success('Registered for the event.');
        }
      },
      onError: () => toast.error('Could not register for the event.'),
    });
  };

  const handleCancel = (eventId: number) => {
    cancel.mutate(eventId, {
      onSuccess: () => toast.success('Registration cancelled.'),
      onError: () => toast.error('Could not cancel the registration.'),
    });
  };

  const filtered = data?.data.filter(
    (event) => eventType === 'all' || event.eventType === eventType,
  );

  return (
    <div className="events-page">
      <PageHeader
        title="Events"
        description="Webinars, workshops and competitions — register before the deadline."
      />

      <div className="events-page__filters">
        <label className="events-page__filter-label">
          <span className="events-page__filter-text">Type</span>
          <select
            className="events-page__select"
            value={eventType}
            onChange={(event) => setEventType(event.target.value as EventType | 'all')}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="events-page__filter-label events-page__filter-label--inline">
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={(event) => {
              setUpcomingOnly(event.target.checked);
              setPage(1);
            }}
          />
          <span className="events-page__filter-text">Upcoming only</span>
        </label>
      </div>

      {isError ? (
        <ErrorState title="Could not load events" message="Please try again later." />
      ) : isLoading ? (
        <div className="events-page__grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="event-card event-card--skeleton" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <>
          <div className="events-page__grid">
            {filtered.map((event) => (
              <EventCard
                key={event.eventId}
                event={event}
                onRegister={handleRegister}
                onCancel={handleCancel}
                isPending={register.isPending || cancel.isPending}
              />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data?.total ?? 0}
            totalPages={Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="No upcoming events."
          description="New webinars, workshops and competitions are scheduled regularly."
        />
      )}
    </div>
  );
}

export default EventsPage;
