import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { applyXpDelta, hasCode, isTimeoutError } from '@/shared/services';
import { labsService } from '../services';
import type {
  HintRevealResultDto,
  LabStepCheckResultDto,
  LabStepStageResultDto,
  LabStepsStateDto,
} from '../types';

/** FE§4.4: another tab holds the stage mutex; wait, then read the state it produced. */
const STAGE_IN_PROGRESS_WAIT_MS = 2_000;
/** C§4.1 stage mutex TTL (90 s): after that the other stage either landed or was abandoned. */
const STAGE_IN_PROGRESS_MAX_WAIT_MS = 90_000;

export interface StageStepInput {
  instanceId: number;
  stepId: string;
}

export interface CheckStepInput {
  instanceId: number;
  stepId: string;
  /** Question steps only (1..500 characters). */
  answer?: string;
}

export interface RevealHintInput {
  stepId: string;
  hintIndex: number;
}

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * State-drift codes: the cached step state no longer matches the server, so refetch it.
 * Instance codes also invalidate the active instance (C§0.1, FE§4.4).
 */
function handleStateDrift(queryClient: QueryClient, labId: number, error: unknown): void {
  if (
    hasCode(
      error,
      ERROR_CODES.STEP_LOCKED,
      ERROR_CODES.STEP_ALREADY_PASSED,
      ERROR_CODES.HINT_OUT_OF_ORDER,
    )
  ) {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.steps(labId) });
    return;
  }
  if (hasCode(error, ERROR_CODES.INSTANCE_NOT_RUNNING, ERROR_CODES.INSTANCE_NOT_FOUND)) {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.activeInstance });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.steps(labId) });
  }
}

/** A client timeout does not mean the server failed: the result may already be recorded. */
function refreshAfterUnknownOutcome(queryClient: QueryClient, labId: number): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.steps(labId) }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.activeInstance }),
  ]);
}

/** Runs `run`; a client timeout refetches state and resolves `null` instead of failing. */
async function settleTimeout<T>(
  queryClient: QueryClient,
  labId: number,
  run: () => Promise<T>,
): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    if (isTimeoutError(error)) {
      await refreshAfterUnknownOutcome(queryClient, labId);
      return null;
    }
    throw error;
  }
}

function markStaged(state: LabStepsStateDto, stepId: string, instanceId: number): LabStepsStateDto {
  return {
    ...state,
    steps: state.steps.map((step) =>
      step.stepId === stepId ? { ...step, stagedOnInstanceId: instanceId } : step,
    ),
  };
}

/** Passed step becomes `passed`, the next step becomes `current`; totals move by the award. */
function applyPass(state: LabStepsStateDto, result: LabStepCheckResultDto): LabStepsStateDto {
  const passedAt = new Date().toISOString();
  return {
    ...state,
    steps: state.steps.map((step) => {
      if (step.stepId === result.stepId) {
        return { ...step, status: 'passed', pointsAwarded: result.pointsAwarded, passedAt };
      }
      if (
        result.nextStepId !== null &&
        step.stepId === result.nextStepId &&
        step.status === 'locked'
      ) {
        return { ...step, status: 'current' };
      }
      return step;
    }),
    currentStepId: result.nextStepId,
    completedAt: result.completion?.completedAt ?? state.completedAt,
    totals: {
      ...state.totals,
      pointsEarned: state.totals.pointsEarned + result.pointsAwarded,
    },
  };
}

function applyHintReveal(state: LabStepsStateDto, result: HintRevealResultDto): LabStepsStateDto {
  return {
    ...state,
    steps: state.steps.map((step) => {
      if (step.stepId !== result.stepId) return step;
      const alreadyShown = step.hints.revealed.some((hint) => hint.hintIndex === result.hintIndex);
      const revealed = alreadyShown
        ? step.hints.revealed
        : [...step.hints.revealed, { hintIndex: result.hintIndex, text: result.text }].sort(
            (a, b) => a.hintIndex - b.hintIndex,
          );
      const shownIndexes = new Set(revealed.map((hint) => hint.hintIndex));
      let nextHintIndex: number | null = null;
      for (let index = 0; index < step.hints.total; index += 1) {
        if (!shownIndexes.has(index)) {
          nextHintIndex = index;
          break;
        }
      }
      return { ...step, hints: { ...step.hints, revealed, nextHintIndex } };
    }),
    totals: {
      ...state.totals,
      hintPenalties:
        state.totals.hintPenalties + (result.alreadyRevealed ? 0 : result.penaltyApplied),
    },
  };
}

/** Learner step state of one lab and its stage, check and hint-reveal mutations (FE§4.4). */
export function useLabSteps(labId: number, enabled = true) {
  const queryClient = useQueryClient();
  const stepsKey = QUERY_KEYS.labs.steps(labId);
  const isEnabled = enabled && Number.isInteger(labId) && labId > 0;

  const steps = useQuery({
    queryKey: stepsKey,
    queryFn: () => labsService.getSteps(labId),
    enabled: isEnabled,
    retry: false,
  });

  const stage = useMutation({
    mutationFn: async ({
      instanceId,
      stepId,
    }: StageStepInput): Promise<LabStepStageResultDto | null> => {
      try {
        return await labsService.stageStep(instanceId, stepId);
      } catch (error) {
        if (hasCode(error, ERROR_CODES.STEP_STAGE_IN_PROGRESS)) {
          // Another tab holds the stage mutex: poll the step state (no rate limit) until that
          // stage is recorded on this instance. If it never lands, surface the error for retry.
          for (let waited = 0; waited < STAGE_IN_PROGRESS_MAX_WAIT_MS;) {
            await sleep(STAGE_IN_PROGRESS_WAIT_MS);
            waited += STAGE_IN_PROGRESS_WAIT_MS;
            const state = await queryClient.fetchQuery({
              queryKey: stepsKey,
              queryFn: () => labsService.getSteps(labId),
              staleTime: 0,
            });
            const staged = state.steps.find((step) => step.stepId === stepId);
            if (staged?.stagedOnInstanceId === instanceId) return null;
          }
          throw error;
        }
        if (isTimeoutError(error)) {
          await refreshAfterUnknownOutcome(queryClient, labId);
          return null;
        }
        throw error;
      }
    },
    onSuccess: (result, { stepId }) => {
      if (result) {
        queryClient.setQueryData<LabStepsStateDto>(stepsKey, (old) =>
          old ? markStaged(old, stepId, result.instanceId) : old,
        );
      }
      void queryClient.invalidateQueries({ queryKey: stepsKey });
    },
    onError: (error) => handleStateDrift(queryClient, labId, error),
  });

  const check = useMutation({
    mutationFn: ({ instanceId, stepId, answer }: CheckStepInput) =>
      settleTimeout(queryClient, labId, async (): Promise<LabStepCheckResultDto> => {
        try {
          return await labsService.checkStep(instanceId, stepId, answer);
        } catch (error) {
          // STEP_NOT_STAGED: stage once, then retry the check once. Other errors surface.
          if (!hasCode(error, ERROR_CODES.STEP_NOT_STAGED)) throw error;
          const staged = await labsService.stageStep(instanceId, stepId);
          queryClient.setQueryData<LabStepsStateDto>(stepsKey, (old) =>
            old ? markStaged(old, stepId, staged.instanceId) : old,
          );
          return labsService.checkStep(instanceId, stepId, answer);
        }
      }),
    onSuccess: (result) => {
      if (!result) return;
      applyXpDelta(queryClient, result.xp);
      if (result.passed && !result.alreadyPassed) {
        queryClient.setQueryData<LabStepsStateDto>(stepsKey, (old) =>
          old ? applyPass(old, result) : old,
        );
      }
      void queryClient.invalidateQueries({ queryKey: stepsKey });
      if (result.labCompleted) {
        // FE§4.4 completion: lab items were completed server-side; rollups and the pointer moved.
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.courses });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.modules });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.continue });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.activeInstance });
      }
    },
    onError: (error) => handleStateDrift(queryClient, labId, error),
  });

  const reveal = useMutation({
    mutationFn: ({ stepId, hintIndex }: RevealHintInput) =>
      settleTimeout(queryClient, labId, () => labsService.revealHint(labId, stepId, hintIndex)),
    onSuccess: (result) => {
      if (!result) return;
      applyXpDelta(queryClient, result.xp);
      queryClient.setQueryData<LabStepsStateDto>(stepsKey, (old) =>
        old ? applyHintReveal(old, result) : old,
      );
      void queryClient.invalidateQueries({ queryKey: stepsKey });
    },
    onError: (error) => handleStateDrift(queryClient, labId, error),
  });

  return {
    steps,
    stage,
    check,
    reveal,
    isStaging: stage.isPending,
    isChecking: check.isPending,
    isRevealing: reveal.isPending,
  };
}

/** Refetch slightly before the presigned URL's expiry so a reopened tab never gets a dead URL. */
const SLIDES_EXPIRY_MARGIN_MS = 60_000;

/**
 * `GET /labs/:labId/slides`: presigned deck URL (60 minute TTL), fetched when the Slides tab is
 * first opened. The URL is never refreshed while the deck is open (a reload would lose the
 * reader's page): a new one is fetched only when the tab is reopened after expiry, or when the
 * caller reports that the PDF failed to load (`refetch`).
 */
export function useSlides(labId: number, enabled = true) {
  const query = useQuery({
    queryKey: QUERY_KEYS.labs.slides(labId),
    queryFn: () => labsService.getSlides(labId),
    enabled: enabled && Number.isInteger(labId) && labId > 0,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data, refetch } = query;
  const expiresAt = data?.expiresAt ?? null;
  // Tab (re)opened: refresh only if the cached URL has expired.
  useEffect(() => {
    if (!enabled || expiresAt === null) return;
    const expiry = Date.parse(expiresAt);
    if (Number.isNaN(expiry) || expiry - SLIDES_EXPIRY_MARGIN_MS > Date.now()) return;
    void refetch();
  }, [enabled, expiresAt, refetch]);

  return query;
}

/** `GET /labs/:labId/walkthrough` markdown (C2): fetched only when the Walkthrough tab is open. */
export function useWalkthrough(labId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.labs.walkthrough(labId),
    queryFn: () => labsService.getWalkthrough(labId),
    enabled: enabled && Number.isInteger(labId) && labId > 0,
    retry: false,
  });
}
