import { useRef, type ReactNode } from 'react';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';

// Confirmation dialog: deletes, discards and ending an environment (danger),
// or a costed action such as revealing a hint (primary).

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** Alternative action, for example "Archive instead" when a delete is refused. */
  secondaryAction?: { label: string; onClick: () => void; isLoading?: boolean };
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isLoading = false,
  onCancel,
  onConfirm,
  secondaryAction,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const busy = isLoading || Boolean(secondaryAction?.isLoading);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      closeDisabled={busy}
      initialFocusRef={tone === 'danger' ? cancelRef : confirmRef}
    >
      {typeof message === 'string' ? (
        <p className="modal-panel__body">{message}</p>
      ) : (
        <div className="modal-panel__body">{message}</div>
      )}
      <div className="modal-panel__actions">
        <Button ref={cancelRef} variant="ghost" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        {secondaryAction ? (
          <Button
            variant="secondary"
            onClick={secondaryAction.onClick}
            isLoading={secondaryAction.isLoading}
            disabled={isLoading}
          >
            {secondaryAction.label}
          </Button>
        ) : null}
        <Button
          ref={confirmRef}
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          isLoading={isLoading}
          disabled={Boolean(secondaryAction?.isLoading)}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
