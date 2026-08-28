interface ProgressBarProps {
  percentage: number;
  label?: string;
  size?: 'sm' | 'md';
}

/** Accessible progress bar; percentage announced via aria-valuenow (SCR-F5-01). */
export function ProgressBar({ percentage, label, size = 'md' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const height = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
      className="w-full"
    >
      <div className={`${height} w-full overflow-hidden rounded-full bg-border`}>
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
