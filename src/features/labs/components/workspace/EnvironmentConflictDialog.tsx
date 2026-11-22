import { useState } from 'react';
import { ConfirmDialog, ErrorState } from '@/shared/components';

export interface EnvironmentConflictDialogProps {
  open: boolean;
  /** Lab whose environment is active and must end before this lab can start. */
  otherLabName: string;
  /** Ends the other environment and starts this lab's. Rejections keep the dialog open with the error. */
  onConfirm: () => Promise<void>;
  /** Closes the dialog; called on cancel and after a successful confirm. */
  onClose: () => void;
}

/** Danger confirmation for replacing the learner's active lab environment. */
export function EnvironmentConflictDialog({
  open,
  otherLabName,
  onConfirm,
  onClose,
}: EnvironmentConflictDialogProps) {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{ error: unknown } | null>(null);

  function handleClose() {
    if (pending) return;
    setFailure(null);
    onClose();
  }

  async function handleConfirm() {
    setPending(true);
    setFailure(null);
    try {
      await onConfirm();
      onClose();
    } catch (error: unknown) {
      setFailure({ error });
    } finally {
      setPending(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="End your other lab environment?"
      message={
        <>
          <p>
            {`${otherLabName} is using your lab environment. Ending it deletes that environment, then starts one for this lab.`}
          </p>
          {failure ? <ErrorState compact error={failure.error} /> : null}
        </>
      }
      confirmLabel="End environment"
      tone="danger"
      isLoading={pending}
      onCancel={handleClose}
      onConfirm={() => void handleConfirm()}
    />
  );
}

export default EnvironmentConflictDialog;
