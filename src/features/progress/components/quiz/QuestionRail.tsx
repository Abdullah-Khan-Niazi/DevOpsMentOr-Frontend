import { useRef, type KeyboardEvent } from 'react';
import type { LearnerQuizQuestionDto } from '@/features/progress/types';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/utils';

export interface QuestionRailProps {
  questions: ReadonlyArray<LearnerQuizQuestionDto>;
  currentIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Numbered, text-only question list. The current question is ink at weight 600 with
 * `aria-current="step"`; answered questions show a check or x icon. Arrow keys, Home and End move
 * between questions (roving tabindex).
 */
export function QuestionRail({ questions, currentIndex, onSelect }: QuestionRailProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const last = questions.length - 1;

  function go(index: number) {
    onSelect(index);
    buttonRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = Math.min(currentIndex + 1, last);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (next !== currentIndex && next >= 0) go(next);
  }

  return (
    <nav aria-label="Quiz questions" onKeyDown={handleKeyDown}>
      <ol className="flex flex-col gap-0.5">
        {questions.map((question, index) => {
          const current = index === currentIndex;
          const answered = question.response;
          const status = answered
            ? answered.isCorrect
              ? ', answered correctly'
              : ', answered incorrectly'
            : '';
          return (
            <li key={question.questionId}>
              <button
                ref={(node) => {
                  buttonRefs.current[index] = node;
                }}
                type="button"
                aria-label={`Question ${index + 1}${status}`}
                aria-current={current ? 'step' : undefined}
                tabIndex={current ? 0 : -1}
                onClick={() => onSelect(index)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-start text-sm transition-colors hover:bg-pearl-200',
                  current ? 'font-semibold text-ink' : 'font-normal text-text-secondary',
                )}
              >
                <span className="tabular-nums">{index + 1}</span>
                {answered ? (
                  <Icon
                    name={answered.isCorrect ? 'check' : 'x'}
                    size={16}
                    className="text-text-tertiary"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
