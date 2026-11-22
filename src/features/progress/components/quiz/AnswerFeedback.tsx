import type { QuizAnswerResultDto } from '@/features/progress/types';
import { Icon } from '@/shared/components/Icon';
import { Markdown } from '@/shared/components/Markdown';
import { XpDelta } from '@/shared/components/XpDelta';
import { cn, pluralize } from '@/shared/utils';

export interface AnswerFeedbackProps {
  result: QuizAnswerResultDto;
}

/**
 * Immediate feedback after one answer: correctness, points earned, the XP penalties that applied
 * (negative XP per penalty), the guess disclosure and the explanation.
 */
export function AnswerFeedback({ result }: AnswerFeedbackProps) {
  // A wrong answer costs the wrong-answer penalty; a guessed answer costs the guess penalty even when correct.
  const wrongPenalty = result.isCorrect ? 0 : result.penalties.wrongAnswer;
  const guessPenalty = result.guessed ? result.penalties.guess : 0;

  return (
    <section role="status" aria-live="polite" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p
          className={cn(
            'flex items-center gap-2 text-base font-semibold',
            result.isCorrect ? 'text-check-success' : 'text-signal',
          )}
        >
          <Icon name={result.isCorrect ? 'check-circle' : 'x-circle'} size={20} />
          {result.isCorrect ? 'Correct' : 'Not quite'}
        </p>
        <p className="text-sm tabular-nums text-text-secondary">
          {pluralize(result.pointsEarned, 'point', 'points')} earned
        </p>
      </div>

      {wrongPenalty > 0 || guessPenalty > 0 ? (
        <ul className="flex flex-col gap-1 text-sm">
          {wrongPenalty > 0 ? (
            <li className="flex items-center justify-between gap-3">
              <span className="text-text-secondary">Wrong answer</span>
              <XpDelta delta={-wrongPenalty} />
            </li>
          ) : null}
          {guessPenalty > 0 ? (
            <li className="flex items-center justify-between gap-3">
              <span className="text-text-secondary">Guessed without running the command</span>
              <XpDelta delta={-guessPenalty} />
            </li>
          ) : null}
        </ul>
      ) : null}

      {result.guessed ? (
        <p className="text-sm text-text-secondary">
          No command was run in the lab for this answer, so it counts as a guess.
        </p>
      ) : null}

      {result.explanation ? <Markdown variant="compact">{result.explanation}</Markdown> : null}
    </section>
  );
}
