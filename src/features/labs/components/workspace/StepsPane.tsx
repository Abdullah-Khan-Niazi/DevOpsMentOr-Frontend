import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useLessonContext } from '@/features/curriculum/hooks/useCurriculum';
import { useLearnModuleItems } from '@/features/curriculum/hooks/useCurriculum';
import type { ModuleItemDto } from '@/features/curriculum/types';
import type { LabStepCheckResultDto, LabStepsStateDto } from '@/features/labs/types';
import { Button, EmptyState, IconButton, Skeleton } from '@/shared/components';
import { QUERY_KEYS, ROUTES } from '@/shared/constants';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { useRetryAfter } from '@/shared/hooks';
import { getErrorMessage, getStatusCode, hasCode } from '@/shared/services';
import { useLabSteps } from '../../hooks/useLabSteps';
import { HintsPanel } from './HintsPanel';
import { LabCompletePanel } from './LabCompletePanel';
import { ScenarioPanel } from './ScenarioPanel';
import { StepIndicator } from './StepIndicator';
import { StepPanel, type StepEnvironment, type StepPracticeResult } from './StepPanel';
import { StepResult } from './StepResult';

/** FE§4.4: a passed step stays on screen this long before the next step becomes current. */
const AUTO_ADVANCE_MS = 1_200;

export interface StepsPaneProps {
  labId: number;
  /** Module item id from `?itemId=`; null when the lab is opened outside a module. */
  itemId: number | null;
}

function environmentOf(instance: LabStepsStateDto['activeInstance']): StepEnvironment {
  if (instance === null) return 'none';
  if (instance.status === 'pending') return 'pending';
  if (instance.status === 'running') return 'running';
  return 'stopped';
}

/** Route of a module item: labs open with their item id, quizzes and lessons by their own ids. */
function itemPath(item: ModuleItemDto): string {
  if (item.kind === 'lab' && item.lab) {
    return `${ROUTES.LEARN_LAB.replace(':labId', String(item.lab.labId))}?itemId=${item.itemId}`;
  }
  if (item.kind === 'quiz' && item.quiz) {
    return ROUTES.LEARN_QUIZ.replace(':quizId', String(item.quiz.quizId));
  }
  return ROUTES.LEARN_LESSON.replace(':lessonId', String(item.itemId));
}

/**
 * Left pane of the lab workspace: lab header with step progress, the scenario, the current
 * (or a reviewed) step with its check, the result, hints and the completion panel.
 * Step state comes from `useLabSteps`; the page owns the layout and the access gate.
 */
export function StepsPane({ labId, itemId }: StepsPaneProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const labSteps = useLabSteps(labId);
  const lessonQuery = useLessonContext(itemId);
  const moduleId = lessonQuery.data?.moduleId ?? null;
  const itemsQuery = useLearnModuleItems(moduleId, moduleId !== null);

  // Step shown when it is not the current one (review of a passed step); null means current.
  const [viewingStepId, setViewingStepId] = useState<string | null>(null);
  // Outcome of the latest check, shown for the step it belongs to.
  const [result, setResult] = useState<LabStepCheckResultDto | null>(null);
  // Stage requests already fired per `instanceId:stepId`, so re-renders never stage twice.
  const stagedRef = useRef<string | null>(null);
  const checkRetry = useRetryAfter(labSteps.check.error);

  const state = labSteps.steps.data ?? null;
  const currentStepId = state?.currentStepId ?? null;
  const shownStepId = viewingStepId ?? result?.stepId ?? currentStepId;
  const shownStep = state?.steps.find((step) => step.stepId === shownStepId) ?? null;
  const readOnly = shownStep?.status === 'passed';
  const activeInstance = state?.activeInstance ?? null;
  const instanceId = activeInstance?.instanceId ?? null;
  const environment = environmentOf(activeInstance);

  const wantsStage =
    shownStep !== null &&
    shownStep.requiresStage &&
    !readOnly &&
    instanceId !== null &&
    environment === 'running' &&
    shownStep.stagedOnInstanceId !== instanceId;
  // Staging target of the shown step; null when no stage is needed.
  const stageStepId = wantsStage ? shownStepId : null;
  const stageKey =
    stageStepId !== null && instanceId !== null ? `${instanceId}:${stageStepId}` : null;
  const stageMutate = labSteps.stage.mutate;

  // Auto-stage the shown step once per instance and step (FE§4.4).
  useEffect(() => {
    if (stageKey === null || instanceId === null || stageStepId === null) return;
    if (stagedRef.current === stageKey) return;
    stagedRef.current = stageKey;
    stageMutate({ instanceId, stepId: stageStepId });
  }, [stageKey, instanceId, stageStepId, stageMutate]);

  // A passed step is shown for a moment, then the next step becomes current (FE§4.4).
  useEffect(() => {
    if (
      result === null ||
      !result.passed ||
      result.alreadyPassed ||
      result.labCompleted ||
      result.nextStepId === null ||
      viewingStepId !== null
    ) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      setResult(null);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [result, viewingStepId]);

  function advance() {
    setResult(null);
    setViewingStepId(null);
  }

  function handleSelect(stepId: string) {
    setViewingStepId(stepId === currentStepId ? null : stepId);
    setResult((previous) => (previous?.stepId === stepId ? previous : null));
  }

  function handleOutcome(outcome: LabStepCheckResultDto | null) {
    if (outcome === null) return;
    setResult(outcome);
    if (outcome.labCompleted && moduleId !== null) {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.learn.moduleItems(moduleId) });
    }
  }

  function handleCheck(answer?: string) {
    if (shownStep === null || instanceId === null) return;
    labSteps.check.mutate(
      { instanceId, stepId: shownStep.stepId, answer },
      { onSuccess: handleOutcome },
    );
  }

  function retryCheck() {
    const variables = labSteps.check.variables;
    if (!variables) return;
    labSteps.check.mutate(variables, { onSuccess: handleOutcome });
  }

  function retryStage() {
    if (stageKey === null || instanceId === null || stageStepId === null) return;
    stagedRef.current = stageKey;
    stageMutate({ instanceId, stepId: stageStepId });
  }

  async function revealHint(hintIndex: number) {
    if (shownStep === null) return;
    await labSteps.reveal.mutateAsync({ stepId: shownStep.stepId, hintIndex });
  }

  if (state === null) {
    return (
      <div
        role="status"
        aria-label="Loading lab steps"
        className="flex min-h-0 flex-1 flex-col gap-4 p-5"
      >
        <Skeleton className="h-8 w-2/3 rounded-md" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="min-h-0 flex-1 rounded-md" />
      </div>
    );
  }

  const completed = state.completedAt !== null && viewingStepId === null;
  const backTo =
    itemId !== null && moduleId !== null
      ? ROUTES.LEARN_MODULE.replace(':moduleId', String(moduleId))
      : ROUTES.LEARN;
  const backLabel = itemId !== null ? 'Back to module' : 'Back to Learn';

  const items = itemsQuery.data ?? [];
  const itemIndex = itemId === null ? -1 : items.findIndex((item) => item.itemId === itemId);
  const nextItem = itemIndex >= 0 ? (items[itemIndex + 1] ?? null) : null;

  const checkError = labSteps.check.variables?.stepId === shownStepId ? labSteps.check.error : null;
  const unreachable = hasCode(checkError, ERROR_CODES.LAB_ENV_UNREACHABLE);
  const rateLimited = getStatusCode(checkError) === 429;

  const stageError =
    wantsStage && labSteps.stage.isError && labSteps.stage.variables?.stepId === shownStepId
      ? labSteps.stage.error
      : null;

  const practiceResult: StepPracticeResult | null =
    result !== null && result.stepId === shownStepId && result.alreadyPassed
      ? result.passed
        ? 'passing'
        : 'not_passing'
      : null;
  const showResult =
    result !== null &&
    result.stepId === shownStepId &&
    !result.labCompleted &&
    (!result.alreadyPassed || !result.passed);

  return (
    <section aria-label="Lab steps" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-col gap-4 px-5 pt-5 pb-4">
        <div className="flex min-w-0 items-center gap-2">
          <IconButton icon="arrow-left" label={backLabel} onClick={() => navigate(backTo)} />
          <h1 className="m-0 min-w-0 truncate text-lg font-semibold tracking-tight text-card-foreground">
            {state.labName}
          </h1>
        </div>
        <StepIndicator
          steps={state.steps}
          currentStepId={currentStepId}
          viewingStepId={shownStepId}
          onSelect={handleSelect}
        />
        <p className="m-0 text-sm text-muted tabular-nums">
          {`Earned ${state.totals.pointsEarned} of ${state.totals.pointsAvailable} XP`}
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-1 pb-8">
        <ScenarioPanel markdown={state.scenarioIntro} defaultOpen={shownStep?.position === 1} />

        {state.steps.length === 0 ? (
          <EmptyState icon="lab" title="This lab has no steps yet" />
        ) : null}

        {completed && state.completedAt !== null ? (
          <LabCompletePanel
            completedAt={state.completedAt}
            completionBonus={state.completionBonus}
            totals={state.totals}
            graceExpiresAt={activeInstance?.expiresAt ?? null}
            next={nextItem ? { label: 'Next item', to: itemPath(nextItem) } : null}
            backTo={backTo}
          />
        ) : null}

        {!completed && shownStep !== null ? (
          <>
            <StepPanel
              key={shownStep.stepId}
              step={shownStep}
              environment={environment}
              staging={{
                pending: wantsStage && stageError === null,
                error: stageError,
                onRetry: retryStage,
              }}
              onCheck={handleCheck}
              checkPending={labSteps.isChecking}
              retryAfterSeconds={checkRetry.blocked ? checkRetry.secondsLeft : null}
              readOnly={readOnly}
              practiceResult={practiceResult}
            />

            {unreachable ? (
              <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-error">
                <span>The lab environment did not respond. Nothing was recorded.</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={retryCheck}
                  isLoading={labSteps.isChecking}
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

            {showResult ? <StepResult result={result} onNext={advance} /> : null}

            <HintsPanel
              key={shownStep.stepId}
              hints={shownStep.hints}
              pending={labSteps.isRevealing}
              onReveal={revealHint}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

export default StepsPane;
