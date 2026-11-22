import { useCallback, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { IconButton } from '@/shared/components/IconButton';
import { useOverlayLayer, usePresence } from '@/shared/components/Overlay';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { useScrollLock } from '@/shared/hooks/useScrollLock';
import { cn } from '@/shared/utils';
import './Drawer.css';

/** Matches `--duration-page` used by the exit animation. */
const EXIT_MS = 320;

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'md' | 'lg' | 'xl';
  children: ReactNode;
  /**
   * Sticky action row (Cancel / Save). Pass a function to receive the guarded
   * close (dirty confirm, busy lock) for a Cancel button.
   */
  footer?: ReactNode | ((requestClose: () => void) => ReactNode);
  /** Unsaved changes: closing asks "Discard changes?" first. */
  dirty?: boolean;
  /** A save is in flight: Esc, backdrop and close are blocked. */
  busy?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Slide-over sheet for create/edit flows. Portal into `body` (`.overlay-root`),
 * focus trap, shared overlay stack (`#root` inert, top-most Esc), scroll lock,
 * dirty guard and busy lock. Stays mounted until its exit animation ends.
 */
export function Drawer({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  dirty = false,
  busy = false,
  initialFocusRef,
}: DrawerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { mounted, closing } = usePresence(open, EXIT_MS);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if (!open && confirmDiscard) {
    setConfirmDiscard(false);
  }

  const requestClose = useCallback(() => {
    if (busy) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }, [busy, dirty, onClose]);

  const active = open && mounted;
  useOverlayLayer(active, requestClose, rootRef);
  // Default focus: the first field in the body, not the close button.
  useFocusTrap(panelRef, active, { initialFocusRef: initialFocusRef ?? bodyRef });
  useScrollLock(active);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        ref={rootRef}
        className="overlay-root drawer-root"
        data-state={closing ? 'closed' : 'open'}
      >
        <div className="drawer-backdrop" aria-hidden="true" onMouseDown={requestClose} />
        <div
          ref={panelRef}
          className={cn('drawer-panel', size !== 'md' && `drawer-panel--${size}`)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-busy={busy || undefined}
          tabIndex={-1}
        >
          <div className="drawer-panel__header">
            <h2 id={titleId} className="drawer-panel__title">
              {title}
            </h2>
            <IconButton
              icon="x"
              label="Close"
              showTooltip={false}
              onClick={requestClose}
              disabled={busy}
              isLoading={busy}
            />
          </div>
          <div ref={bodyRef} className="drawer-panel__body">
            {children}
          </div>
          {footer ? (
            <div className="drawer-panel__footer">
              {typeof footer === 'function' ? footer(requestClose) : footer}
            </div>
          ) : null}
        </div>
      </div>
      <ConfirmDialog
        open={confirmDiscard}
        title="Discard changes?"
        message="Your unsaved changes will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
      />
    </>,
    document.body,
  );
}
