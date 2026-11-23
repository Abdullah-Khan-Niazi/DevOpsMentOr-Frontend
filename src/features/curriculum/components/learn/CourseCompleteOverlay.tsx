import { useEffect, useId, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Button, Icon } from '@/shared/components';
import { useOverlayLayer, usePresence } from '@/shared/components/Overlay';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { useScrollLock } from '@/shared/hooks/useScrollLock';
import './CourseCompleteOverlay.css';

const EXIT_MS = 160;
const DEFAULT_DURATION_MS = 2_500;

export interface CourseCompleteOverlayProps {
  open: boolean;
  courseTitle?: string | null;
  durationMs?: number;
  onContinue: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Celebratory course completion card shown for ~2.5s when completing the final item
 * of a course, before gracefully navigating back to Learn with the next course highlighted.
 */
export function CourseCompleteOverlay({
  open,
  courseTitle = null,
  durationMs = DEFAULT_DURATION_MS,
  onContinue,
  secondaryAction,
}: CourseCompleteOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const onContinueRef = useRef(onContinue);
  const titleId = useId();
  const { mounted, closing } = usePresence(open, EXIT_MS);

  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => {
      onContinueRef.current();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs]);

  useOverlayLayer(open && mounted, () => onContinueRef.current(), rootRef);
  useFocusTrap(cardRef, open && mounted, { initialFocusRef: cardRef });
  useScrollLock(open && mounted);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={rootRef}
      className="overlay-root course-complete-root"
      data-state={closing ? 'closed' : 'open'}
    >
      <div className="course-complete-backdrop">
        <div
          ref={cardRef}
          className="course-complete-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
        >
          <Icon name="trophy" size={36} filled className="text-check-success" />
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="m-0 text-xl font-bold tracking-tight text-card-foreground">
              Course complete
            </h2>
            {courseTitle ? (
              <p className="m-0 text-sm font-medium text-muted">{courseTitle}</p>
            ) : null}
          </div>

          <div className="course-complete-bar" aria-hidden="true">
            <div
              className="course-complete-bar__fill"
              style={{ '--course-complete-duration': `${durationMs}ms` } as CSSProperties}
            />
          </div>

          <p className="m-0 font-mono text-xs text-muted">Returning to Learn…</p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button
              variant="primary"
              size="sm"
              iconName="arrow-right"
              iconPosition="right"
              onClick={() => onContinueRef.current()}
            >
              Continue now
            </Button>
            {secondaryAction ? (
              <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default CourseCompleteOverlay;
