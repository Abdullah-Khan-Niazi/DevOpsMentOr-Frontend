import { cn } from '@/shared/utils';
import './ProgressBar.css';

export interface ProgressBarProps {
  value: number;
  max?: number;
  /** Accessible name (for example "Course progress"). */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** `role="progressbar"` with an eased width transition. Values are clamped to [0, max]. */
export function ProgressBar({ value, max = 100, label, size = 'md', className }: ProgressBarProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), safeMax) : 0;
  const percent = (safeValue / safeMax) * 100;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={Math.round(safeValue)}
      className={cn('progress-bar', `progress-bar--${size}`, className)}
    >
      <span className="progress-bar__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
