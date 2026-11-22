import type { LabStepCheckResultDto } from '@/features/labs/types';
import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import { XpDelta } from '@/shared/components/XpDelta';

export interface StepResultProps {
  result: LabStepCheckResultDto | null;
  /** Advances to the next step. The page also calls it automatically about 1.2 s after a pass. */
  onNext: () => void;
}

/** Outcome of the latest check: a pass with XP, or the server message with any penalties. */
export function StepResult({ result, onNext }: StepResultProps) {
  if (!result) return null;

  if (result.passed) {
    const showNext = !result.labCompleted && result.nextStepId !== null;
    return (
      <div
        role="status"
        className="motion-pop-in flex flex-col gap-3 rounded-lg border border-check-success/30 bg-check-success/10 p-4"
      >
        <div className="flex items-start gap-2">
          <Icon
            name="check-circle"
            size={20}
            filled
            className="mt-0.5 shrink-0 text-check-success"
          />
          <p className="m-0 text-sm font-medium text-card-foreground">
            {result.message.trim() || 'Step passed'}
          </p>
        </div>
        {!result.alreadyPassed && result.pointsAwarded > 0 ? (
          <XpDelta delta={result.pointsAwarded} />
        ) : null}
        {/* A passed question step answered without running a command still pays the guess cost. */}
        {result.guessed ? (
          <p className="m-0 text-sm text-muted">No command was run since this step started.</p>
        ) : null}
        {result.penalties.guess > 0 ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span>Guess without a command</span>
            <XpDelta delta={-result.penalties.guess} />
          </div>
        ) : null}
        {showNext ? (
          <div>
            <Button
              variant="primary"
              size="sm"
              iconName="arrow-right"
              iconPosition="right"
              onClick={onNext}
            >
              Next step
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  const { penalties } = result;
  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-error/30 bg-error/10 p-4"
    >
      <div className="flex items-start gap-2">
        <Icon name="error" size={20} className="mt-0.5 shrink-0 text-error" />
        <div className="flex flex-col gap-1">
          <p className="m-0 text-sm font-medium text-card-foreground">{result.message}</p>
          {result.guessed ? (
            <p className="m-0 text-sm text-muted">No command was run since this step started.</p>
          ) : null}
        </div>
      </div>
      {penalties.wrongAnswer > 0 || penalties.guess > 0 ? (
        <div className="flex flex-col gap-2">
          {penalties.wrongAnswer > 0 ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>Wrong answer</span>
              <XpDelta delta={-penalties.wrongAnswer} />
            </div>
          ) : null}
          {penalties.guess > 0 ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>Guess without a command</span>
              <XpDelta delta={-penalties.guess} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
