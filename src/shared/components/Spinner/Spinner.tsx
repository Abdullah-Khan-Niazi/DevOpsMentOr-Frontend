import { cn } from '@/shared/utils';

interface SpinnerProps {
  className?: string;
  label?: string;
}

/** Ring spinner (CSS only); size follows the font size, defaults to 1.25rem. */
export function Spinner({ className, label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('spin-ring text-xl text-muted-foreground', className)}
    />
  );
}
