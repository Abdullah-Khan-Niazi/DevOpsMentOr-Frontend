import { Button, Modal } from '@/shared/components';

// Destructive-action confirmation dialog (revoke flows).

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  isLoading = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={isLoading ? () => undefined : onCancel} title={title}>
      <p className="modal-panel__body">{message}</p>
      <div className="modal-panel__actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
