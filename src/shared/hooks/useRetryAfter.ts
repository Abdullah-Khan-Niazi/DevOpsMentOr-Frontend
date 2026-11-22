import { useEffect, useState } from 'react';
import { getRetryAfterSeconds } from '@/shared/services/apiError';
import { serverClock } from '@/shared/services/serverClock';

/**
 * Countdown for a rate-limited (429) error: `blocked` stays true and
 * `secondsLeft` counts down until the server's retry window has passed.
 */
export function useRetryAfter(error: unknown): { secondsLeft: number; blocked: boolean } {
  const retryAfter = getRetryAfterSeconds(error);
  const [until, setUntil] = useState<number | null>(null);
  const [trackedError, setTrackedError] = useState<unknown>(null);
  const [now, setNow] = useState(() => serverClock.now());

  // A new error starts a new window (computed once, when the error arrives).
  if (error !== trackedError) {
    setTrackedError(error);
    const start = serverClock.now();
    setNow(start);
    setUntil(retryAfter && retryAfter > 0 ? start + retryAfter * 1000 : null);
  }

  useEffect(() => {
    if (until === null) return;
    const id = window.setInterval(() => {
      const current = serverClock.now();
      setNow(current);
      if (current >= until) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [until]);

  const secondsLeft = until === null ? 0 : Math.max(0, Math.ceil((until - now) / 1000));
  return { secondsLeft, blocked: secondsLeft > 0 };
}
