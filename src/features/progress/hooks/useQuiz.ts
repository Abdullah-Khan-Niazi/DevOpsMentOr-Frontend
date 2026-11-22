import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { applyXpDelta, hasCode, isTimeoutError } from '@/shared/services';
import type { VpnRegion } from '@/features/labs/types';
import { progressService } from '../services';
import type {
  LearnerQuizQuestionDto,
  QuizAnswerResultDto,
  QuizAttemptResumeDto,
  QuizAttemptStartDto,
  QuizAttemptResultDto,
  SubmitQuizAnswerPayload,
  TerminalStageDto,
} from '../types';

/** Quiz status: attempts, cooldown, penalties and the open attempt (C§4.4). */
export function useQuizStatus(quizId: number | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.quizStatus(quizId ?? 0),
    queryFn: () => progressService.getQuizStatus(quizId as number),
    enabled: enabled && quizId !== null && quizId > 0,
    retry: false,
  });
}

/** One attempt with its questions, or the result once it is finished (C§4.4). */
export function useAttempt(attemptId: number | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.quizAttempt(attemptId ?? 0),
    queryFn: () => progressService.getAttempt(attemptId as number),
    enabled: enabled && attemptId !== null && attemptId > 0,
    retry: false,
  });
}

/** Starts a server-created attempt for the quiz, or resumes the open one (C§4.4). */
export function useStartAttempt(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => progressService.startAttempt(quizId),
    onSuccess: (attempt: QuizAttemptStartDto) => {
      queryClient.setQueryData<QuizAttemptResumeDto>(
        QUERY_KEYS.progress.quizAttempt(attempt.attemptId),
        { attempt, result: null },
      );
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.quizStatus(quizId) });
    },
    onError: (error) => {
      // Cooldown, daily cap or an earlier pass: the status carries the new `nextAttemptAt` / state.
      if (
        hasCode(
          error,
          ERROR_CODES.QUIZ_COOLDOWN,
          ERROR_CODES.QUIZ_ATTEMPT_LIMIT,
          ERROR_CODES.QUIZ_ALREADY_PASSED,
          ERROR_CODES.QUIZ_EMPTY,
        )
      ) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.quizStatus(quizId) });
      }
    },
  });
}

/** FE§4.5: another tab holds the terminal stage mutex; wait, then read the state it produced. */
const STAGE_IN_PROGRESS_WAIT_MS = 2_000;

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Writes a recorded answer into the cached attempt so the question turns read-only at once. */
function storeAnswer(queryClient: QueryClient, attemptId: number, result: QuizAnswerResultDto) {
  queryClient.setQueryData<QuizAttemptResumeDto>(
    QUERY_KEYS.progress.quizAttempt(attemptId),
    (old) =>
      old
        ? {
            ...old,
            attempt: {
              ...old.attempt,
              questions: old.attempt.questions.map((question): LearnerQuizQuestionDto =>
                question.questionId === result.questionId
                  ? { ...question, response: result }
                  : question,
              ),
            },
          }
        : old,
  );
}

/** Reloads an attempt from the server, bypassing the cache. */
function refetchAttempt(queryClient: QueryClient, attemptId: number) {
  return queryClient.fetchQuery({
    queryKey: QUERY_KEYS.progress.quizAttempt(attemptId),
    queryFn: () => progressService.getAttempt(attemptId),
    staleTime: 0,
  });
}

/**
 * Answers one question. A client timeout does not mean the answer failed: the attempt is
 * refetched and, when the server recorded the answer, that result is returned. Other
 * errors are thrown for the caller to render.
 */
export function useSubmitAnswer(attemptId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitQuizAnswerPayload): Promise<QuizAnswerResultDto> => {
      try {
        return await progressService.submitAnswer(attemptId, payload);
      } catch (error) {
        if (!isTimeoutError(error)) throw error;
        const resume = await refetchAttempt(queryClient, attemptId);
        const recorded = resume.attempt.questions.find(
          (question) => question.questionId === payload.questionId,
        )?.response;
        if (recorded) return recorded;
        throw error;
      }
    },
    onSuccess: (result) => {
      if (result.xp.delta !== 0) applyXpDelta(queryClient, result.xp);
      storeAnswer(queryClient, attemptId, result);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.quizAttempt(attemptId) });
    },
    onError: (error) => {
      // FE§4.5: the cached attempt is stale (answered elsewhere, closed, expired or not staged).
      if (
        hasCode(
          error,
          ERROR_CODES.QUESTION_ALREADY_ANSWERED,
          ERROR_CODES.ATTEMPT_CLOSED,
          ERROR_CODES.QUIZ_TIME_EXPIRED,
          ERROR_CODES.TERMINAL_NOT_STAGED,
        )
      ) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.progress.quizAttempt(attemptId),
        });
      }
    },
  });
}

/**
 * Finishes the attempt and returns the scored result. Applies the XP delta and refreshes
 * the quiz status, the attempt and the progress caches.
 */
export function useCompleteAttempt(attemptId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (): Promise<QuizAttemptResultDto> => progressService.completeAttempt(attemptId),
    onSuccess: (result) => {
      if (result.xp.delta !== 0) applyXpDelta(queryClient, result.xp);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.quizAttempt(attemptId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.quizReview(attemptId) });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.progress.quizStatus(result.quizId),
      });
      // Course and module rollups (prefixes cover course detail/modules and module items).
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.courses });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.modules });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.continue });
    },
    onError: (error) => {
      if (hasCode(error, ERROR_CODES.ATTEMPT_CLOSED, ERROR_CODES.QUIZ_TIME_EXPIRED)) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.progress.quizAttempt(attemptId),
        });
      }
    },
  });
}

/** Review of a passed attempt; runs only when `attemptId` is given (C§4.4). */
export function useQuizReview(attemptId: number | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.progress.quizReview(attemptId ?? 0),
    queryFn: () => progressService.getReview(attemptId as number),
    enabled: enabled && attemptId !== null && attemptId > 0,
    retry: false,
  });
}

/**
 * Stages the environment of a terminal question. Resolves with the staging record, or with
 * `null` when the request timed out (or another tab was staging) but the server staged the
 * environment: the attempt is refetched and its `terminal.staged` state is authoritative.
 * Otherwise the error is thrown for the caller to render with a retry.
 */
export function useStageTerminal(attemptId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      questionId,
      region,
    }: {
      questionId: number;
      region?: VpnRegion;
    }): Promise<TerminalStageDto | null> => {
      try {
        return await progressService.stageTerminal(attemptId, questionId, region);
      } catch (error) {
        const inProgress = hasCode(error, ERROR_CODES.STEP_STAGE_IN_PROGRESS);
        if (!inProgress && !isTimeoutError(error)) throw error;
        if (inProgress) await sleep(STAGE_IN_PROGRESS_WAIT_MS);
        const resume = await refetchAttempt(queryClient, attemptId);
        const staged = resume.attempt.questions.find(
          (question) => question.questionId === questionId,
        )?.terminal?.staged;
        if (staged) return null;
        throw error;
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progress.quizAttempt(attemptId) });
      // Staging may have provisioned or reused the learner's lab environment.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labs.activeInstance });
    },
  });
}
