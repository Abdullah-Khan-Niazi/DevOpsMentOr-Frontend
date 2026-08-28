import { useState } from 'react';
import { ConfirmDialog } from '@/shared/components';

interface PublishToggleProps {
  isPublished: boolean;
  label: string;
  busy: boolean;
  onPublish: () => void;
  onUnpublish?: () => void;
}

/**
 * F4 §02 publish/unpublish switch. Unpublishing is destructive (it hides
 * content from learners), so it always requires confirmation.
 */
export function PublishToggle({
  isPublished,
  label,
  busy,
  onPublish,
  onUnpublish,
}: PublishToggleProps) {
  const [confirming, setConfirming] = useState(false);

  const handleToggle = () => {
    if (isPublished) {
      setConfirming(true);
      return;
    }
    onPublish();
  };

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={isPublished}
        aria-label={`${isPublished ? 'Unpublish' : 'Publish'} ${label}`}
        disabled={busy}
        onClick={handleToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          isPublished ? 'bg-green-600' : 'bg-border'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            isPublished ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
      <ConfirmDialog
        open={confirming}
        title="Unpublish"
        message="This will hide it from learners. Continue?"
        confirmLabel="Unpublish"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onUnpublish?.();
        }}
      />
    </>
  );
}
