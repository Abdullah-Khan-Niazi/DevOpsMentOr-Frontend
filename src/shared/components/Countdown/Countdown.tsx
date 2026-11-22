import { useEffect, useRef, useState } from 'react';
import { serverClock } from '@/shared/services/serverClock';
import { cn, formatClock } from '@/shared/utils';

export interface CountdownProps {
  /** Deadline from the server (ISO string or epoch ms). */
  until: string | number;
  onElapsed?: () => void;
  /** `mm:ss` (hours roll into `h:mm:ss`) or `auto` (adds days when longer than 24 h). */
  format?: 'mm:ss' | 'auto';
  /** Seconds left below which the countdown renders in the warning style. */
  warnBelowSeconds?: number;
  className?: string;
  /** Accessible prefix, for example "Time left". */
  label?: string;
}

function deadlineMs(until: string | number): number | null {
  const ms = typeof until === 'number' ? until : Date.parse(until);
  return Number.isFinite(ms) ? ms : null;
}

function secondsLeft(deadline: number | null): number {
  if (deadline === null) return 0;
  return Math.max(0, Math.ceil((deadline - serverClock.now()) / 1000));
}

function render(seconds: number, format: 'mm:ss' | 'auto'): string {
  if (format === 'auto' && seconds >= 86_400) {
    const days = Math.floor(seconds / 86_400);
    return `${days} d ${formatClock(seconds % 86_400)}`;
  }
  return formatClock(seconds);
}

/**
 * Countdown to a server deadline using the server clock offset (client clocks
 * drift). One interval per instance; `onElapsed` fires once when it reaches zero.
 */
export function Countdown({
  until,
  onElapsed,
  format = 'mm:ss',
  warnBelowSeconds,
  className,
  label,
}: CountdownProps) {
  const deadline = deadlineMs(until);
  const [left, setLeft] = useState(() => secondsLeft(deadline));
  const onElapsedRef = useRef(onElapsed);
  const firedForRef = useRef<number | null>(null);

  useEffect(() => {
    onElapsedRef.current = onElapsed;
  });

  useEffect(() => {
    function tick() {
      const next = secondsLeft(deadline);
      setLeft(next);
      if (next === 0 && deadline !== null && firedForRef.current !== deadline) {
        firedForRef.current = deadline;
        onElapsedRef.current?.();
      }
      return next;
    }
    if (tick() === 0) return;
    const id = window.setInterval(() => {
      if (tick() === 0) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [deadline]);

  const warn = warnBelowSeconds !== undefined && left > 0 && left < warnBelowSeconds;

  return (
    <time
      className={cn('tabular-nums', warn && 'text-warning font-semibold', className)}
      dateTime={deadline !== null ? new Date(deadline).toISOString() : undefined}
      aria-label={label ? `${label} ${render(left, format)}` : undefined}
    >
      {render(left, format)}
    </time>
  );
}
