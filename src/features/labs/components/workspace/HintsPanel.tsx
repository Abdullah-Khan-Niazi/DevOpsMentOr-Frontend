import { useState } from 'react';
import type { LearnerLabStepDto } from '@/features/labs/types';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Markdown } from '@/shared/components/Markdown';
import { getErrorMessage } from '@/shared/services/apiError';

export interface HintsPanelProps {
  hints: LearnerLabStepDto['hints'];
  /** Reveals the hint at `index` (0-based). Rejections are shown inline. */
  onReveal: (index: number) => Promise<void>;
  pending: boolean;
}

/** Revealed hints plus the sequential reveal action. Each reveal costs XP, so it is confirmed first. */
export function HintsPanel({ hints, onReveal, pending }: HintsPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  if (hints.total === 0) return null;

  const nextIndex = hints.nextHintIndex;
  const costText = hints.cost > 0 ? ` (costs ${hints.cost} XP)` : '';

  async function handleConfirm() {
    if (nextIndex === null) return;
    setError(null);
    try {
      await onReveal(nextIndex);
      setConfirming(false);
    } catch (revealError) {
      setError(revealError);
      setConfirming(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="m-0 text-base font-semibold text-card-foreground">Hints</h2>

      {hints.revealed.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {hints.revealed.map((hint) => (
            <li key={hint.hintIndex} className="motion-fade-in">
              <Markdown variant="compact">{hint.text}</Markdown>
            </li>
          ))}
        </ul>
      ) : null}

      {error !== null ? (
        <p role="alert" className="m-0 text-sm text-error">
          {getErrorMessage(error, 'The hint could not be revealed.')}
        </p>
      ) : null}

      {nextIndex !== null ? (
        <div>
          <Button
            variant="secondary"
            size="sm"
            iconName="hint"
            onClick={() => setConfirming(true)}
            disabled={pending}
          >
            {`Reveal hint${costText}`}
          </Button>
        </div>
      ) : null}

      {nextIndex !== null ? (
        <ConfirmDialog
          open={confirming}
          title={`Reveal hint ${nextIndex + 1} of ${hints.total}?`}
          message={
            hints.cost > 0
              ? `This costs ${hints.cost} XP and cannot be undone.`
              : 'This cannot be undone.'
          }
          confirmLabel="Reveal hint"
          tone="primary"
          isLoading={pending}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void handleConfirm()}
        />
      ) : null}
    </section>
  );
}
