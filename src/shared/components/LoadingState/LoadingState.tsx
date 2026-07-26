import { Spinner } from '@/shared/components/Spinner';

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
