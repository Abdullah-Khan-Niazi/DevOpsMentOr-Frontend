import { useEffect, useState } from 'react';

interface LabTimerCountdownProps {
  expiresAt: string | null;
  onExpired?: () => void;
  onLowTime?: () => void;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** SCR-F6-02: MM:SS countdown; turns error color under 5 minutes. */
export function LabTimerCountdown({ expiresAt, onExpired, onLowTime }: LabTimerCountdownProps) {
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    expiresAt ? new Date(expiresAt).getTime() - Date.now() : 0,
  );

  useEffect(() => {
    if (!expiresAt) {
      return undefined;
    }
    const tick = (): void => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemainingMs(ms);
      if (ms <= 0) {
        onExpired?.();
      } else if (ms <= 5 * 60_000) {
        onLowTime?.();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired, onLowTime]);

  if (!expiresAt) {
    return (
      <span className="lab-timer" aria-label="No expiry set">
        --:--
      </span>
    );
  }

  const low = remainingMs <= 5 * 60_000;
  return (
    <span
      className={`lab-timer${low ? ' lab-timer--low' : ''}`}
      aria-label="Time remaining in lab session"
      data-testid="lab-timer"
    >
      {formatRemaining(remainingMs)}
    </span>
  );
}

export default LabTimerCountdown;
