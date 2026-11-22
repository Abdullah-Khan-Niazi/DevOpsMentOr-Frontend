import { z } from 'zod';
import type { AdminQuestionDto, CreateQuestionPayload } from '@/features/curriculum/types/admin';
import {
  INSTRUCTIONS_MAX,
  answerListSchema,
  blankRows,
  commonEmpty,
  commonFromDto,
  commonPayload,
  commonSchemaShape,
  penaltyConfig,
  readRecord,
  rowsFromDto,
  rowsPayload,
  type OrderingForm,
} from './types';
import { MarkdownField } from '../fields/MarkdownField';
import { OptionRows, QuestionFrame } from './ChoiceEditor';

// Ordering (C§6.1: 2..20 items). The rows are listed in the correct order; the answer
// order is the position, so the author sets the sequence by dragging the rows.

export function OrderingEditor({
  value,
  onChange,
  errors,
}: {
  value: OrderingForm;
  onChange(next: OrderingForm): void;
  errors: Record<string, string>;
}) {
  return (
    <QuestionFrame value={value} onChange={onChange} errors={errors}>
      <MarkdownField
        label="Instructions"
        rows={3}
        maxLength={INSTRUCTIONS_MAX}
        value={value.instructions}
        error={errors.instructions}
        onChange={(instructions) => onChange({ ...value, instructions })}
      />
      <OptionRows
        label="Items in correct order"
        noun="Item"
        addLabel="Add item"
        placeholder="Item text"
        rows={value.answers}
        marker="order"
        max={20}
        errors={errors}
        onChange={(answers) => onChange({ ...value, answers })}
      />
    </QuestionFrame>
  );
}

export const orderingSchema = z.object({
  ...commonSchemaShape,
  instructions: z.string().max(INSTRUCTIONS_MAX, {
    error: `Use ${INSTRUCTIONS_MAX} characters or fewer.`,
  }),
  answers: answerListSchema('items', 2, 20),
});

export function orderingEmpty(): OrderingForm {
  return { ...commonEmpty(), instructions: '', answers: blankRows(2) };
}

export function orderingToPayload(value: OrderingForm): CreateQuestionPayload {
  const instructions = value.instructions.trim();
  return {
    ...commonPayload(value),
    questionType: 'ordering',
    config: { ...(instructions ? { instructions } : {}), ...penaltyConfig(value, false) },
    answers: rowsPayload(value.answers, true),
  };
}

export function orderingFromDto(question: AdminQuestionDto): OrderingForm {
  const config = readRecord(question.config);
  return {
    ...commonFromDto(question),
    instructions: typeof config.instructions === 'string' ? config.instructions : '',
    answers: rowsFromDto(question.answers),
  };
}
