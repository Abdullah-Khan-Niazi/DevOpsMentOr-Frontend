import { useCallback, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '@/shared/components/IconButton';
import { useOverlayLayer, usePresence } from '@/shared/components/Overlay';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { useScrollLock } from '@/shared/hooks/useScrollLock';
import { cn } from '@/shared/utils';
import './Modal.css';

const EXIT_MS = 160;

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Action row rendered under the content. */
  footer?: ReactNode;
  /** Blocks Esc, backdrop and close button (for example while a request is in flight). */
  closeDisabled?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Accessible modal dialog: portal to `body`, focus trap, shared overlay stack
 * (only the top-most overlay handles Esc; `#root` is inert while open), scroll
 * lock, pop-in and fade-out animation.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  closeDisabled = false,
  initialFocusRef,
}: ModalProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { mounted, closing } = usePresence(open, EXIT_MS);

  const requestClose = useCallback(() => {
    if (!closeDisabled) onClose();
  }, [closeDisabled, onClose]);

  useOverlayLayer(open && mounted, requestClose, rootRef);
  // Default focus is the dialog itself (as before); callers can target a field or button.
  useFocusTrap(panelRef, open && mounted, { initialFocusRef: initialFocusRef ?? panelRef });
  useScrollLock(open && mounted);

  if (!mounted) return null;

  return createPortal(
    <div ref={rootRef} className="overlay-root modal-root" data-state={closing ? 'closed' : 'open'}>
      <div
        className="modal-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) requestClose();
        }}
      >
        <div
          ref={panelRef}
          className={cn('modal-panel', size !== 'md' && `modal-panel--${size}`)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
        >
          <div className="modal-panel__header">
            <h2 id={titleId} className="modal-panel__title">
              {title}
            </h2>
            <IconButton
              icon="x"
              label="Close dialog"
              size="sm"
              showTooltip={false}
              onClick={requestClose}
              disabled={closeDisabled}
            />
          </div>
          {children}
          {footer ? <div className="modal-panel__actions">{footer}</div> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
