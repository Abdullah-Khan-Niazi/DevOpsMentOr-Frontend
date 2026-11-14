import { useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { QuizQuestionDto } from '../types';

/** Card id → chosen bucket label, produced by `bucket_sort` controls. */
export type QuizBucketAssignment = Record<number, string>;
/** Ordered answerId list for `ordering`; number/string/array for the legacy types. */
export type QuizAnswerValue = number | string | number[] | QuizBucketAssignment;
export type QuizAnswerState = Record<number, QuizAnswerValue>;

function isBucketAssignment(value: QuizAnswerValue | undefined): value is QuizBucketAssignment {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Buckets come from `config.buckets`; invalid/empty config returns `[]`. */
function parseBuckets(config: Record<string, unknown> | null | undefined): string[] {
  if (!config || !Array.isArray(config.buckets)) return [];
  return config.buckets
    .filter((bucket): bucket is string => typeof bucket === 'string')
    .map((bucket) => bucket.trim())
    .filter((bucket) => bucket.length > 0);
}

function parseInstructions(config: Record<string, unknown> | null | undefined): string | null {
  if (!config || typeof config.instructions !== 'string') return null;
  const instructions = config.instructions.trim();
  return instructions.length > 0 ? instructions : null;
}

interface QuizQuestionPanelProps {
  question: QuizQuestionDto;
  index: number;
  total: number;
  answer: QuizAnswerValue | undefined;
  onChange: (questionId: number, value: QuizAnswerValue) => void;
}

/** Shared malformed-question notice: never render an unusable control silently. */
function QuestionConfigAlert({ children }: { children: string }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-md border border-error/30 bg-error/10 px-3 py-2.5 text-sm text-error"
    >
      {children}
    </p>
  );
}

/**
 * `true_false`: two large statement buttons; the selected one is the answer.
 * Implemented as an accessible radio group with ↑/↓/←/→ navigation.
 */
function TrueFalseAnswerList({
  question,
  answer,
  onChange,
}: Pick<QuizQuestionPanelProps, 'question' | 'answer' | 'onChange'>) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const options = question.answers.slice(0, 2);

  if (options.length < 2) {
    return (
      <QuestionConfigAlert>
        This true/false question is missing its two statements. Ask your instructor to fix this
        question.
      </QuestionConfigAlert>
    );
  }

  const selectOption = (optionIndex: number, focus: boolean) => {
    onChange(question.questionId, options[optionIndex].answerId);
    if (focus) buttonsRef.current[optionIndex]?.focus();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    if (!forward && !backward) return;
    event.preventDefault();
    const selectedIndex = options.findIndex((option) => option.answerId === answer);
    const nextIndex =
      selectedIndex === -1
        ? forward
          ? 0
          : options.length - 1
        : (selectedIndex + (forward ? 1 : -1) + options.length) % options.length;
    selectOption(nextIndex, true);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Choose true or false"
      onKeyDown={handleKeyDown}
      className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {options.map((option, optionIndex) => {
        const checked = answer === option.answerId;
        return (
          <button
            key={option.answerId}
            ref={(node) => {
              buttonsRef.current[optionIndex] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked || (answer === undefined && optionIndex === 0) ? 0 : -1}
            onClick={() => onChange(question.questionId, option.answerId)}
            className={`flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-4 py-4 text-base font-semibold transition-colors ${
              checked
                ? 'border-brand-600 bg-brand-50 text-card-foreground'
                : 'border-border bg-card text-muted hover:border-card-foreground/40 hover:text-card-foreground'
            }`}
          >
            <span
              aria-hidden="true"
              className={`text-lg ${checked ? 'text-success' : 'text-transparent'}`}
            >
              ✓
            </span>
            {option.answerText}
          </button>
        );
      })}
    </div>
  );
}

/** `fill_blank`: a single text input — never an option list. */
function FillBlankAnswerList({
  question,
  answer,
  onChange,
}: Pick<QuizQuestionPanelProps, 'question' | 'answer' | 'onChange'>) {
  const inputId = `question-${question.questionId}`;
  const hintId = `${inputId}-hint`;
  return (
    <div className="mt-4">
      <label htmlFor={inputId} className="sr-only">
        Your answer
      </label>
      <input
        id={inputId}
        className="input-field w-full"
        placeholder="Type your answer…"
        value={typeof answer === 'string' ? answer : ''}
        onChange={(event) => onChange(question.questionId, event.target.value)}
        aria-describedby={hintId}
        autoComplete="off"
      />
      <p id={hintId} className="mt-1 text-xs text-muted-foreground">
        Your answer is checked against the accepted answers; capitalization does not matter.
      </p>
    </div>
  );
}

/** `multiple_choice` (radios) and `multiple_select` (checkboxes) option lists. */
function ChoiceAnswerList({
  question,
  answer,
  onChange,
}: Pick<QuizQuestionPanelProps, 'question' | 'answer' | 'onChange'>) {
  const isMultiple = question.questionType === 'multiple_select';
  const selected: number[] = Array.isArray(answer) ? answer : [];

  if (question.answers.length === 0) {
    return (
      <QuestionConfigAlert>
        This question has no answer options yet. Ask your instructor to add them.
      </QuestionConfigAlert>
    );
  }

  const toggle = (answerId: number) => {
    if (!isMultiple) {
      onChange(question.questionId, answerId);
      return;
    }
    const current = typeof answer === 'number' ? [answer] : selected;
    const next = current.includes(answerId)
      ? current.filter((id) => id !== answerId)
      : [...current, answerId];
    onChange(question.questionId, next);
  };

  return (
    <fieldset className="mt-4 space-y-2">
      <legend className="sr-only">
        {isMultiple ? 'Select all answers that apply' : 'Select one answer'}
      </legend>
      {question.answers.map((option) => {
        const checked = isMultiple
          ? selected.includes(option.answerId)
          : answer === option.answerId;
        const inputId = `question-${question.questionId}-option-${option.answerId}`;
        return (
          <label
            key={option.answerId}
            htmlFor={inputId}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2.5 text-sm transition-colors has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
          >
            <input
              id={inputId}
              type={isMultiple ? 'checkbox' : 'radio'}
              name={`question-${question.questionId}`}
              checked={checked}
              onChange={() => toggle(option.answerId)}
              className="mt-0.5 h-4 w-4 accent-brand-600"
            />
            <span className="text-card-foreground">{option.answerText}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

/** `bucket_sort`: one bucket selector per card; buckets come from `config.buckets`. */
function BucketSortAnswerList({
  question,
  answer,
  onChange,
}: Pick<QuizQuestionPanelProps, 'question' | 'answer' | 'onChange'>) {
  const buckets = parseBuckets(question.config);
  const assignments = isBucketAssignment(answer) ? answer : {};

  if (buckets.length < 2) {
    return (
      <QuestionConfigAlert>
        This bucket sort question is missing its bucket configuration (at least two buckets are
        required). Ask your instructor to fix this question.
      </QuestionConfigAlert>
    );
  }

  if (question.answers.length === 0) {
    return (
      <QuestionConfigAlert>
        This bucket sort question has no cards to classify yet. Ask your instructor to add cards.
      </QuestionConfigAlert>
    );
  }

  const selectBucket = (cardAnswerId: number, bucket: string) => {
    const next: QuizBucketAssignment = { ...assignments };
    if (bucket) {
      next[cardAnswerId] = bucket;
    } else {
      delete next[cardAnswerId];
    }
    onChange(question.questionId, next);
  };

  return (
    <fieldset className="mt-4 space-y-3">
      <legend className="sr-only">Classify each card into a bucket</legend>
      {question.answers.map((card) => {
        const selectId = `question-${question.questionId}-card-${card.answerId}`;
        return (
          <div
            key={card.answerId}
            className="flex flex-col gap-2 rounded-md border border-border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-sm text-card-foreground">{card.answerText}</span>
            <div className="flex items-center gap-2">
              <label htmlFor={selectId} className="whitespace-nowrap text-xs text-muted-foreground">
                Bucket
              </label>
              <select
                id={selectId}
                className="input-field h-9 w-full text-sm sm:w-48"
                value={assignments[card.answerId] ?? ''}
                onChange={(event) => selectBucket(card.answerId, event.target.value)}
              >
                <option value="">Choose a bucket…</option>
                {buckets.map((bucket, index) => (
                  <option key={`${bucket}-${index}`} value={bucket}>
                    {bucket}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}

/** Normalizes a stored ordering answer to the full list of item ids in chosen order. */
function normalizeOrderingAnswer(
  answer: QuizAnswerValue | undefined,
  serverOrder: number[],
): number[] {
  const validIds = new Set(serverOrder);
  if (Array.isArray(answer)) {
    const chosen = answer.filter((id): id is number => typeof id === 'number' && validIds.has(id));
    const seen = new Set(chosen);
    const missing = serverOrder.filter((id) => !seen.has(id));
    return [...chosen, ...missing];
  }
  return [...serverOrder];
}

/** `ordering`: an ordered list with ↑/↓ controls (no drag library); array order is the answer. */
function OrderingAnswerList({
  question,
  answer,
  onChange,
}: Pick<QuizQuestionPanelProps, 'question' | 'answer' | 'onChange'>) {
  const serverOrder = question.answers.map((item) => item.answerId);
  const chosen = normalizeOrderingAnswer(answer, serverOrder);
  const byId = new Map(question.answers.map((item) => [item.answerId, item]));

  if (question.answers.length < 2) {
    return (
      <QuestionConfigAlert>
        This ordering question needs at least two items. Ask your instructor to fix this question.
      </QuestionConfigAlert>
    );
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= chosen.length) return;
    const next = [...chosen];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(question.questionId, next);
  };

  return (
    <ol className="mt-4 space-y-2" aria-label="Items in your chosen order">
      {chosen.map((answerId, index) => {
        const item = byId.get(answerId);
        if (!item) return null;
        return (
          <li
            key={answerId}
            className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 font-mono text-xs font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 text-sm text-card-foreground">{item.answerText}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move "${item.answerText}" up`}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-xs border border-border bg-paper text-sm text-muted transition-colors hover:bg-surface-hover hover:text-card-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === chosen.length - 1}
                aria-label={`Move "${item.answerText}" down`}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-xs border border-border bg-paper text-sm text-muted transition-colors hover:bg-surface-hover hover:text-card-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                ↓
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Renders the answer controls for the question type (each type looks distinct). */
function renderAnswerControls({
  question,
  answer,
  onChange,
}: Pick<QuizQuestionPanelProps, 'question' | 'answer' | 'onChange'>) {
  switch (question.questionType) {
    case 'true_false':
      return <TrueFalseAnswerList question={question} answer={answer} onChange={onChange} />;
    case 'fill_blank':
      return <FillBlankAnswerList question={question} answer={answer} onChange={onChange} />;
    case 'multiple_select':
    case 'multiple_choice':
      return <ChoiceAnswerList question={question} answer={answer} onChange={onChange} />;
    case 'ordering':
      return <OrderingAnswerList question={question} answer={answer} onChange={onChange} />;
    case 'bucket_sort':
      return <BucketSortAnswerList question={question} answer={answer} onChange={onChange} />;
    default:
      return (
        <QuestionConfigAlert>
          This question type is not supported by the quiz player yet. Ask your instructor to fix
          this question.
        </QuestionConfigAlert>
      );
  }
}

/** SCR-F5-02: one question with its answer controls. */
export function QuizQuestionPanel({
  question,
  index,
  total,
  answer,
  onChange,
}: QuizQuestionPanelProps) {
  const instructions = parseInstructions(question.config);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-card-foreground">
          {index + 1}. {question.questionText}
        </h3>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {question.points} pt{question.points === 1 ? '' : 's'}
        </span>
      </div>
      {instructions ? (
        <p className="mt-2 rounded-md bg-paper px-3 py-2 text-xs text-muted-foreground">
          {instructions}
        </p>
      ) : null}
      {renderAnswerControls({ question, answer, onChange })}
      {index === total - 1 ? (
        <p className="mt-4 text-xs text-muted-foreground">Review your answers before submitting.</p>
      ) : null}
    </div>
  );
}

export default QuizQuestionPanel;
