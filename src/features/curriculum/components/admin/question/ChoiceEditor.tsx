import { useId, type ReactNode } from 'react';
import { z } from 'zod';
import {
  Button,
  Checkbox,
  FieldError,
  IconButton,
  Input,
  Textarea,
  NumberInput,
  Switch,
} from '@/shared/components';
import type { AdminQuestionDto, CreateQuestionPayload } from '@/features/curriculum/types/admin';
import { MarkdownField } from '../fields/MarkdownField';
import { PenaltyFields } from '../fields/PenaltyFields';
import { ReorderList } from '../ReorderList';
import {
  ANSWER_TEXT_MAX,
  EXPLANATION_MAX,
  QUESTION_TEXT_MAX,
  answerListSchema,
  blankRow,
  blankRows,
  commonEmpty,
  commonFromDto,
  commonPayload,
  commonSchemaShape,
  penaltyConfig,
  rowsFromDto,
  rowsPayload,
  type ChoiceForm,
  type OptionRow,
  type QuestionCommonValues,
} from './types';

// Shared pieces of the per-type editors. `QuestionFrame` renders the fields every type
// edits (question text, points, active, penalties, explanation) around the type section.
// `OptionRows` is the answer-row list: radio or checkbox correct markers, plain rows, or
// a reorderable list. The multiple choice editor is defined here too.

export interface QuestionFrameProps<T extends QuestionCommonValues> {
  value: T;
  onChange(next: T): void;
  errors: Record<string, string>;
  /** Shows the guess cost (terminal answer mode only). */
  showGuess?: boolean;
  /** The type-specific answer section. */
  children?: ReactNode;
}

export function QuestionFrame<T extends QuestionCommonValues>({
  value,
  onChange,
  errors,
  showGuess = false,
  children,
}: QuestionFrameProps<T>) {
  const update = (patch: Partial<QuestionCommonValues>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-6">
      <Textarea
        label="Question"
        required
        rows={3}
        maxLength={QUESTION_TEXT_MAX}
        showCount
        value={value.questionText}
        error={errors.questionText}
        onChange={(event) => update({ questionText: event.target.value })}
      />

      {children}

      <div className="flex flex-wrap items-end gap-6">
        <NumberInput
          label="Points"
          required
          className="w-32"
          value={value.points}
          error={errors.points}
          onValueChange={(points) => update({ points })}
        />
        <Switch
          label="Active"
          checked={value.isActive}
          onCheckedChange={(isActive) => update({ isActive })}
        />
      </div>

      <PenaltyFields
        wrongPenalty={value.wrongPenalty}
        guessPenalty={value.guessPenalty}
        showGuess={showGuess}
        errors={errors}
        onChange={(next) => update(next)}
      />

      <MarkdownField
        label="Explanation"
        rows={4}
        maxLength={EXPLANATION_MAX}
        value={value.explanation}
        error={errors.explanation}
        onChange={(explanation) => update({ explanation })}
      />
    </div>
  );
}

export type OptionMarker = 'none' | 'radio' | 'checkbox' | 'order';

export interface OptionRowsProps {
  label: string;
  /** Singular noun for row labels and remove buttons, for example "Option". */
  noun: string;
  addLabel: string;
  rows: OptionRow[];
  onChange(next: OptionRow[]): void;
  marker: OptionMarker;
  max: number;
  errors: Record<string, string>;
  placeholder?: string;
}

function reorderRows(rows: OptionRow[], ids: Array<number | string>): OptionRow[] {
  const byKey = new Map(rows.map((row) => [row.key, row] as const));
  return ids.flatMap((id) => {
    const row = byKey.get(String(id));
    return row ? [row] : [];
  });
}

/**
 * Answer rows. Errors use `answers.N.answerText` (row) and `answers` (list), the same
 * paths the server reports. Markers: `radio` = exactly one correct, `checkbox` = any
 * number, `none` = no marker, `order` = drag to reorder (position is the answer order).
 */
export function OptionRows({
  label,
  noun,
  addLabel,
  rows,
  onChange,
  marker,
  max,
  errors,
  placeholder,
}: OptionRowsProps) {
  const groupName = `options-${useId()}`;
  const full = rows.length >= max;

  function updateRow(index: number, patch: Partial<OptionRow>) {
    onChange(rows.map((row, position) => (position === index ? { ...row, ...patch } : row)));
  }

  function markOnly(index: number) {
    onChange(rows.map((row, position) => ({ ...row, isCorrect: position === index })));
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, position) => position !== index));
  }

  function renderRow(row: OptionRow, index: number) {
    return (
      <div className="flex items-start gap-2">
        {marker === 'radio' ? (
          <input
            type="radio"
            name={groupName}
            className="field-check__input mt-2.5"
            aria-label={`Correct ${noun.toLowerCase()} ${index + 1}`}
            checked={row.isCorrect}
            onChange={() => markOnly(index)}
          />
        ) : null}
        {marker === 'checkbox' ? (
          <Checkbox
            className="mt-2"
            aria-label={`Correct ${noun.toLowerCase()} ${index + 1}`}
            checked={row.isCorrect}
            onChange={(event) => updateRow(index, { isCorrect: event.target.checked })}
            label={<span className="sr-only">Correct</span>}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <Input
            aria-label={`${noun} ${index + 1}`}
            placeholder={placeholder}
            maxLength={ANSWER_TEXT_MAX}
            value={row.answerText}
            error={errors[`answers.${index}.answerText`]}
            onChange={(event) => updateRow(index, { answerText: event.target.value })}
          />
        </div>
        <IconButton
          icon="delete"
          label={`Remove ${noun.toLowerCase()} ${index + 1}`}
          tone="danger"
          className="mt-1"
          onClick={() => removeRow(index)}
        />
      </div>
    );
  }

  const body =
    marker === 'order' ? (
      <ReorderList
        ariaLabel={label}
        items={rows}
        getId={(row) => row.key}
        renderItem={(row) => renderRow(row, rows.indexOf(row))}
        onReorder={(ids) => onChange(reorderRows(rows, ids))}
      />
    ) : (
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={row.key}>{renderRow(row, index)}</div>
        ))}
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      <span className="input-label">{label}</span>
      {body}
      <FieldError message={errors.answers} />
      <div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          iconName="plus"
          disabled={full}
          onClick={() => onChange([...rows, blankRow()])}
        >
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

/* ── Multiple choice (C§6.1: 2..10 answers, exactly one correct) ──────── */

export function ChoiceEditor({
  value,
  onChange,
  errors,
}: {
  value: ChoiceForm;
  onChange(next: ChoiceForm): void;
  errors: Record<string, string>;
}) {
  return (
    <QuestionFrame value={value} onChange={onChange} errors={errors}>
      <OptionRows
        label="Options"
        noun="Option"
        addLabel="Add option"
        placeholder="Option text"
        rows={value.answers}
        marker="radio"
        max={10}
        errors={errors}
        onChange={(answers) => onChange({ ...value, answers })}
      />
    </QuestionFrame>
  );
}

export const choiceSchema = z.object({
  ...commonSchemaShape,
  answers: answerListSchema('options', 2, 10).superRefine((rows, ctx) => {
    if (rows.filter((row) => row.isCorrect).length !== 1) {
      ctx.addIssue({ code: 'custom', message: 'Mark exactly one correct option.' });
    }
  }),
});

export function choiceEmpty(): ChoiceForm {
  return { ...commonEmpty(), answers: blankRows(2) };
}

export function choiceToPayload(value: ChoiceForm): CreateQuestionPayload {
  return {
    ...commonPayload(value),
    questionType: 'multiple_choice',
    config: penaltyConfig(value, false),
    answers: rowsPayload(value.answers),
  };
}

export function choiceFromDto(question: AdminQuestionDto): ChoiceForm {
  return { ...commonFromDto(question), answers: rowsFromDto(question.answers) };
}
