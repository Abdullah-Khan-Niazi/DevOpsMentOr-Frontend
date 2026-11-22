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
  type FillBlankForm,
} from './types';
import { OptionRows, QuestionFrame } from './ChoiceEditor';

// Fill in the blank (C§6.1: 1..20 accepted answers, all correct). The server grades a
// learner's text with collapse_ws_lower (C§4.4), so the accepted list is the whole rule.

export function FillBlankEditor({
  value,
  onChange,
  errors,
}: {
  value: FillBlankForm;
  onChange(next: FillBlankForm): void;
  errors: Record<string, string>;
}) {
  return (
    <QuestionFrame value={value} onChange={onChange} errors={errors}>
      <OptionRows
        label="Accepted answers"
        noun="Accepted answer"
        addLabel="Add accepted answer"
        placeholder="Accepted answer text"
        rows={value.answers}
        marker="none"
        max={20}
        errors={errors}
        onChange={(answers) => onChange({ ...value, answers })}
      />
    </QuestionFrame>
  );
}

export const fillBlankSchema = z.object({
  ...commonSchemaShape,
  answers: answerListSchema('accepted answers', 1, 20),
});

export function fillBlankEmpty(): FillBlankForm {
  return { ...commonEmpty(), answers: blankRows(1) };
}

export function fillBlankToPayload(value: FillBlankForm): CreateQuestionPayload {
  return {
    ...commonPayload(value),
    questionType: 'fill_blank',
    config: penaltyConfig(value, false),
    answers: rowsPayload(value.answers, true),
  };
}

export function fillBlankFromDto(question: AdminQuestionDto): FillBlankForm {
  return { ...commonFromDto(question), answers: rowsFromDto(question.answers) };
}
