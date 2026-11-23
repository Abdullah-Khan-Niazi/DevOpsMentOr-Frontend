import { useState } from 'react';
import type { LearnerLabStepDto } from '@/features/labs/types';
import { Icon } from '@/shared/components';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Markdown } from '@/shared/components/Markdown';
import { getErrorMessage } from '@/shared/services/apiError';

export interface StepHintButtonProps {
  hints: LearnerLabStepDto['hints'];
  pending: boolean;
  revealedVisible: boolean;
  onToggleRevealed: () => void;
  onReveal: (index: number) => Promise<void>;
}

/**
 * Ghost/tertiary hint trigger aligned on the same row as the step title and XP.
 * Underlines on hover and while selected/active; reveals sequentially after confirmation.
 */
export function StepHintButton({
  hints,
  pending,
  revealedVisible,
  onToggleRevealed,
  onReveal,
}: StepHintButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (hints.total === 0) return null;

  const nextIndex = hints.nextHintIndex;
  const hasRevealed = hints.revealed.length > 0;
  const costSuffix = hints.cost > 0 ? ` (-${hints.cost} XP)` : '';

  async function handleConfirm() {
    if (nextIndex === null) return;
    try {
      await onReveal(nextIndex);
    } finally {
      setConfirming(false);
    }
  }

  if (nextIndex === null) {
    if (!hasRevealed) return null;
    return (
      <button
        type="button"
        onClick={onToggleRevealed}
        data-active={revealedVisible ? 'true' : 'false'}
        aria-expanded={revealedVisible}
        className="lab-hint-trigger"
      >
        <Icon name="hint" size={13} />
        <span>{hints.revealed.length > 1 ? `Hints (${hints.revealed.length})` : 'Hint'}</span>
      </button>
    );
  }

  const label = hasRevealed ? `Next hint${costSuffix}` : `Hint${costSuffix}`;

  return (
    <>
      <button
        type="button"
        disabled={pending}
        data-active={confirming ? 'true' : 'false'}
        onClick={() => setConfirming(true)}
        className="lab-hint-trigger"
      >
        <Icon name="hint" size={13} />
        <span>{label}</span>
      </button>

      <ConfirmDialog
        open={confirming}
        title={`Reveal hint ${nextIndex + 1} of ${hints.total}?`}
        message={
          hints.cost > 0
            ? `This deducts ${hints.cost} XP from this step permanently and cannot be undone.`
            : 'This cannot be undone.'
        }
        confirmLabel="Reveal hint"
        tone="primary"
        isLoading={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}

export interface RevealedHintsListProps {
  hints: LearnerLabStepDto['hints'];
  visible: boolean;
  error: unknown | null;
}

/** Revealed hints rendered inline below the active step instructions without cards-in-card. */
export function RevealedHintsList({ hints, visible, error }: RevealedHintsListProps) {
  const showRevealed = visible && hints.revealed.length > 0;
  if (!showRevealed && error === null) return null;

  return (
    <div className="flex flex-col gap-3">
      {showRevealed ? (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {hints.revealed.map((hint) => (
            <li key={hint.hintIndex} className="motion-fade-in flex flex-col gap-1">
              <span className="inline-flex items-center gap-1 font-mono text-micro font-semibold uppercase text-muted">
                <Icon name="hint" size={12} />
                {`Hint ${hint.hintIndex + 1}`}
              </span>
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
    </div>
  );
}

export interface HintsPanelProps {
  hints: LearnerLabStepDto['hints'];
  /** Reveals the hint at `index` (0-based). Rejections are shown inline. */
  onReveal: (index: number) => Promise<void>;
  pending: boolean;
}

/** Legacy standalone hints panel kept for callers that do not use inline header hints. */
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

      <RevealedHintsList hints={hints} visible error={error} />

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
