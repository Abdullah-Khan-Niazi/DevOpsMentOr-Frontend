import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/utils';
import { formatSigned } from '@/shared/utils/format';

export interface XpDeltaProps {
  delta: number;
  className?: string;
}

/** `+25 XP` / `-5 XP` with a bolt icon and tabular numbers; pops in on mount. */
export function XpDelta({ delta, className }: XpDeltaProps) {
  const negative = delta < 0;
  return (
    <span
      className={cn(
        'motion-pop-in inline-flex items-center gap-1 font-semibold tabular-nums',
        negative ? 'text-signal' : 'text-check-success',
        className,
      )}
    >
      <Icon name="zap" size={16} />
      <span>{formatSigned(delta)} XP</span>
    </span>
  );
}
