import { Link } from 'react-router-dom';
import type { QuizAttemptResultDto } from '@/features/progress/types';
import { Button } from '@/shared/components/Button';
import { Countdown } from '@/shared/components/Countdown';
import { Icon } from '@/shared/components/Icon';
import { Markdown } from '@/shared/components/Markdown';
import { XpDelta } from '@/shared/components/XpDelta';
import { cn, formatDuration, pluralize } from '@/shared/utils';

export interface QuizResultProps {
  result: QuizAttemptResultDto;
  /** The attempt ended by its time limit (unanswered questions scored 0). */
  timeUp: boolean;
  onReview: () => void;
  onRetry: () => void;
  /** Cooldown or daily-cap expiry; Retry is disabled with a countdown until then. */
  retryAt: string | null;
  /** Fired when the retry countdown elapses, so the page can refetch the status. */
  onRetryAvailable?: () => void;
  next: { label: string; to: string } | null;
}

/** Final result of a quiz attempt: score against the passing score, XP, breakdown and next steps. */
export function QuizResult({
  result,
  timeUp,
  onReview,
  onRetry,
  retryAt,
  onRetryAvailable,
  next,
}: QuizResultProps) {
  const headline = result.isPassed ? 'You passed' : timeUp ? 'Time is up' : 'Not passed yet';

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <p
          className={cn(
            'flex items-center gap-2 text-base font-semibold',
            result.isPassed ? 'text-check-success' : 'text-signal',
          )}
        >
          <Icon name={result.isPassed ? 'check-circle' : 'x-circle'} size={20} />
          {headline}
        </p>
        {timeUp && !result.isPassed ? (
          <p className="text-sm text-text-secondary">Unanswered questions scored 0.</p>
        ) : null}
        <div className={cn('flex flex-col gap-1', result.firstPass && 'motion-pop-in')}>
          <p className="text-5xl font-semibold tabular-nums text-card-foreground">
            {result.score}%
          </p>
          <p className="text-sm text-text-secondary">Passing score {result.passingScore}%</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-text-tertiary">Correct</dt>
          <dd className="text-base font-semibold tabular-nums">
            {result.correctCount} of {result.totalQuestions}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-text-tertiary">Answered</dt>
          <dd className="text-base font-semibold tabular-nums">
            {result.answeredCount} of {result.totalQuestions}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-text-tertiary">Time taken</dt>
          <dd className="text-base font-semibold tabular-nums">
            {formatDuration({ seconds: result.timeTakenSeconds }) || '0 s'}
          </dd>
        </div>
      </dl>

      {(result.firstPass && result.xpAwarded > 0) || result.penaltiesTotal > 0 ? (
        <ul className="flex flex-col gap-2 text-sm">
          {result.firstPass && result.xpAwarded > 0 ? (
            <li className="flex items-center justify-between gap-3">
              <span className="text-text-secondary">Pass reward</span>
              <XpDelta delta={result.xpAwarded} />
            </li>
          ) : null}
          {result.penaltiesTotal > 0 ? (
            <li className="flex items-center justify-between gap-3">
              <span className="text-text-secondary">Penalties</span>
              <XpDelta delta={-result.penaltiesTotal} />
            </li>
          ) : null}
        </ul>
      ) : null}

      {result.breakdown.length > 0 ? (
        <section aria-label="Question breakdown" className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-card-foreground">Breakdown</h2>
          <ol className="flex flex-col gap-4">
            {result.breakdown.map((item, index) => (
              <li key={item.questionId} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-card-foreground">
                    <Icon
                      name={item.isCorrect ? 'check-circle' : 'x-circle'}
                      size={18}
                      className={item.isCorrect ? 'text-check-success' : 'text-signal'}
                    />
                    Question {index + 1}
                  </span>
                  <span className="tabular-nums text-text-secondary">
                    {pluralize(item.pointsEarned, 'point', 'points')}
                  </span>
                </div>
                {item.explanation ? (
                  <Markdown variant="compact">{item.explanation}</Markdown>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {next ? (
          <Link to={next.to} className="btn btn--primary btn--md">
            {next.label}
          </Link>
        ) : null}
        {result.reviewAvailable ? (
          <Button variant="secondary" onClick={onReview}>
            Review answers
          </Button>
        ) : null}
        {!result.isPassed ? (
          retryAt ? (
            <Button variant="secondary" disabled>
              Try again in <Countdown until={retryAt} format="auto" onElapsed={onRetryAvailable} />
            </Button>
          ) : (
            <Button onClick={onRetry}>Try again</Button>
          )
        ) : null}
      </div>
    </section>
  );
}
