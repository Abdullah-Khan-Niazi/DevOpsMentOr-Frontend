import { useState } from 'react';
import { ConfirmDialog, toast } from '@/shared/components';
import { getErrorCode, getErrorMessage } from '@/shared/services/apiError';

// Delete confirmation for curriculum entities. When the server refuses the delete
// because the entity is in use (learner data, assignments, lab or question usage),
// the dialog shows the server's reason and offers the non-destructive alternative.
// The delete hooks do not toast their errors, so this dialog owns all delete feedback:
// a refusal is shown inline, every other failure is toasted.

const BLOCKING_CODE_SUFFIXES = [
  '_HAS_LEARNER_DATA',
  'COURSE_ASSIGNED',
  'LAB_IN_USE',
  'QUESTION_HAS_ANSWERS',
] as const;

export interface DeleteEntityDialogProps {
  open: boolean;
  /** Lower-case noun for the entity, for example "module". */
  entityLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  /**
   * Shown after a refusal, for example "Archive instead". A returned promise
   * keeps the button loading; on success the dialog closes, on failure the
   * error is toasted and the dialog stays open.
   */
  insteadAction?: { label: string; onClick: () => void | Promise<void> };
}

function isBlockingError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code !== null && BLOCKING_CODE_SUFFIXES.some((suffix) => code.endsWith(suffix));
}

export function DeleteEntityDialog({
  open,
  entityLabel,
  onConfirm,
  onClose,
  insteadAction,
}: DeleteEntityDialogProps) {
  const [busy, setBusy] = useState(false);
  const [insteadBusy, setInsteadBusy] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  // Each time the dialog closes, forget the previous refusal.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setBlockedMessage(null);
  }

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      if (isBlockingError(error)) {
        setBlockedMessage(getErrorMessage(error));
      } else {
        toast.error(error);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleInstead() {
    if (!insteadAction) return;
    setInsteadBusy(true);
    try {
      await insteadAction.onClick();
      onClose();
    } catch (error) {
      toast.error(error);
    } finally {
      setInsteadBusy(false);
    }
  }

  const message =
    blockedMessage ?? `This permanently deletes the ${entityLabel}. This cannot be undone.`;

  return (
    <ConfirmDialog
      open={open}
      title={`Delete ${entityLabel}?`}
      message={message}
      confirmLabel="Delete"
      tone="danger"
      isLoading={busy}
      onCancel={onClose}
      onConfirm={() => {
        void handleConfirm();
      }}
      secondaryAction={
        blockedMessage !== null && insteadAction
          ? {
              label: insteadAction.label,
              isLoading: insteadBusy,
              onClick: () => {
                void handleInstead();
              },
            }
          : undefined
      }
    />
  );
}
