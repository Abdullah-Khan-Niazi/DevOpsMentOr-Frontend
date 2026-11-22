import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { generatePath, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAttempt,
  useCompleteAttempt,
  useQuizStatus,
  useStartAttempt,
  useSubmitAnswer,
} from '@/features/progress/hooks/useQuiz';
import { QuizPageSkeleton } from '@/features/progress/pages/QuizPageSkeleton';
import type {
  LearnerQuizQuestionDto,
  QuizAttemptResultDto,
  QuizAttemptStartDto,
} from '@/features/progress/types';
import {
  Button,
  ConfirmDialog,
  Countdown,
  EmptyState,
  ErrorState,
  ProgressBar,
} from '@/shared/components';
import { ERROR_CODES, QUERY_KEYS, ROUTES } from '@/shared/constants';
import { getErrorMessage, getStatusCode, hasCode } from '@/shared/services';
import { QuestionRail } from './QuestionRail';
import { QuestionView } from './QuestionView';
import { QuizResult } from './QuizResult';
import { emptyDraft, responseKindOf, toResponse, type QuizAnswerDraft } from './QuestionResponses';
import { TerminalQuestion } from './TerminalQuestion';

/** FE§4.5: an answer refused with STEP_STAGE_IN_PROGRESS waits before the attempt is refetched. */
const STAGE_IN_PROGRESS_WAIT_MS = 2_000;

export interface QuizRunnerProps {
  attemptId: number;
}

/** Inline notice after a failed answer or completion. `retry` offers a repeat of that action. */
interface Notice {
  message: string;
  retry: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Starting draft of a question: empty for its response kind, `check` when the kind has no editor. */
function defaultDraft(question: LearnerQuizQuestionDto): QuizAnswerDraft {
  const kind = responseKindOf(question);
  return kind ? emptyDraft(kind) : { kind: 'check' };
}

/** The attempt ran out of time: the result was finalized at or after its limit. */
function endedByTime(attempt: QuizAttemptStartDto, result: QuizAttemptResultDto): boolean {
  if (!attempt.expiresAt) return false;
  const limitSeconds = (Date.parse(attempt.expiresAt) - Date.parse(attempt.startedAt)) / 1000;
  return Number.isFinite(limitSeconds) && result.timeTakenSeconds >= limitSeconds;
}

/** Inline copy for the answer errors of FE§4.5; null when the error needs no message of its own. */
function answerErrorMessage(error: unknown): string | null {
  if (hasCode(error, ERROR_CODES.QUESTION_ALREADY_ANSWERED)) {
    return 'This question was already answered. The attempt has been refreshed.';
  }
  if (hasCode(error, ERROR_CODES.INVALID_ANSWER_SHAPE)) {
    return 'This answer could not be sent. Reload the question and try again.';
  }
  if (hasCode(error, ERROR_CODES.TERMINAL_NOT_STAGED)) {
    return 'The lab environment for this question is being prepared again. Submit once it is ready.';
  }
  if (hasCode(error, ERROR_CODES.LAB_ENV_UNREACHABLE)) {
    return 'The lab environment could not be reached. Nothing was recorded.';
  }
  if (hasCode(error, ERROR_CODES.STEP_STAGE_IN_PROGRESS)) {
    return 'Another lab action is still running. Wait a moment, then try again.';
  }
  if (hasCode(error, ERROR_CODES.LAB_ACCESS_DENIED)) {
    return 'This lab needs a plan. Upgrade to answer this question.';
  }
  return null;
}

/** Notice for a failed answer or completion. Time-limit errors show no notice: the result replaces the runner. */
function noticeFor(error: unknown): Notice | null {
  if (error === null || error === undefined) return null;
  if (hasCode(error, ERROR_CODES.ATTEMPT_CLOSED, ERROR_CODES.QUIZ_TIME_EXPIRED)) return null;
  const known = answerErrorMessage(error);
  if (known) return { message: known, retry: hasCode(error, ERROR_CODES.LAB_ENV_UNREACHABLE) };
  return { message: getErrorMessage(error), retry: true };
}

function AttemptLoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const status = getStatusCode(error);
  if (hasCode(error, ERROR_CODES.ATTEMPT_NOT_FOUND) || status === 404) {
    return <EmptyState icon="error" title="This attempt could not be found." />;
  }
  if (status === 403) {
    return <EmptyState icon="lock" title="You do not have access to this attempt." />;
  }
  return <ErrorState error={error} onRetry={onRetry} />;
}

/**
 * One quiz attempt, one question at a time. Loads the attempt, keeps the answer drafts, answers
 * and completes it, and renders the result once the attempt is finished. Question position comes
 * from `?q=` (1-based). The page keys this component by `attemptId`.
 */
export function QuizRunner({ attemptId }: QuizRunnerProps) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const attemptQuery = useAttempt(attemptId);
  const attempt = attemptQuery.data?.attempt ?? null;
  const status = useQuizStatus(attempt?.quizId ?? null);
  const submit = useSubmitAnswer(attemptId);
  const complete = useCompleteAttempt(attemptId);
  const restart = useStartAttempt(attempt?.quizId ?? 0);
  const completeMutate = complete.mutate;

  const [drafts, setDrafts] = useState<Record<number, QuizAnswerDraft>>({});
  const [expired, setExpired] = useState(false);
  const [restageToken, setRestageToken] = useState(0);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const shapeErrorLogged = useRef(false);

  const questions = attempt?.questions ?? [];
  const total = questions.length;
  const requestedIndex = Number(searchParams.get('q')) - 1;
  const index =
    total > 0 && Number.isInteger(requestedIndex) ? clamp(requestedIndex, 0, total - 1) : 0;
  const question = questions[index] as LearnerQuizQuestionDto | undefined;
  const result = attemptQuery.data?.result ?? complete.data ?? null;
  const answeredCount = questions.filter((item) => item.response !== null).length;
  const unansweredCount = total - answeredCount;
  const timeUp = expired || (attempt !== null && result !== null && endedByTime(attempt, result));
  const hasAttempt = attempt !== null;
  const resultMissing = result === null;

  // The time ran out but the server has no result yet: completing an expired attempt finalizes it.
  useEffect(() => {
    if (!expired || !hasAttempt || !resultMissing) return;
    if (complete.isPending || complete.isError) return;
    completeMutate();
  }, [expired, hasAttempt, resultMissing, complete.isPending, complete.isError, completeMutate]);

  if (attemptQuery.isPending) return <QuizPageSkeleton variant="runner" />;
  if (attemptQuery.isError || attempt === null) {
    return (
      <AttemptLoadError error={attemptQuery.error} onRetry={() => void attemptQuery.refetch()} />
    );
  }

  const draftOf = (item: LearnerQuizQuestionDto): QuizAnswerDraft =>
    drafts[item.questionId] ?? defaultDraft(item);

  const changeDraft = (questionId: number, next: QuizAnswerDraft) => {
    setDrafts((previous) => ({ ...previous, [questionId]: next }));
  };

  const goTo = (target: number) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set('q', String(target + 1));
        return next;
      },
      { replace: true },
    );
  };

  const handleAnswerError = (error: unknown) => {
    if (hasCode(error, ERROR_CODES.TERMINAL_NOT_STAGED)) {
      setRestageToken((token) => token + 1);
    }
    if (hasCode(error, ERROR_CODES.STEP_STAGE_IN_PROGRESS)) {
      window.setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.progress.quizAttempt(attemptId),
        });
      }, STAGE_IN_PROGRESS_WAIT_MS);
    }
    if (hasCode(error, ERROR_CODES.QUIZ_TIME_EXPIRED)) {
      setExpired(true);
    }
    if (hasCode(error, ERROR_CODES.INVALID_ANSWER_SHAPE) && !shapeErrorLogged.current) {
      shapeErrorLogged.current = true;
      console.error('Quiz answer rejected: INVALID_ANSWER_SHAPE', error);
    }
  };

  const response = question ? toResponse(question, draftOf(question)) : null;
  const isCheckMode = question?.questionType === 'terminal' && question.terminal?.mode === 'check';

  const submitQuestion = () => {
    if (!question || question.response !== null || submit.isPending || response === null) return;
    submit.mutate({ questionId: question.questionId, response }, { onError: handleAnswerError });
  };

  const requestFinish = () => {
    if (unansweredCount > 0) {
      setConfirmFinish(true);
      return;
    }
    completeMutate();
  };

  const startNext = () => {
    restart.mutate(undefined, {
      onSuccess: (next) => {
        setSearchParams({ attempt: String(next.attemptId), q: '1' });
      },
    });
  };

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Enter' || event.defaultPrevented || !question) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, textarea, select')) return;
    // Check mode is answered only by its own button, which waits for the environment.
    if (isCheckMode) return;
    event.preventDefault();
    if (question.response !== null) {
      if (index < total - 1) goTo(index + 1);
      return;
    }
    submitQuestion();
  }

  if (result) {
    const moduleId = status.data?.moduleId;
    const next =
      result.completedLessonIds.length > 0 && moduleId !== undefined
        ? {
            label: 'Next item',
            to: generatePath(ROUTES.LEARN_MODULE, { moduleId: String(moduleId) }),
          }
        : null;
    const restartNotice = noticeFor(restart.error);
    return (
      <div className="flex flex-col gap-6">
        {restartNotice ? (
          <ErrorState
            compact
            message={restartNotice.message}
            onRetry={startNext}
            retrying={restart.isPending}
          />
        ) : null}
        <QuizResult
          result={result}
          timeUp={timeUp}
          onReview={() => setSearchParams({ attempt: String(attemptId), view: 'review' })}
          onRetry={startNext}
          retryAt={status.data?.nextAttemptAt ?? null}
          onRetryAvailable={() => {
            void queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.progress.quizStatus(attempt.quizId),
            });
          }}
          next={next}
        />
      </div>
    );
  }

  if (total === 0 || !question) {
    return <EmptyState icon="error" title="This quiz has no questions yet." />;
  }

  const submitNotice =
    submit.variables?.questionId === question.questionId ? noticeFor(submit.error) : null;
  const finishNotice = complete.isError ? noticeFor(complete.error) : null;

  return (
    <section
      aria-label="Quiz questions"
      onKeyDown={handleKeyDown}
      className="flex min-h-0 flex-1 flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-base font-semibold tabular-nums text-card-foreground">
          Question {index + 1} of {total}
        </p>
        {attempt.expiresAt ? (
          <Countdown
            until={attempt.expiresAt}
            label="Time left"
            warnBelowSeconds={60}
            onElapsed={() => setExpired(true)}
          />
        ) : null}
      </div>
      <ProgressBar value={answeredCount} max={total} label="Questions answered" />

      <div className="grid min-h-0 flex-1 items-start gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <QuestionRail questions={questions} currentIndex={index} onSelect={goTo} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
          {question.questionType === 'terminal' ? (
            <TerminalQuestion
              attemptId={attemptId}
              question={question}
              value={draftOf(question)}
              onChange={(next) => changeDraft(question.questionId, next)}
              disabled={submit.isPending || question.response !== null}
              onCheck={submitQuestion}
              checkPending={submit.isPending}
              restageToken={restageToken}
            />
          ) : (
            <QuestionView
              question={question}
              value={draftOf(question)}
              onChange={(next) => changeDraft(question.questionId, next)}
              disabled={submit.isPending}
            />
          )}

          {submitNotice ? (
            <ErrorState
              compact
              message={submitNotice.message}
              onRetry={submitNotice.retry ? submitQuestion : undefined}
              retrying={submit.isPending}
            />
          ) : null}
          {finishNotice ? (
            <ErrorState
              compact
              message={finishNotice.message}
              onRetry={finishNotice.retry ? requestFinish : undefined}
            />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="secondary"
              onClick={requestFinish}
              isLoading={complete.isPending}
              disabled={complete.isPending}
            >
              Finish quiz
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              {question.response === null && !isCheckMode ? (
                <Button
                  onClick={submitQuestion}
                  isLoading={submit.isPending}
                  disabled={submit.isPending || response === null}
                >
                  Submit answer
                </Button>
              ) : null}
              {question.response !== null && index < total - 1 ? (
                <Button onClick={() => goTo(index + 1)}>Next</Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmFinish}
        tone="primary"
        title="Finish quiz?"
        message={`${unansweredCount} ${unansweredCount === 1 ? 'question is' : 'questions are'} unanswered and will score 0.`}
        confirmLabel="Finish quiz"
        cancelLabel="Keep answering"
        isLoading={complete.isPending}
        onCancel={() => setConfirmFinish(false)}
        onConfirm={() => {
          setConfirmFinish(false);
          completeMutate();
        }}
      />
    </section>
  );
}

export default QuizRunner;
