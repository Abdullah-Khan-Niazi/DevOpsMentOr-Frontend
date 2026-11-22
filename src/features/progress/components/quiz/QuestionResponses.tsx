import {
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import type { LearnerQuizQuestionDto, QuizAnswerResponse } from '@/features/progress/types';
import { Select } from '@/shared/components/Field';
import { Icon } from '@/shared/components/Icon';
import { Input } from '@/shared/components/Input';
import { cn } from '@/shared/utils';

/** How a question is answered. `check` is a terminal question graded by the lab check (no editor). */
export type QuizResponseKind = 'choice' | 'multi' | 'text' | 'ordering' | 'buckets' | 'check';

/** Local, not-yet-submitted answer state of one question. Converted by `toResponse`. */
export type QuizAnswerDraft =
  | { kind: 'choice'; answerId: number | null }
  | { kind: 'multi'; answerIds: number[] }
  | { kind: 'text'; text: string }
  | { kind: 'ordering'; answerIds: number[] }
  | { kind: 'buckets'; placements: Record<number, number> }
  | { kind: 'check' };

export interface QuizResponseProps {
  question: LearnerQuizQuestionDto;
  value: QuizAnswerDraft;
  onChange: (next: QuizAnswerDraft) => void;
  disabled: boolean;
}

const TEXT_MAX_LENGTH = 500;
const NUMBER_KEY_LIMIT = 9;

/** Response editor for a question; null when the type has no editor this build understands. */
export function responseKindOf(question: LearnerQuizQuestionDto): QuizResponseKind | null {
  switch (question.questionType) {
    case 'multiple_choice':
    case 'true_false':
      return 'choice';
    case 'multiple_select':
      return 'multi';
    case 'fill_blank':
      return 'text';
    case 'ordering':
      return 'ordering';
    case 'bucket_sort':
      return 'buckets';
    case 'terminal':
      if (question.terminal?.mode === 'check') return 'check';
      if (question.terminal?.answerFormat === 'choice') return 'choice';
      if (question.terminal?.answerFormat === 'text') return 'text';
      return null;
    default:
      return null;
  }
}

/** Empty draft for a response kind. */
export function emptyDraft(kind: QuizResponseKind): QuizAnswerDraft {
  switch (kind) {
    case 'choice':
      return { kind, answerId: null };
    case 'multi':
      return { kind, answerIds: [] };
    case 'text':
      return { kind, text: '' };
    case 'ordering':
      return { kind, answerIds: [] };
    case 'buckets':
      return { kind, placements: {} };
    case 'check':
      return { kind };
  }
}

/** Ordering as the learner sees it: chosen ids first, then any option not chosen yet in server order. */
function orderedIds(question: LearnerQuizQuestionDto, draft: QuizAnswerDraft): number[] {
  const serverOrder = question.options.map((option) => option.answerId);
  if (draft.kind !== 'ordering') return serverOrder;
  const valid = new Set(serverOrder);
  const chosen = [...new Set(draft.answerIds)].filter((id) => valid.has(id));
  const missing = serverOrder.filter((id) => !chosen.includes(id));
  return [...chosen, ...missing];
}

/**
 * Converts a draft into the `submitQuizAnswerSchema` response body. Returns null while the
 * answer is incomplete, so the page can keep Submit disabled.
 */
export function toResponse(
  question: LearnerQuizQuestionDto,
  draft: QuizAnswerDraft,
): QuizAnswerResponse | null {
  const kind = responseKindOf(question);
  if (kind === null || draft.kind !== kind) return null;
  switch (draft.kind) {
    case 'choice':
      return draft.answerId === null ? null : { type: 'choice', answerId: draft.answerId };
    case 'multi':
      return draft.answerIds.length > 0 ? { type: 'multi', answerIds: draft.answerIds } : null;
    case 'text': {
      const text = draft.text.trim();
      return text.length > 0 && text.length <= TEXT_MAX_LENGTH ? { type: 'text', text } : null;
    }
    case 'ordering': {
      const answerIds = orderedIds(question, draft);
      return answerIds.length >= 2 ? { type: 'ordering', answerIds } : null;
    }
    case 'buckets': {
      const placements: Array<{ answerId: number; bucket: number }> = [];
      for (const option of question.options) {
        const bucket = draft.placements[option.answerId];
        if (bucket === undefined) return null;
        placements.push({ answerId: option.answerId, bucket });
      }
      return placements.length > 0 ? { type: 'buckets', placements } : null;
    }
    case 'check':
      return { type: 'terminal_check' };
  }
}

/** Number keys 1-9 pick options unless the learner is typing into a text field or the terminal. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) {
    return target.type !== 'radio' && target.type !== 'checkbox';
  }
  return target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
}

const OPTION_ROW_CLASS = cn(
  'flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-start text-base text-card-foreground transition-colors',
  'has-[:focus-visible]:[box-shadow:var(--focus-ring)] has-[:disabled]:cursor-default',
);

/**
 * `multiple_choice`, `true_false` and terminal choice. Native radio inputs (arrow keys move the
 * selection) with transparent option rows; the selected row shows a filled check-circle.
 */
export function ChoiceResponse({ question, value, onChange, disabled }: QuizResponseProps) {
  const groupName = useId();
  const selected = value.kind === 'choice' ? value.answerId : null;

  useEffect(() => {
    if (disabled) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;
      const position = Number(event.key);
      if (!Number.isInteger(position) || position < 1 || position > NUMBER_KEY_LIMIT) return;
      const option = question.options[position - 1];
      if (!option) return;
      event.preventDefault();
      onChange({ kind: 'choice', answerId: option.answerId });
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, question.options, onChange]);

  return (
    <fieldset className="flex flex-col gap-1.5" disabled={disabled}>
      <legend className="sr-only">Choose one answer. Press 1 to 9 to pick an option.</legend>
      {question.options.map((option, index) => {
        const checked = selected === option.answerId;
        return (
          <label
            key={option.answerId}
            className={cn(
              OPTION_ROW_CLASS,
              !disabled && 'cursor-pointer hover:bg-pearl-200',
              checked && 'font-semibold',
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={option.answerId}
              checked={checked}
              onChange={() => onChange({ kind: 'choice', answerId: option.answerId })}
              className="sr-only"
            />
            <Icon
              name={checked ? 'check-circle' : 'circle'}
              size={20}
              selected={checked}
              className={cn('shrink-0', checked ? 'text-ink' : 'text-text-tertiary')}
            />
            <span className="min-w-0 flex-1">{option.answerText}</span>
            {index < NUMBER_KEY_LIMIT ? (
              <span aria-hidden="true" className="text-xs tabular-nums text-text-tertiary">
                {index + 1}
              </span>
            ) : null}
          </label>
        );
      })}
    </fieldset>
  );
}

/** `multiple_select`: one native checkbox per option; at least one must be chosen to submit. */
export function MultiResponse({ question, value, onChange, disabled }: QuizResponseProps) {
  const selected = value.kind === 'multi' ? value.answerIds : [];

  const toggle = (answerId: number) => {
    const next = selected.includes(answerId)
      ? selected.filter((id) => id !== answerId)
      : [...selected, answerId];
    onChange({ kind: 'multi', answerIds: next });
  };

  return (
    <fieldset className="flex flex-col gap-1.5" disabled={disabled}>
      <legend className="sr-only">Select all answers that apply</legend>
      {question.options.map((option) => {
        const checked = selected.includes(option.answerId);
        return (
          <label
            key={option.answerId}
            className={cn(
              OPTION_ROW_CLASS,
              !disabled && 'cursor-pointer hover:bg-pearl-200',
              checked && 'font-semibold',
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(option.answerId)}
              className="h-4 w-4 shrink-0 accent-ink"
            />
            <span className="min-w-0 flex-1">{option.answerText}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

/** `fill_blank` and terminal text: one short text answer (1 to 500 characters). */
export function TextResponse({ value, onChange, disabled }: QuizResponseProps) {
  const text = value.kind === 'text' ? value.text : '';
  return (
    <Input
      aria-label="Your answer"
      placeholder="Type your answer"
      value={text}
      maxLength={TEXT_MAX_LENGTH}
      autoComplete="off"
      spellCheck={false}
      disabled={disabled}
      onChange={(event) => onChange({ kind: 'text', text: event.target.value })}
    />
  );
}

/**
 * `ordering`: a keyboard reorder list. Focus an item and press Alt with Up or Down to move it;
 * items can also be dragged. Moves are announced to screen readers.
 */
export function OrderingResponse({ question, value, onChange, disabled }: QuizResponseProps) {
  const hintId = useId();
  const ids = orderedIds(question, value);
  const labelById = new Map(question.options.map((option) => [option.answerId, option.answerText]));
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const pendingFocus = useRef<number | null>(null);
  const dragFrom = useRef<number | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (pendingFocus.current === null) return;
    itemRefs.current[pendingFocus.current]?.focus();
    pendingFocus.current = null;
  });

  function move(from: number, to: number) {
    if (disabled || from === to || to < 0 || to >= ids.length) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    pendingFocus.current = to;
    onChange({ kind: 'ordering', answerIds: next });
    setAnnouncement(
      `${labelById.get(moved) ?? 'Item'} moved to position ${to + 1} of ${ids.length}.`,
    );
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLLIElement>, index: number) {
    if (!event.altKey || disabled) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(index, index - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(index, index + 1);
    }
  }

  function handleDragStart(event: ReactDragEvent<HTMLLIElement>, index: number) {
    if (disabled) {
      event.preventDefault();
      return;
    }
    dragFrom.current = index;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }

  function handleDrop(event: ReactDragEvent<HTMLLIElement>, index: number) {
    event.preventDefault();
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from !== null) move(from, index);
  }

  return (
    <div className="flex flex-col gap-2">
      <p id={hintId} className="text-xs text-text-tertiary">
        Put the items in order. Focus an item and press Alt with the up or down arrow, or drag it.
      </p>
      <ol
        aria-describedby={hintId}
        aria-label="Items in your order"
        className="flex flex-col gap-1.5"
      >
        {ids.map((answerId, index) => {
          const label = labelById.get(answerId);
          if (label === undefined) return null;
          return (
            <li
              key={answerId}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              tabIndex={disabled ? -1 : 0}
              draggable={!disabled}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onDragStart={(event) => handleDragStart(event, index)}
              onDragOver={(event) => {
                if (dragFrom.current !== null) event.preventDefault();
              }}
              onDrop={(event) => handleDrop(event, index)}
              onDragEnd={() => {
                dragFrom.current = null;
              }}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-card-foreground transition-colors',
                !disabled && 'cursor-grab hover:bg-pearl-200',
              )}
            >
              <Icon name="drag" size={18} className="shrink-0 text-text-tertiary" />
              <span className="w-4 shrink-0 text-xs tabular-nums text-text-tertiary">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 text-base">{label}</span>
            </li>
          );
        })}
      </ol>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

/** `bucket_sort`: one bucket select per card; each card must be placed before submit. */
export function BucketsResponse({ question, value, onChange, disabled }: QuizResponseProps) {
  const buckets = question.buckets ?? [];
  const placements: Record<number, number> = value.kind === 'buckets' ? value.placements : {};
  const bucketOptions = buckets.map((label, index) => ({ value: String(index + 1), label }));

  if (buckets.length < 2) {
    return (
      <p role="alert" className="text-sm text-signal">
        This bucket sort question has no buckets yet. Ask your instructor to fix this question.
      </p>
    );
  }

  const place = (answerId: number, bucket: string) => {
    const next: Record<number, number> = { ...placements };
    if (bucket === '') {
      delete next[answerId];
    } else {
      next[answerId] = Number(bucket);
    }
    onChange({ kind: 'buckets', placements: next });
  };

  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="sr-only">Put each card in a bucket</legend>
      {question.options.map((card) => {
        const bucket = placements[card.answerId];
        return (
          <div
            key={card.answerId}
            className="flex flex-col gap-2 rounded-md px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="min-w-0 text-base text-card-foreground">{card.answerText}</span>
            <Select
              aria-label={`Bucket for ${card.answerText}`}
              placeholder="Choose a bucket"
              options={bucketOptions}
              value={bucket === undefined ? '' : String(bucket)}
              onChange={(event) => place(card.answerId, event.target.value)}
              className="sm:w-56"
            />
          </div>
        );
      })}
    </fieldset>
  );
}
