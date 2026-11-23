import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CourseCompleteOverlay } from '@/features/curriculum/components/learn/CourseCompleteOverlay';
import { useCourseSequence, useLessonContext } from '@/features/curriculum/hooks';
import { AiMentorDrawer } from '@/features/labs/components/AiMentorDrawer';
import { MentorOrb, type MentorOrbState } from '@/features/labs/components/MentorOrb';
import { EnvironmentConflictDialog } from '@/features/labs/components/workspace/EnvironmentConflictDialog';
import { EnvironmentPane } from '@/features/labs/components/workspace/EnvironmentPane';
import type { EnvironmentPanelState } from '@/features/labs/components/workspace/EnvironmentPanel';
import { LabModuleOutlineModal } from '@/features/labs/components/workspace/LabModuleOutlineModal';
import { StepsPane } from '@/features/labs/components/workspace/StepsPane';
import { useLabEnvironment } from '@/features/labs/hooks/useLabEnvironment';
import { useLabDetail, useLabHealth } from '@/features/labs/hooks/useLabs';
import { useLabSteps } from '@/features/labs/hooks/useLabSteps';
import { labsService } from '@/features/labs/services';
import type { LabStepCheckResultDto, LabStepsStateDto } from '@/features/labs/types';
import { getNetLabEarnedXp } from '@/features/labs/utils/stepXp';
import type { StepEnvironment } from '@/features/labs/components/workspace/StepPanel';
import {
  Button,
  ConfirmDialog,
  Countdown,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  TabSwitcher,
  toast,
  type TabSwitcherItem,
} from '@/shared/components';
import { QUERY_KEYS, ROUTES } from '@/shared/constants';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { useRetryAfter } from '@/shared/hooks';
import { getStatusCode, hasCode } from '@/shared/services';
import { cn } from '@/shared/utils';
import { LabWorkspacePageSkeleton } from './LabWorkspacePageSkeleton';
import '../styles/labs.css';

type PaneId = 'steps' | 'environment';

const PANE_TABS: ReadonlyArray<TabSwitcherItem<PaneId>> = [
  { id: 'steps', label: 'Steps', icon: 'checklist' },
  { id: 'environment', label: 'Environment', icon: 'terminal' },
];

const SPLIT_MIN = 24;
const SPLIT_MAX = 60;
const SPLIT_DEFAULT = 34;
const SPLIT_KEY_STEP = 2;
const SPLIT_STORAGE_KEY = 'lab-split';
const WARN_BELOW_SECONDS = 5 * 60;
const AUTO_ADVANCE_MS = 1_200;
const AUTO_PROCEED_ITEM_MS = 1_400;
const UNMOUNT_TEARDOWN_DELAY_MS = 150;

/**
 * Module-scoped teardown timers absorb React 18 StrictMode double-mounts in dev
 * while ensuring real route departures cleanly terminate the container sandbox.
 */
const pendingTeardowns = new Map<number, number>();

function clampSplit(value: number): number {
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, value));
}

function readStoredSplit(): number {
  try {
    const raw = window.localStorage.getItem(SPLIT_STORAGE_KEY);
    const value = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(value) ? clampSplit(value) : SPLIT_DEFAULT;
  } catch {
    return SPLIT_DEFAULT;
  }
}

function storeSplit(value: number): void {
  try {
    window.localStorage.setItem(SPLIT_STORAGE_KEY, String(value));
  } catch {
    // Storage unavailable: the split is simply not remembered.
  }
}

function parseItemId(raw: string | null): number | null {
  const parsed = raw === null ? Number.NaN : Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function environmentOf(instance: LabStepsStateDto['activeInstance']): StepEnvironment {
  if (instance === null) return 'none';
  if (instance.status === 'pending') return 'pending';
  if (instance.status === 'running') return 'running';
  return 'stopped';
}

interface LabGateProps {
  error: unknown;
  offline?: boolean;
  retrying?: boolean;
  onRetry: () => void;
}

function LabGate({ error, offline = false, retrying = false, onRetry }: LabGateProps) {
  const navigate = useNavigate();
  const back = (
    <Button variant="secondary" iconName="arrow-left" onClick={() => navigate(ROUTES.LEARN)}>
      Back to Learn
    </Button>
  );

  let body: ReactNode;
  if (offline || hasCode(error, ERROR_CODES.LAB_ENV_UNREACHABLE)) {
    body = (
      <EmptyState
        icon="lab"
        title="Lab runtime is offline"
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              iconName="refresh"
              isLoading={retrying}
              loadingLabel="Checking lab runtime…"
              onClick={onRetry}
            >
              Retry connection
            </Button>
            {back}
          </div>
        }
      />
    );
  } else if (error === null) {
    body = <EmptyState icon="lab" title="Lab not found" action={back} />;
  } else if (hasCode(error, ERROR_CODES.LAB_NOT_READY, ERROR_CODES.LAB_MISCONFIGURED)) {
    body = <EmptyState icon="lab" title="This lab is not available yet" action={back} />;
  } else if (hasCode(error, ERROR_CODES.LAB_NOT_FOUND)) {
    body = <EmptyState icon="lab" title="Lab not found" action={back} />;
  } else if (hasCode(error, ERROR_CODES.LAB_ACCESS_DENIED)) {
    body = <EmptyState icon="lock" title="Upgrade to access this lab" action={back} />;
  } else if (hasCode(error, ERROR_CODES.COURSE_ACCESS_DENIED)) {
    body = <EmptyState icon="lock" title="You do not have access to this course" action={back} />;
  } else if (getStatusCode(error) === 403) {
    body = <EmptyState icon="lock" title="You do not have access to this lab" action={back} />;
  } else {
    body = (
      <div className="flex flex-col items-center gap-4">
        <ErrorState error={error} onRetry={onRetry} />
        {back}
      </div>
    );
  }

  return <div className="flex min-h-0 flex-1 items-center justify-center p-6">{body}</div>;
}

/**
 * DataCamp-style full-screen interactive lab workspace (`/learn/labs/:labId?itemId=`):
 * - Auto-starts lab environment on entry when runtime is available
 * - Auto-terminates active sandbox on leaving page, closing tab, or closing browser
 * - Top bar: Exit + single title left, `← | Outline | →` center, timer + net earned XP right
 * - Left collapsible Scenario & Steps panel showing total lab XP (after permanent hint deductions)
 * - Right persistent dark terminal / slides / walkthrough studio with Run Checks & segmented pills
 * - Floating bottom-right particle-X AI Mentor orb + dark smoked frosted-glass floating drawer
 */
export function LearnLabPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { labId: labIdParam = '' } = useParams<{ labId: string }>();
  const [searchParams] = useSearchParams();
  const labId = Number(labIdParam);
  const validLab = Number.isInteger(labId) && labId > 0;
  const itemId = parseItemId(searchParams.get('itemId'));

  const lessonQuery = useLessonContext(itemId);
  const moduleId = lessonQuery.data?.moduleId ?? null;
  const sequence = useCourseSequence({
    courseId: lessonQuery.data?.courseId ?? null,
    moduleId,
    currentItemId: itemId,
    currentLabId: validLab ? labId : null,
    enabled: validLab,
  });

  const labHealth = useLabHealth(validLab);
  const runtimeAvailable = labHealth.data?.available === true;

  const detail = useLabDetail(labIdParam, validLab);
  const labSteps = useLabSteps(labId, validLab && runtimeAvailable);
  const env = useLabEnvironment(labId, validLab && runtimeAvailable);

  const [split, setSplit] = useState(readStoredSplit);
  const [guideCollapsed, setGuideCollapsed] = useState(false);
  const [pane, setPane] = useState<PaneId>('steps');
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorBotState, setMentorBotState] = useState<MentorOrbState>('rest');
  const [fabHovered, setFabHovered] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [elapsedFor, setElapsedFor] = useState<string | null>(null);
  const [completedLabId, setCompletedLabId] = useState<number | null>(null);
  const justCompletedLab = completedLabId === labId;

  const [viewingStepState, setViewingStepState] = useState<{
    labId: number;
    stepId: string | null;
  }>({
    labId,
    stepId: null,
  });
  const [resultState, setResultState] = useState<{
    labId: number;
    outcome: LabStepCheckResultDto | null;
  }>({ labId, outcome: null });

  const viewingStepId = viewingStepState.labId === labId ? viewingStepState.stepId : null;
  const result = resultState.labId === labId ? resultState.outcome : null;

  const setViewingStepId = useCallback(
    (stepId: string | null) => setViewingStepState({ labId, stepId }),
    [labId],
  );
  const setResult = useCallback(
    (
      next:
        | LabStepCheckResultDto
        | null
        | ((prev: LabStepCheckResultDto | null) => LabStepCheckResultDto | null),
    ) => {
      setResultState((current) => {
        const currentOutcome = current.labId === labId ? current.outcome : null;
        const outcome = typeof next === 'function' ? next(currentOutcome) : next;
        return { labId, outcome };
      });
    },
    [labId],
  );

  const autoStartedForLabRef = useRef<number | null>(null);
  const userStoppedRef = useRef(false);
  const restartOfRef = useRef<number | null>(null);
  const stagedRef = useRef<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const activeInstanceIdRef = useRef<number | null>(null);
  const terminatedIdsRef = useRef<Set<number>>(new Set());
  const navigateAwayRef = useRef<(to: string) => void>(() => undefined);
  const checkRetry = useRetryAfter(labSteps.check.error);

  const instance = env.instance;
  const expiresAt = instance?.expiresAt ?? null;
  const expired = expiresAt !== null && elapsedFor === expiresAt;
  const isLiveInstance =
    instance !== null &&
    !expired &&
    (instance.status === 'running' || instance.status === 'pending');
  const refetchActive = env.refetch;
  const endError = env.endError;
  const isEnding = env.isEnding;
  const start = env.start;

  useEffect(() => {
    activeInstanceIdRef.current = isLiveInstance ? instance.instanceId : null;
  }, [isLiveInstance, instance]);

  const terminateOnce = useCallback(
    (instanceId: number | null) => {
      if (instanceId === null || terminatedIdsRef.current.has(instanceId)) return;
      terminatedIdsRef.current.add(instanceId);
      labsService.terminateInstanceKeepalive(instanceId);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.activeInstance });
    },
    [queryClient],
  );

  // Auto-start when entering the workspace with runtime online and no conflicting session.
  useEffect(() => {
    if (!validLab || !runtimeAvailable || env.isLoading) return;
    if (userStoppedRef.current || autoStartedForLabRef.current === labId) return;
    if (
      env.instance === null &&
      env.otherInstance === null &&
      !env.isStarting &&
      !env.error &&
      !env.activeError
    ) {
      autoStartedForLabRef.current = labId;
      start();
    }
  }, [
    validLab,
    runtimeAvailable,
    env.isLoading,
    env.instance,
    env.otherInstance,
    env.isStarting,
    env.error,
    env.activeError,
    labId,
    start,
  ]);

  // Reset per-lab refs cleanly when navigating between labs.
  useEffect(() => {
    userStoppedRef.current = false;
    stagedRef.current = null;
  }, [labId]);

  // Auto-terminate active sandbox when leaving the page, closing the tab, or closing the browser.
  useEffect(() => {
    const existingPending = pendingTeardowns.get(labId);
    if (existingPending !== undefined) {
      window.clearTimeout(existingPending);
      pendingTeardowns.delete(labId);
    }

    const handlePageExit = () => {
      terminateOnce(activeInstanceIdRef.current);
    };

    window.addEventListener('pagehide', handlePageExit);
    window.addEventListener('beforeunload', handlePageExit);

    return () => {
      window.removeEventListener('pagehide', handlePageExit);
      window.removeEventListener('beforeunload', handlePageExit);
      const id = activeInstanceIdRef.current;
      if (id !== null) {
        const timer = window.setTimeout(() => {
          pendingTeardowns.delete(labId);
          terminateOnce(id);
        }, UNMOUNT_TEARDOWN_DELAY_MS);
        pendingTeardowns.set(labId, timer);
      }
    };
  }, [labId, terminateOnce]);

  // Mark instance expired when its server deadline elapses.
  useEffect(() => {
    if (expiresAt === null) return undefined;
    const id = window.setTimeout(
      () => {
        setElapsedFor(expiresAt);
        void refetchActive();
      },
      Math.max(0, Date.parse(expiresAt) - Date.now()),
    );
    return () => window.clearTimeout(id);
  }, [expiresAt, refetchActive]);

  // Restart flow after terminating a stopped/expired instance.
  useEffect(() => {
    if (restartOfRef.current === null || isEnding) return;
    if (instance === null) {
      restartOfRef.current = null;
      start();
    }
  }, [instance, isEnding, start]);

  useEffect(() => {
    if (endError) restartOfRef.current = null;
  }, [endError]);

  // Step state & auto-stage / auto-advance mechanics
  const stepState = labSteps.steps.data ?? null;
  const currentStepId = stepState?.currentStepId ?? null;
  const shownStepId = viewingStepId ?? result?.stepId ?? currentStepId;
  const shownStep = stepState?.steps.find((step) => step.stepId === shownStepId) ?? null;
  const readOnly = shownStep?.status === 'passed';
  const stepInstance = stepState?.activeInstance ?? null;
  const stepInstanceId = stepInstance?.instanceId ?? null;
  const stepEnvironment = environmentOf(stepInstance);

  const wantsStage =
    shownStep !== null &&
    shownStep.requiresStage &&
    !readOnly &&
    stepInstanceId !== null &&
    stepEnvironment === 'running' &&
    shownStep.stagedOnInstanceId !== stepInstanceId;
  const stageStepId = wantsStage ? shownStepId : null;
  const stageKey =
    stageStepId !== null && stepInstanceId !== null ? `${stepInstanceId}:${stageStepId}` : null;
  const stageMutate = labSteps.stage.mutate;

  useEffect(() => {
    if (stageKey === null || stepInstanceId === null || stageStepId === null) return;
    if (stagedRef.current === stageKey) return;
    stagedRef.current = stageKey;
    stageMutate({ instanceId: stepInstanceId, stepId: stageStepId });
  }, [stageKey, stepInstanceId, stageStepId, stageMutate]);

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
  }, [result, viewingStepId, setResult]);

  function advanceStep() {
    setResult(null);
    setViewingStepId(null);
  }

  function handleSelectStep(stepId: string) {
    setViewingStepId(stepId === currentStepId ? null : stepId);
    setResult((previous) => (previous?.stepId === stepId ? previous : null));
  }

  function handleCheckOutcome(outcome: LabStepCheckResultDto | null) {
    if (outcome === null) return;
    setResult(outcome);
    if (outcome.labCompleted) {
      if (moduleId !== null) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.learn.moduleItems(moduleId) });
      }
      if (!outcome.alreadyPassed) {
        setCompletedLabId(labId);
      }
    }
  }

  function handleCheck(answer?: string) {
    if (shownStep === null || stepInstanceId === null) return;
    labSteps.check.mutate(
      { instanceId: stepInstanceId, stepId: shownStep.stepId, answer },
      { onSuccess: handleCheckOutcome },
    );
  }

  function retryCheck() {
    const variables = labSteps.check.variables;
    if (!variables) return;
    labSteps.check.mutate(variables, { onSuccess: handleCheckOutcome });
  }

  function retryStage() {
    if (stageKey === null || stepInstanceId === null || stageStepId === null) return;
    stagedRef.current = stageKey;
    stageMutate({ instanceId: stepInstanceId, stepId: stageStepId });
  }

  async function revealHint(hintIndex: number) {
    if (shownStep === null) return;
    await labSteps.reveal.mutateAsync({ stepId: shownStep.stepId, hintIndex });
  }

  function updateSplit(next: number) {
    setSplit(clampSplit(next));
  }

  function handleSeparatorPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    updateSplit(((event.clientX - rect.left) / rect.width) * 100);
  }

  function handleSeparatorPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    storeSplit(split);
  }

  function handleSeparatorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let next: number;
    switch (event.key) {
      case 'ArrowLeft':
        next = split - SPLIT_KEY_STEP;
        break;
      case 'ArrowRight':
        next = split + SPLIT_KEY_STEP;
        break;
      case 'Home':
        next = SPLIT_MIN;
        break;
      case 'End':
        next = SPLIT_MAX;
        break;
      default:
        return;
    }
    event.preventDefault();
    const clamped = clampSplit(next);
    updateSplit(clamped);
    storeSplit(clamped);
  }

  const navigateAway = useCallback(
    (to: string) => {
      userStoppedRef.current = true;
      const id = activeInstanceIdRef.current;
      if (id !== null) {
        const pending = pendingTeardowns.get(labId);
        if (pending !== undefined) {
          window.clearTimeout(pending);
          pendingTeardowns.delete(labId);
        }
        terminateOnce(id);
      }
      navigate(to);
    },
    [labId, terminateOnce, navigate],
  );

  useEffect(() => {
    navigateAwayRef.current = navigateAway;
  }, [navigateAway]);

  // Auto-proceed to the next course item when completing a lab (last item uses CourseCompleteOverlay).
  useEffect(() => {
    if (!justCompletedLab || !sequence.ready || !sequence.nextItem) return undefined;
    toast.success(
      sequence.nextItem.crossesModule
        ? 'Module complete — opening next module…'
        : 'Lab complete — opening next item…',
    );
    const target = sequence.nextItem.to;
    const timer = window.setTimeout(() => {
      navigateAwayRef.current(target);
    }, AUTO_PROCEED_ITEM_MS);
    return () => window.clearTimeout(timer);
  }, [justCompletedLab, sequence.ready, sequence.nextItem]);

  if (
    validLab &&
    (labHealth.isLoading || (runtimeAvailable && (detail.isLoading || labSteps.steps.isLoading)))
  ) {
    return <LabWorkspacePageSkeleton />;
  }

  const runtimeOffline = validLab && (labHealth.isError || labHealth.data?.available === false);
  const gateError = validLab ? (detail.error ?? labSteps.steps.error) : null;
  if (!validLab || runtimeOffline || gateError) {
    return (
      <LabGate
        error={validLab ? gateError : null}
        offline={runtimeOffline || hasCode(gateError, ERROR_CODES.LAB_ENV_UNREACHABLE)}
        retrying={labHealth.isFetching || detail.isFetching || labSteps.steps.isFetching}
        onRetry={() => {
          void labHealth.refetch();
          if (runtimeAvailable) {
            void detail.refetch();
            void labSteps.steps.refetch();
          }
        }}
      />
    );
  }

  let panelState: EnvironmentPanelState;
  if (instance !== null) {
    if (expired) panelState = 'stopped';
    else if (instance.status === 'pending') panelState = env.timedOut ? 'timeout' : 'pending';
    else if (instance.status === 'running')
      panelState = instance.terminalWsUrl ? 'running' : 'reconnecting';
    else if (instance.status === 'error') panelState = 'error';
    else panelState = 'stopped';
  } else if (env.error !== null || env.activeError) {
    panelState = 'error';
  } else if (env.isStarting) {
    panelState = 'pending';
  } else {
    panelState = 'none';
  }

  const conflictDialogOpen = conflictOpen || env.startResult?.kind === 'conflict';

  function closeConflict() {
    setConflictOpen(false);
    env.dismissConflict();
  }

  function handleStart() {
    userStoppedRef.current = false;
    if (env.conflict) {
      setConflictOpen(true);
      return;
    }
    env.start();
  }

  function restart() {
    userStoppedRef.current = false;
    if (instance === null) return;
    restartOfRef.current = instance.instanceId;
    env.end(instance.instanceId);
  }

  function retryEnvironment() {
    if (env.timedOut) {
      env.retryWait();
      return;
    }
    if (instance === null) {
      env.start();
      return;
    }
    env.reconnect();
    void env.refetch();
  }

  const backTo =
    itemId !== null && moduleId !== null
      ? ROUTES.LEARN_MODULE.replace(':moduleId', String(moduleId))
      : ROUTES.LEARN;
  const backLabel = itemId !== null ? 'Exit to module' : 'Exit to Learn';
  const labTitle = detail.data?.labName ?? stepState?.labName ?? 'Lab Workspace';

  const prevItem = sequence.prevItem;
  const nextItem = sequence.nextItem;
  const nextItemLink = nextItem ? { label: 'Next item', to: nextItem.to } : null;

  const needsStage = Boolean(shownStep?.requiresStage && !readOnly);
  const stagedReady =
    !needsStage ||
    (shownStep?.stagedOnInstanceId !== null &&
      !(wantsStage && labSteps.stage.error === null) &&
      labSteps.stage.error === null);
  const canRunCheck = stepEnvironment === 'running' && stagedReady && !checkRetry.blocked;
  const stageError =
    wantsStage && labSteps.stage.isError && labSteps.stage.variables?.stepId === shownStepId
      ? labSteps.stage.error
      : null;

  const earnedXp = stepState ? getNetLabEarnedXp(stepState.totals) : 0;

  return (
    <div
      data-testid="unified-lab-workspace"
      className="fixed inset-0 z-(--z-workspace) flex min-h-0 flex-col bg-paper text-card-foreground"
    >
      {/* DataCamp Top Studio Header */}
      <header className="relative flex h-12 shrink-0 items-center justify-between border-b border-border bg-pearl-100 px-4">
        {/* Left: Exit Arrow + Lab Title */}
        <div className="z-10 flex max-w-[34%] min-w-0 items-center gap-2">
          <IconButton
            icon="arrow-left"
            label={backLabel}
            size="sm"
            onClick={() => {
              if (isLiveInstance) {
                setConfirmEndOpen(true);
              } else {
                navigateAway(backTo);
              }
            }}
          />
          <h1 className="m-0 min-w-0 truncate text-xs font-semibold tracking-tight text-card-foreground sm:text-sm">
            {labTitle}
          </h1>
        </div>

        {/* Center: Navigation Pill [ ← | ≡ Outline | → ] */}
        <div className="absolute left-1/2 z-20 hidden -translate-x-1/2 items-center sm:flex">
          <nav className="lab-nav-pill" aria-label="Course item navigation">
            <button
              type="button"
              disabled={!prevItem}
              title={prevItem ? `Previous: ${prevItem.title}` : 'No previous item'}
              aria-label="Previous item"
              onClick={() => prevItem && navigateAway(prevItem.to)}
              className="lab-nav-pill__btn"
            >
              <Icon name="arrow-left" size={14} />
            </button>
            <button
              type="button"
              onClick={() => setOutlineOpen(true)}
              className="lab-nav-pill__btn lab-nav-pill__btn--outline"
              title="Open course outline"
            >
              <Icon name="menu" size={14} />
              <span>Outline</span>
            </button>
            <button
              type="button"
              disabled={!nextItem}
              title={nextItem ? `Next: ${nextItem.title}` : 'No next item'}
              aria-label="Next item"
              onClick={() => nextItem && navigateAway(nextItem.to)}
              className="lab-nav-pill__btn"
            >
              <Icon name="arrow-right" size={14} />
            </button>
          </nav>
        </div>

        {/* Right: Session Controls + Current Lab Earned XP */}
        <div className="z-10 ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {panelState === 'running' && instance !== null ? (
            <>
              {instance.expiresAt ? (
                <div className="flex items-center gap-1.5 font-mono text-caption text-muted">
                  <span className="hidden md:inline">TIME:</span>
                  <Countdown
                    until={instance.expiresAt}
                    label="Time left"
                    warnBelowSeconds={WARN_BELOW_SECONDS}
                  />
                </div>
              ) : null}
              <IconButton
                icon="timer"
                label="Extend lab environment"
                size="sm"
                isLoading={env.isExtending}
                onClick={() => env.extend(instance.instanceId)}
              />
              <IconButton
                icon="refresh"
                label="Reconnect terminal"
                size="sm"
                onClick={env.reconnect}
              />
            </>
          ) : panelState === 'pending' ? (
            <div className="flex items-center gap-2 font-mono text-xs text-card-foreground">
              <span className="lab-signal-ping" aria-hidden="true" />
              <span className="hidden md:inline">Bootstrapping Sandbox…</span>
            </div>
          ) : panelState === 'none' || panelState === 'stopped' ? (
            <Button
              variant="primary"
              size="sm"
              iconName="play"
              isLoading={env.isStarting}
              loadingLabel="Starting…"
              onClick={handleStart}
              className="h-7 px-2.5 font-mono text-xs"
            >
              Start Sandbox
            </Button>
          ) : null}

          <span
            className="hidden font-mono text-caption font-semibold text-card-foreground tabular-nums sm:inline"
            title="XP earned in this lab"
          >
            {`${earnedXp} XP`}
          </span>
        </div>
      </header>

      {/* Mobile Pane Switcher */}
      <div className="shrink-0 px-4 pt-2 pb-1 lg:hidden">
        <TabSwitcher
          items={PANE_TABS}
          value={pane}
          onChange={setPane}
          ariaLabel="Lab workspace panes"
        />
      </div>

      {/* Main 2-Pane Split */}
      <div ref={rowRef} className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        {!guideCollapsed ? (
          <>
            <div
              aria-hidden={pane === 'environment'}
              className={cn(
                'flex min-h-0 min-w-0 flex-col border-r border-border transition-opacity duration-(--duration-fast) ease-(--ease-apple-out) max-lg:absolute max-lg:inset-0 lg:w-(--lab-split) lg:shrink-0',
                pane === 'environment'
                  ? 'max-lg:invisible max-lg:z-0 max-lg:opacity-0 max-lg:pointer-events-none'
                  : 'max-lg:visible max-lg:z-10 max-lg:opacity-100 max-lg:pointer-events-auto',
              )}
              style={{ '--lab-split': `${split}%` } as CSSProperties}
            >
              {stepState ? (
                <StepsPane
                  state={stepState}
                  shownStepId={shownStepId}
                  environment={stepEnvironment}
                  staging={{
                    pending: wantsStage && stageError === null,
                    error: stageError,
                    onRetry: retryStage,
                  }}
                  result={result}
                  checkError={
                    labSteps.check.variables?.stepId === shownStepId ? labSteps.check.error : null
                  }
                  checkPending={labSteps.isChecking}
                  retryAfterSeconds={checkRetry.blocked ? checkRetry.secondsLeft : null}
                  isRevealing={labSteps.isRevealing}
                  nextItem={nextItemLink}
                  backTo={backTo}
                  onSelectStep={handleSelectStep}
                  onCheck={handleCheck}
                  onRetryCheck={retryCheck}
                  onAdvance={advanceStep}
                  onRevealHint={revealHint}
                  onCollapseGuide={() => setGuideCollapsed(true)}
                  onNavigate={navigateAway}
                />
              ) : null}
            </div>

            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize panes"
              aria-valuemin={SPLIT_MIN}
              aria-valuemax={SPLIT_MAX}
              aria-valuenow={Math.round(split)}
              tabIndex={0}
              onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
              onPointerMove={handleSeparatorPointerMove}
              onPointerUp={handleSeparatorPointerUp}
              onPointerCancel={handleSeparatorPointerUp}
              onKeyDown={handleSeparatorKeyDown}
              className="hidden w-1 shrink-0 cursor-col-resize touch-none bg-paper-line/50 transition-colors hover:bg-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 lg:block"
            />
          </>
        ) : null}

        <div
          aria-hidden={pane === 'steps' && !guideCollapsed}
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col transition-opacity duration-(--duration-fast) ease-(--ease-apple-out) max-lg:absolute max-lg:inset-0',
            pane === 'steps' && !guideCollapsed
              ? 'max-lg:invisible max-lg:z-0 max-lg:opacity-0 max-lg:pointer-events-none'
              : 'max-lg:visible max-lg:z-10 max-lg:opacity-100 max-lg:pointer-events-auto',
          )}
        >
          <EnvironmentPane
            labId={labId}
            itemId={itemId}
            env={env}
            panelState={panelState}
            expired={expired}
            steps={stepState?.steps ?? []}
            currentStepId={currentStepId}
            shownStepId={shownStepId}
            shownStep={shownStep}
            completed={Boolean(stepState?.completedAt !== null && shownStep === null)}
            hasRunCheck={Boolean(result && result.stepId === shownStepId)}
            checkPending={labSteps.isChecking}
            canRunCheck={canRunCheck}
            guideCollapsed={guideCollapsed}
            nextItem={nextItemLink}
            onExpandGuide={() => setGuideCollapsed(false)}
            onSelectStep={handleSelectStep}
            onRunCheck={() => handleCheck()}
            onNavigate={navigateAway}
            onStart={handleStart}
            onRestart={restart}
            onRetry={retryEnvironment}
            onOpenConflict={() => setConflictOpen(true)}
            showInlineToolbar={false}
          />
        </div>
      </div>

      {/* Floating Bottom-Right Particle-X AI Mentor Trigger */}
      <button
        type="button"
        onClick={() => setMentorOpen((open) => !open)}
        onMouseEnter={() => setFabHovered(true)}
        onMouseLeave={() => setFabHovered(false)}
        className="lab-mentor-fab"
        data-tooltip={mentorOpen ? 'Close AI Mentor' : 'AI Mentor'}
        aria-label={mentorOpen ? 'Close AI Mentor' : 'AI Mentor'}
        aria-haspopup="dialog"
        aria-expanded={mentorOpen}
        aria-pressed={mentorOpen}
      >
        <MentorOrb
          state={mentorOpen ? mentorBotState : fabHovered ? 'doodling' : mentorBotState}
          hovered={fabHovered}
          size="md"
        />
      </button>

      <AiMentorDrawer
        open={mentorOpen}
        onClose={() => {
          setMentorOpen(false);
          setMentorBotState('rest');
        }}
        onBotStateChange={setMentorBotState}
        labId={labId}
        lessonId={itemId ?? undefined}
      />

      <LabModuleOutlineModal
        open={outlineOpen}
        onClose={() => setOutlineOpen(false)}
        courseId={sequence.resolvedCourseId}
        moduleId={moduleId}
        activeItemId={itemId}
        activeLabId={validLab ? labId : null}
        onNavigateItem={navigateAway}
      />

      <CourseCompleteOverlay
        open={justCompletedLab && sequence.ready && sequence.isLastItemInCourse}
        courseTitle={sequence.courseTitle}
        onContinue={() =>
          navigateAway(
            sequence.resolvedCourseId
              ? `${ROUTES.LEARN}?completedCourse=${sequence.resolvedCourseId}`
              : ROUTES.LEARN,
          )
        }
      />

      <ConfirmDialog
        open={confirmEndOpen}
        title="Exit and terminate sandbox session?"
        message="Leaving this lab ends your active container environment. You can resume your saved steps anytime."
        confirmLabel="Exit Sandbox"
        tone="danger"
        isLoading={env.isEnding}
        onCancel={() => setConfirmEndOpen(false)}
        onConfirm={() => {
          setConfirmEndOpen(false);
          navigateAway(backTo);
        }}
      />

      <EnvironmentConflictDialog
        open={conflictDialogOpen}
        otherLabName={env.otherInstance?.labName ?? 'Another lab'}
        onConfirm={() => env.replaceConflict()}
        onClose={closeConflict}
      />
    </div>
  );
}

export default LearnLabPage;
