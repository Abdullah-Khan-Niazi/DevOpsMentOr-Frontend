import { useRef, type KeyboardEvent } from 'react';
import type { LabStepStatus, LearnerLabStepDto } from '@/features/labs/types';
import { cn } from '@/shared/utils';

export interface StepIndicatorProps {
  steps: LearnerLabStepDto[];
  currentStepId: string | null;
  viewingStepId: string | null;
  onSelect: (stepId: string) => void;
}

const STATUS_LABEL: Record<LabStepStatus, string> = {
  passed: 'passed',
  current: 'current',
  locked: 'locked',
};

const FILL_CLASS: Record<LabStepStatus, string> = {
  passed: 'bg-check-success',
  current: 'bg-brand-600',
  locked: 'bg-border',
};

/**
 * One segment per step. Passed and current segments are clickable (review and return to the
 * current step); locked segments are disabled. Arrow keys, Home and End move focus between the
 * enabled segments (roving tab stop), Enter and Space select.
 */
export function StepIndicator({
  steps,
  currentStepId,
  viewingStepId,
  onSelect,
}: StepIndicatorProps) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const enabledIndexes = steps.flatMap((step, index) => (step.status === 'locked' ? [] : [index]));
  const enabledSteps = enabledIndexes.map((index) => steps[index]);

  const tabStopId =
    (
      enabledSteps.find((step) => step.stepId === viewingStepId) ??
      enabledSteps.find((step) => step.stepId === currentStepId) ??
      enabledSteps[0]
    )?.stepId ?? null;

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (enabledIndexes.length === 0) return;
    const position = enabledIndexes.indexOf(index);
    let target: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        target = enabledIndexes[(position + 1) % enabledIndexes.length];
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        target = enabledIndexes[(position - 1 + enabledIndexes.length) % enabledIndexes.length];
        break;
      case 'Home':
        target = enabledIndexes[0];
        break;
      case 'End':
        target = enabledIndexes[enabledIndexes.length - 1];
        break;
      default:
        return;
    }
    event.preventDefault();
    buttonsRef.current[target]?.focus();
  }

  if (steps.length === 0) return null;

  return (
    <div role="group" aria-label="Lab steps" className="flex w-full items-center gap-1">
      {steps.map((step, index) => {
        const locked = step.status === 'locked';
        const current = step.stepId === currentStepId;
        const viewing = step.stepId === viewingStepId;
        return (
          <button
            key={step.stepId}
            ref={(node) => {
              buttonsRef.current[index] = node;
            }}
            type="button"
            disabled={locked}
            tabIndex={step.stepId === tabStopId ? 0 : -1}
            aria-current={current ? 'step' : undefined}
            aria-label={`Step ${step.position}, ${step.title}, ${STATUS_LABEL[step.status]}`}
            title={step.title}
            onClick={() => onSelect(step.stepId)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'flex min-w-0 flex-1 items-center rounded-sm py-2.5 transition-opacity duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
              locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'block h-1.5 w-full rounded-full transition-colors duration-200',
                FILL_CLASS[step.status],
                viewing && 'ring-2 ring-brand-600 ring-offset-2 ring-offset-paper',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
