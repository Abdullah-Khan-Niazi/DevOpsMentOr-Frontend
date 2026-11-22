import { z } from 'zod';
import type { AdminQuestionDto, CreateQuestionPayload } from '@/features/curriculum/types/admin';
import {
  answerListSchema,
  blankRows,
  commonEmpty,
  commonFromDto,
  commonPayload,
  commonSchemaShape,
  penaltyConfig,
  rowsFromDto,
  rowsPayload,
  type MultiSelectForm,
} from './types';
import { OptionRows, QuestionFrame } from './ChoiceEditor';

// Multiple select (C§6.1: 2..10 options, at least one correct, any number of checkboxes).

export function MultiSelectEditor({
  value,
  onChange,
  errors,
}: {
  value: MultiSelectForm;
  onChange(next: MultiSelectForm): void;
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
        marker="checkbox"
        max={10}
        errors={errors}
        onChange={(answers) => onChange({ ...value, answers })}
      />
    </QuestionFrame>
  );
}

export const multiSelectSchema = z.object({
  ...commonSchemaShape,
  answers: answerListSchema('options', 2, 10).superRefine((rows, ctx) => {
    if (!rows.some((row) => row.isCorrect)) {
      ctx.addIssue({ code: 'custom', message: 'Mark at least one correct option.' });
    }
  }),
});

export function multiSelectEmpty(): MultiSelectForm {
  return { ...commonEmpty(), answers: blankRows(2) };
}

export function multiSelectToPayload(value: MultiSelectForm): CreateQuestionPayload {
  return {
    ...commonPayload(value),
    questionType: 'multiple_select',
    config: penaltyConfig(value, false),
    answers: rowsPayload(value.answers),
  };
}

export function multiSelectFromDto(question: AdminQuestionDto): MultiSelectForm {
  return { ...commonFromDto(question), answers: rowsFromDto(question.answers) };
}
