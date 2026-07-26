import { Button } from '@/shared/components/Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-red-800">{title}</h3>
      <p className="max-w-md text-sm text-red-700">{message}</p>
      {onRetry ? (
        <div className="mt-3">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
