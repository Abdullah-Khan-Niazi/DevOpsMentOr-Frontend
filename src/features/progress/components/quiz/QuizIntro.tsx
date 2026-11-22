import type { QuizStatusDto } from '@/features/progress/types';
import { Button } from '@/shared/components/Button';
import { Countdown } from '@/shared/components/Countdown';
import { ErrorState } from '@/shared/components/ErrorState';
import { Markdown } from '@/shared/components/Markdown';
import { formatDuration } from '@/shared/utils';

export interface QuizIntroProps {
  status: QuizStatusDto;
  onStart: () => void;
  onResume: () => void;
  onReview: () => void;
  /** Fired when the retry cooldown or daily cap elapses, so the page can refetch the status. */
  onRetryAvailable?: () => void;
  startPending: boolean;
  startError: unknown;
}

/** Quiz landing view: what the quiz is, its limits, the XP at stake and the primary action. */
export function QuizIntro({
  status,
  onStart,
  onResume,
  onReview,
  onRetryAvailable,
  startPending,
  startError,
}: QuizIntroProps) {
  const hasAttemptCap = status.maxAttemptsPerDay > 0;
  const blocked = status.nextAttemptAt !== null;
  const timeLimit = status.timeLimitMinutes
    ? formatDuration({ minutes: status.timeLimitMinutes })
    : 'No time limit';

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
          {status.title}
        </h1>
        {status.description ? <Markdown variant="compact">{status.description}</Markdown> : null}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-text-tertiary">Questions</dt>
          <dd className="text-base font-semibold tabular-nums">{status.questionCount}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-text-tertiary">Passing score</dt>
          <dd className="text-base font-semibold tabular-nums">{status.passingScore}%</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-text-tertiary">Time limit</dt>
          <dd className="text-base font-semibold">{timeLimit}</dd>
        </div>
        {hasAttemptCap ? (
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-text-tertiary">Attempts today</dt>
            <dd className="text-base font-semibold tabular-nums">
              {status.attemptsUsedToday} of {status.maxAttemptsPerDay}
            </dd>
          </div>
        ) : null}
        {status.bestScore !== null ? (
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-text-tertiary">Best score</dt>
            <dd className="text-base font-semibold tabular-nums">{status.bestScore}%</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-col gap-2 text-sm text-text-secondary">
        {status.totalPoints > 0 ? <p>Earn up to {status.totalPoints} XP.</p> : null}
        {status.penalties.wrongAnswerMax > 0 ? (
          <p>Wrong answers cost up to {status.penalties.wrongAnswerMax} XP.</p>
        ) : null}
        {status.hasTerminalQuestions && status.penalties.terminalGuessMax > 0 ? (
          <p>
            Guessing a lab answer without running the command costs up to{' '}
            {status.penalties.terminalGuessMax} XP.
          </p>
        ) : null}
        {status.lastAttempt && !status.isPassed ? (
          <p>Your last attempt scored {status.lastAttempt.score}%.</p>
        ) : null}
        {status.isPassed ? (
          <p className="font-medium text-check-success">You have passed this quiz.</p>
        ) : null}
        {blocked && status.nextAttemptAt ? (
          <p>
            You can try again in{' '}
            <Countdown until={status.nextAttemptAt} format="auto" onElapsed={onRetryAvailable} />
          </p>
        ) : null}
      </div>

      {/* Staff create quizzes in the control panel; one without active questions cannot start (QUIZ_EMPTY). */}
      {status.questionCount === 0 && !status.isPassed ? (
        <p className="text-sm font-medium text-text-secondary">This quiz has no questions yet.</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {!status.isPassed && (status.questionCount > 0 || status.openAttemptId !== null) ? (
          status.openAttemptId !== null ? (
            <Button onClick={onResume}>Resume quiz</Button>
          ) : (
            <Button onClick={onStart} isLoading={startPending} disabled={blocked}>
              Start quiz
            </Button>
          )
        ) : null}
        {status.passedAttemptId !== null ? (
          <Button variant="secondary" onClick={onReview}>
            Review answers
          </Button>
        ) : null}
      </div>

      {startError != null ? (
        <ErrorState compact error={startError} onRetry={onStart} retrying={startPending} />
      ) : null}
    </section>
  );
}
