import { useState } from 'react';
import { EmptyState, ErrorState, Skeleton } from '@/shared/components';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { hasCode } from '@/shared/services/apiError';
import { safeHttpUrl } from '@/shared/utils';

export interface SlidesPanelProps {
  /** Presigned deck URL from `GET /labs/:labId/slides`; null until loaded. */
  url: string | null;
  /** True while the Slides tab is showing; a new URL is only adopted while it is hidden. */
  active: boolean;
  loading: boolean;
  /** Query error; `SLIDES_NOT_FOUND` renders the empty state, anything else the error state. */
  error: unknown | null;
  onRetry: () => void;
}

function SlidesSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading slides"
      className="flex min-h-0 flex-1 flex-col p-4"
    >
      <Skeleton className="min-h-0 flex-1 rounded-md" />
    </div>
  );
}

/**
 * Course slide deck for the lab workspace, rendered from a presigned PDF URL. The iframe `src`
 * is frozen while the deck is open so the reader's page is never lost; a different URL is only
 * adopted when the tab is hidden (reopened later) or the PDF failed to load.
 */
export function SlidesPanel({
  url,
  active: _active,
  loading,
  error,
  onRetry,
}: SlidesPanelProps) {
  const safeUrl = safeHttpUrl(url);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [frameFailed, setFrameFailed] = useState(false);

  // Freeze the iframe URL once loaded so switching away and back never resets the reader's page.
  if (safeUrl && safeUrl !== frameUrl && (frameUrl === null || frameFailed)) {
    setFrameUrl(safeUrl);
    setFrameFailed(false);
  }

  if (hasCode(error, ERROR_CODES.SLIDES_NOT_FOUND)) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <EmptyState icon="slides" title="No slides for this course" />
      </div>
    );
  }

  if (error !== null && error !== undefined && !frameUrl) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <ErrorState error={error} title="Slides unavailable" onRetry={onRetry} />
      </div>
    );
  }

  if (loading && !frameUrl) return <SlidesSkeleton />;

  if (!frameUrl) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <ErrorState title="Slides unavailable" onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-pearl-100">
      <iframe
        src={frameUrl}
        title="Course slides"
        onError={() => {
          setFrameFailed(true);
          onRetry();
        }}
        referrerPolicy="no-referrer"
        className="h-full min-h-0 w-full flex-1 border-0"
      />
    </div>
  );
}

export default SlidesPanel;
