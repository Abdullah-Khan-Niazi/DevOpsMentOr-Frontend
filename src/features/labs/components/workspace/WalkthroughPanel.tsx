import { EmptyState, ErrorState, Markdown, Skeleton } from '@/shared/components';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { hasCode } from '@/shared/services/apiError';

export interface WalkthroughPanelProps {
  /** Walkthrough Markdown from `GET /labs/:labId/walkthrough`. */
  markdown: string | null;
  loading: boolean;
  /** Query error; `WALKTHROUGH_NOT_FOUND` renders the empty state, anything else the error state. */
  error: unknown | null;
  onRetry: () => void;
}

function WalkthroughSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading walkthrough"
      className="prose-measure flex flex-col gap-3 p-1"
    >
      <Skeleton variant="text" className="h-6" width="45%" />
      <Skeleton variant="text" className="h-3.5" width="100%" />
      <Skeleton variant="text" className="h-3.5" width="96%" />
      <Skeleton variant="text" className="h-3.5" width="88%" />
      <Skeleton variant="text" className="h-3.5" width="60%" />
      <Skeleton variant="text" className="mt-4 h-6" width="38%" />
      <Skeleton variant="text" className="h-3.5" width="100%" />
      <Skeleton variant="text" className="h-3.5" width="92%" />
      <Skeleton variant="text" className="h-3.5" width="70%" />
    </div>
  );
}

function NoWalkthrough() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState icon="walkthrough" title="No walkthrough for this lab" />
    </div>
  );
}

/** Lab walkthrough tab. Markdown is rendered by the shared sanitized `Markdown`. */
export function WalkthroughPanel({ markdown, loading, error, onRetry }: WalkthroughPanelProps) {
  if (loading) return <WalkthroughSkeleton />;

  if (hasCode(error, ERROR_CODES.WALKTHROUGH_NOT_FOUND)) return <NoWalkthrough />;

  if (error !== null && error !== undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (!markdown?.trim()) return <NoWalkthrough />;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="prose-measure">
        <Markdown variant="prose">{markdown}</Markdown>
      </div>
    </div>
  );
}

export default WalkthroughPanel;
