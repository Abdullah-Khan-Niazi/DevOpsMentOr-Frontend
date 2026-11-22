import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/shared/components/Icon';
import { Skeleton } from '@/shared/components/Skeleton';
import { ROUTES } from '@/shared/constants';
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';
import { formatNumber, pluralize } from '@/shared/utils';
import { useGamificationSummary } from '../hooks/useGamificationSummary';

const COUNT_UP_MS = 600;

interface CountUp {
  from: number;
  to: number;
}

/**
 * Counts from the currently shown balance to `target` when it changes; the
 * first value and reduced motion show the target directly.
 */
function useCountUp(target: number | null): number | null {
  const reduceMotion = usePrefersReducedMotion();
  const [prevTarget, setPrevTarget] = useState(target);
  const [anim, setAnim] = useState<CountUp | null>(null);
  const [frame, setFrame] = useState<number | null>(null);

  // Adjust state during render when the target changes (no effect round trip):
  // a change mid-animation continues from the value on screen.
  if (target !== prevTarget) {
    const shown = anim ? (frame ?? anim.from) : prevTarget;
    setPrevTarget(target);
    setFrame(null);
    setAnim(
      !reduceMotion && shown !== null && target !== null && shown !== target
        ? { from: shown, to: target }
        : null,
    );
  }

  useEffect(() => {
    if (!anim) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS);
      if (t >= 1) {
        setAnim(null);
        setFrame(null);
        return;
      }
      const eased = 1 - (1 - t) ** 3;
      setFrame(Math.round(anim.from + (anim.to - anim.from) * eased));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anim]);

  if (reduceMotion || !anim) return target;
  return frame ?? anim.from;
}

/** Top bar XP balance and streak, linked to Achievements. Hidden on error or without access. */
export function XpChip() {
  const { data, isPending, fetchStatus } = useGamificationSummary();
  const balance = useCountUp(data?.balance ?? null);

  // A disabled query (no gamification permission) never fetches, so render nothing.
  if (isPending && fetchStatus === 'idle') return null;
  if (isPending) {
    return <Skeleton width="4.5rem" height="2.25rem" className="shrink-0" />;
  }
  // Hidden on error; a failed background refetch keeps the last known balance.
  if (!data) return null;

  const streakDays = data.currentStreakDays;
  const label = `${formatNumber(data.balance)} XP${
    streakDays > 0 ? `, ${pluralize(streakDays, 'day', 'days')} streak` : ''
  }`;

  return (
    <Link to={ROUTES.ACHIEVEMENTS} className="app-chrome__xp" aria-label={label}>
      <Icon name="zap" size={16} />
      <span className="tabular-nums">{formatNumber(balance)}</span>
      {streakDays > 0 ? (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Icon name="streak" size={16} />
          <span>{streakDays}</span>
        </span>
      ) : null}
    </Link>
  );
}
