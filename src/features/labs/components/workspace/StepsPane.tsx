import { useState } from 'react';
import type {
  LabStepCheckResultDto,
  LabStepsStateDto,
  LearnerLabStepDto,
} from '@/features/labs/types';
import {
  getEffectiveLabTotalXp,
  getEffectiveStepXp,
  getStepHintDeduction,
} from '@/features/labs/utils/stepXp';
import { Button, EmptyState, Icon, IconButton } from '@/shared/components';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { getErrorMessage, getStatusCode, hasCode } from '@/shared/services';
import { cn } from '@/shared/utils';
import { RevealedHintsList, StepHintButton } from './HintsPanel';
import { LabCompletePanel } from './LabCompletePanel';
import { ScenarioPanel } from './ScenarioPanel';
import { StepPanel, type StepEnvironment, type StepPracticeResult } from './StepPanel';
import { StepResult } from './StepResult';

export interface StepsPaneProps {
  state: LabStepsStateDto;
  shownStepId: string | null;
  environment: StepEnvironment;
  staging: { pending: boolean; error: unknown | null; onRetry: () => void };
  result: LabStepCheckResultDto | null;
  checkError: unknown | null;
  checkPending: boolean;
  retryAfterSeconds: number | null;
  isRevealing: boolean;
  nextItem: { label: string; to: string } | null;
  backTo: string;
  onSelectStep: (stepId: string) => void;
  onCheck: (answer?: string) => void;
  onRetryCheck: () => void;
  onAdvance: () => void;
  onRevealHint: (hintIndex: number) => Promise<void>;
  onCollapseGuide: () => void;
  onNavigate: (to: string) => void;
}

interface StepChecklistItemProps {
  step: LearnerLabStepDto;
  isSelected: boolean;
  environment: StepEnvironment;
  staging: { pending: boolean; error: unknown | null; onRetry: () => void };
  result: LabStepCheckResultDto | null;
  checkError: unknown | null;
  checkPending: boolean;
  retryAfterSeconds: number | null;
  isRevealing: boolean;
  onSelectStep: (stepId: string) => void;
  onCheck: (answer?: string) => void;
  onRetryCheck: () => void;
  onAdvance: () => void;
  onRevealHint: (hintIndex: number) => Promise<void>;
}

/**
 * Single vertical step row:
 * - Passed steps show green hue + white check icon and can be clicked to revisit
 * - Locked future steps stay blurred/disabled with instructions hidden
 * - Only the active or revisited step expands inline, with the ghost Hint action on its header row
 * - Check button is omitted for task steps (the right dark terminal bar owns Run Checks)
 */
function StepChecklistItem({
  step,
  isSelected,
  environment,
  staging,
  result,
  checkError,
  checkPending,
  retryAfterSeconds,
  isRevealing,
  onSelectStep,
  onCheck,
  onRetryCheck,
  onAdvance,
  onRevealHint,
}: StepChecklistItemProps) {
  const [hintsVisible, setHintsVisible] = useState(true);
  const [revealError, setRevealError] = useState<unknown | null>(null);

  const isPassed = step.status === 'passed';
  const isLocked = step.status === 'locked';
  const readOnly = isPassed;

  const effectiveXp = getEffectiveStepXp(step);
  const hintDeduction = getStepHintDeduction(step);

  const unreachable = hasCode(checkError, ERROR_CODES.LAB_ENV_UNREACHABLE);
  const rateLimited = getStatusCode(checkError) === 429;

  const practiceResult: StepPracticeResult | null =
    result !== null && result.stepId === step.stepId && result.alreadyPassed
      ? result.passed
        ? 'passing'
        : 'not_passing'
      : null;

  const showResult =
    result !== null &&
    result.stepId === step.stepId &&
    !result.labCompleted &&
    (!result.alreadyPassed || !result.passed);

  async function handleReveal(hintIndex: number) {
    setRevealError(null);
    setHintsVisible(true);
    try {
      await onRevealHint(hintIndex);
    } catch (error) {
      setRevealError(error);
    }
  }

  return (
    <div
      className={cn(
        'rounded-md p-3 transition-colors duration-(--duration-fast)',
        isPassed ? 'bg-check-success/10' : isSelected ? 'bg-paper' : 'bg-paper/55',
        isLocked && 'opacity-55',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          disabled={isLocked}
          onClick={() => onSelectStep(step.stepId)}
          className={cn(
            'flex min-w-0 flex-1 items-start gap-2.5 text-left',
            isLocked ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-caption font-bold',
              isPassed
                ? 'bg-check-success text-pearl-100'
                : isSelected
                  ? 'bg-ink text-pearl-100'
                  : 'bg-surface text-card-foreground',
            )}
          >
            {isPassed ? <Icon name="check" size={12} /> : step.position}
          </span>

          <span
            className={cn(
              'pt-0.5 text-xs font-medium text-card-foreground',
              isLocked && 'blur-[0.04rem] select-none',
            )}
          >
            {step.title}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
          {isSelected && step.hints.total > 0 ? (
            <StepHintButton
              hints={step.hints}
              pending={isRevealing}
              revealedVisible={hintsVisible}
              onToggleRevealed={() => setHintsVisible((v) => !v)}
              onReveal={handleReveal}
            />
          ) : null}

          <span
            className="font-mono text-micro text-muted tabular-nums"
            title={
              hintDeduction > 0
                ? `${effectiveXp} XP (${hintDeduction} XP hint deducted)`
                : `${effectiveXp} XP`
            }
          >
            {effectiveXp} XP
          </span>
        </div>
      </div>

      {isSelected ? (
        <div className="mt-3 flex flex-col gap-4 pl-7">
          <StepPanel
            key={step.stepId}
            step={step}
            environment={environment}
            staging={staging}
            onCheck={onCheck}
            checkPending={checkPending}
            retryAfterSeconds={retryAfterSeconds}
            readOnly={readOnly}
            practiceResult={practiceResult}
            hideTitle
            hideTaskCheckButton
          />

          {unreachable ? (
            <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-error">
              <span>The lab environment did not respond. Nothing was recorded.</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={onRetryCheck}
                isLoading={checkPending}
                loadingLabel="Retrying check…"
              >
                Try again
              </Button>
            </div>
          ) : null}

          {checkError !== null && !unreachable && !rateLimited ? (
            <p role="alert" className="m-0 text-sm text-error">
              {getErrorMessage(checkError)}
            </p>
          ) : null}

          {showResult ? <StepResult result={result} onNext={onAdvance} /> : null}

          <RevealedHintsList hints={step.hints} visible={hintsVisible} error={revealError} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Left DataCamp-style Scenario & Steps guide pane:
 * - Header shows panel title, total available XP in this lab (after hint deductions), and collapse trigger
 * - Scenario intro (markdown)
 * - Vertical Steps checklist showing only the active/revisited step inline, with inline Hint button
 *   on the step header row and task check ownership in the dark terminal bar
 */
export function StepsPane({
  state,
  shownStepId,
  environment,
  staging,
  result,
  checkError,
  checkPending,
  retryAfterSeconds,
  isRevealing,
  nextItem,
  backTo,
  onSelectStep,
  onCheck,
  onRetryCheck,
  onAdvance,
  onRevealHint,
  onCollapseGuide,
  onNavigate,
}: StepsPaneProps) {
  const shownStep = state.steps.find((step) => step.stepId === shownStepId) ?? null;
  const completed = state.completedAt !== null && shownStep === null;
  const effectiveTotalXp = getEffectiveLabTotalXp(state);

  return (
    <section
      aria-label="Lab scenario and steps"
      className="flex min-h-0 min-w-0 flex-1 flex-col bg-card"
    >
      {/* DataCamp Panel Header: Icon + Label | Total Lab XP | Collapse Button */}
      <header className="flex h-11 shrink-0 items-center justify-between gap-2 bg-paper/70 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Icon name="terminal" size={16} className="text-muted" />
          <h2 className="m-0 truncate font-mono text-xs font-semibold uppercase tracking-wider text-card-foreground">
            Lab Scenario &amp; Steps
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className="font-mono text-xs font-medium text-muted tabular-nums"
            title="Total XP available in this lab"
          >
            {effectiveTotalXp} XP
          </span>
          <IconButton
            icon="panel-close"
            label="Collapse Guide"
            size="sm"
            onClick={onCollapseGuide}
          />
        </div>
      </header>

      {/* Scrollable Scenario + Steps Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 text-card-foreground">
        {state.scenarioIntro.trim() ? (
          <ScenarioPanel markdown={state.scenarioIntro} defaultOpen />
        ) : null}

        {completed && state.completedAt !== null ? (
          <LabCompletePanel
            completedAt={state.completedAt}
            completionBonus={state.completionBonus}
            totals={state.totals}
            effectiveTotalXp={effectiveTotalXp}
            graceExpiresAt={state.activeInstance?.expiresAt ?? null}
            next={nextItem}
            backTo={backTo}
          />
        ) : null}

        {state.steps.length === 0 ? (
          <EmptyState icon="lab" title="This lab has no steps yet" />
        ) : (
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs font-bold uppercase text-card-foreground">
              Steps
            </span>

            <div className="flex flex-col gap-2">
              {state.steps.map((step) => {
                const isSelected = step.stepId === shownStepId && !completed;
                return (
                  <StepChecklistItem
                    key={step.stepId}
                    step={step}
                    isSelected={isSelected}
                    environment={environment}
                    staging={staging}
                    result={result}
                    checkError={isSelected ? checkError : null}
                    checkPending={checkPending}
                    retryAfterSeconds={retryAfterSeconds}
                    isRevealing={isRevealing}
                    onSelectStep={onSelectStep}
                    onCheck={onCheck}
                    onRetryCheck={onRetryCheck}
                    onAdvance={onAdvance}
                    onRevealHint={onRevealHint}
                  />
                );
              })}
            </div>
          </div>
        )}

        {completed && nextItem ? (
          <div>
            <Button
              variant="primary"
              size="sm"
              iconName="arrow-right"
              iconPosition="right"
              onClick={() => onNavigate(nextItem.to)}
            >
              {nextItem.label}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default StepsPane;
