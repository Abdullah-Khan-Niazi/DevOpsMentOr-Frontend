import { useEffect } from 'react';
import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import { getErrorMessage, isApiError } from '@/shared/services/apiError';
import { cn } from '@/shared/utils';

interface ErrorStateProps {
  title?: string;
  /** The thrown value (query/mutation error); its message is shown. */
  error?: unknown;
  /** Explicit message; wins over `error`. Shown as the short heading (no helper paragraph). */
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
  /** Inline variant for tree rows and panels. */
  compact?: boolean;
  className?: string;
}

/**
 * Failure state with retry. Offline failures show an offline message and
 * retry automatically when the browser reconnects.
 */
export function ErrorState({
  title,
  error,
  message,
  onRetry,
  retrying = false,
  compact = false,
  className,
}: ErrorStateProps) {
  // Timeouts keep the generic title (the server may be slow, not unreachable).
  const offline = isApiError(error) && error.kind === 'network';
  const resolvedTitle = title ?? (offline ? 'You are offline' : 'Something went wrong');
  const resolvedMessage = message ?? (error !== undefined ? getErrorMessage(error) : undefined);

  useEffect(() => {
    if (!offline || !onRetry) return;
    window.addEventListener('online', onRetry);
    return () => window.removeEventListener('online', onRetry);
  }, [offline, onRetry]);

  if (compact) {
    return (
      <div
        role="alert"
        className={cn('flex flex-wrap items-center gap-2 py-1 text-sm text-signal', className)}
      >
        <Icon name={offline ? 'offline' : 'error'} size={16} />
        <span className="min-w-0">{resolvedMessage ?? resolvedTitle}</span>
        {onRetry ? (
          <Button variant="ghost" size="sm" onClick={onRetry} isLoading={retrying}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        'motion-fade-in flex flex-col items-center justify-center gap-2 px-6 py-10 text-center',
        className,
      )}
    >
      <Icon name={offline ? 'offline' : 'error'} size={28} className="mb-1 text-signal" />
      <h3 className="max-w-md text-base font-semibold text-card-foreground">
        {resolvedMessage ?? resolvedTitle}
      </h3>
      {onRetry ? (
        <div className="mt-3">
          <Button variant="secondary" onClick={onRetry} isLoading={retrying} iconName="refresh">
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
