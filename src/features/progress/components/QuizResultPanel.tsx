import type { QuizAttemptResultDto } from '../types';

interface QuizResultPanelProps {
  result: QuizAttemptResultDto;
  onRetry: () => void;
}

/** SCR-F5-02: score card revealed after submit. */
export function QuizResultPanel({ result, onRetry }: QuizResultPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-card-foreground">Quiz result</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Attempt #{result.attemptNumber} · {result.correctCount} of {result.totalQuestions}{' '}
            correct
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums text-card-foreground">
            {result.score}%
          </div>
          <div
            className={
              result.isPassed
                ? 'text-sm font-medium text-green-700'
                : 'text-sm font-medium text-red-700'
            }
          >
            {result.isPassed ? 'Passed' : 'Not passed'}
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {result.breakdown.map((item) => (
          <li key={item.questionId} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">
              Question {item.questionId}{' '}
              {item.isCorrect ? (
                <span className="text-green-700">· correct</span>
              ) : (
                <span className="text-red-700">· incorrect</span>
              )}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              +{item.pointsEarned} pts
            </span>
          </li>
        ))}
      </ul>

      {!result.isPassed ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export default QuizResultPanel;
