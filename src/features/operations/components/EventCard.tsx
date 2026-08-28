import '../styles/operations.css';
import { Button, Card } from '@/shared/components';
import type { EventDto } from '../types';

// SCR-F8-04: event listing card — type chip, local-time date, capacity bar
// and Register/Waitlisted/Registered button states. The register action is
// authenticated; anonymous visitors see a sign-in hint instead.

interface EventCardProps {
  event: EventDto;
  onRegister: (eventId: number) => void;
  onCancel: (eventId: number) => void;
  isPending: boolean;
}

const TYPE_LABEL: Record<EventDto['eventType'], string> = {
  webinar: 'Webinar',
  workshop: 'Workshop',
  competition: 'Competition',
  conference: 'Conference',
  meetup: 'Meetup',
};

function formatStart(startTime: string, timezone: string | null): string {
  const date = new Date(startTime);
  return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}${timezone ? ` ${timezone}` : ''}`;
}

/** Deadline check lives in a module-level helper so render stays pure. */
function isDeadlinePassed(deadline: string | null): boolean {
  return deadline !== null && new Date(deadline).getTime() < Date.now();
}

export function EventCard({ event, onRegister, onCancel, isPending }: EventCardProps) {
  const isWaitlisted = event.registrationStatus === 'waitlisted';
  const isRegistered = event.registrationStatus === 'registered';
  const deadlinePassed = isDeadlinePassed(event.registrationDeadline);

  return (
    <Card className="event-card">
      {event.bannerUrl ? (
        <img src={event.bannerUrl} alt="" className="event-card__banner" loading="lazy" />
      ) : null}
      <div className="event-card__body">
        <div className="event-card__head">
          <span className="event-card__type">{TYPE_LABEL[event.eventType]}</span>
          <span className="event-card__price">{event.isFree ? 'Free' : `$${event.price}`}</span>
        </div>
        <h3 className="event-card__title">{event.title}</h3>
        {event.description ? <p className="event-card__description">{event.description}</p> : null}
        <p className="event-card__meta">
          {formatStart(event.startTime, event.timezone)}
          {event.location ? ` · ${event.location}` : ''}
        </p>
        <div className="event-card__capacity">
          <div className="event-card__capacity-track">
            <div
              className="event-card__capacity-fill"
              data-full={event.isFull}
              style={{ width: `${event.maxAttendees > 0 ? 100 : 0}%` }}
            />
          </div>
          <span className="event-card__capacity-label">
            {event.isFull ? 'Full' : 'Spots available'}
          </span>
        </div>
        <div className="event-card__actions">
          {isRegistered ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onCancel(event.eventId)}
              disabled={isPending}
            >
              {isWaitlisted ? 'Waitlisted — cancel' : 'Registered ✓ — cancel'}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onRegister(event.eventId)}
              disabled={isPending || event.isFull || deadlinePassed}
              isLoading={isPending}
            >
              {event.isFull
                ? 'Full'
                : deadlinePassed
                  ? 'Registration closed'
                  : isWaitlisted
                    ? 'Join waitlist'
                    : 'Register'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default EventCard;
