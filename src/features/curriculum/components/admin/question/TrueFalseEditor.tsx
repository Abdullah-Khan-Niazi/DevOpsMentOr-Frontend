import { z } from 'zod';
import { RadioGroup } from '@/shared/components';
import type { AdminQuestionDto, CreateQuestionPayload } from '@/features/curriculum/types/admin';
import {
  commonEmpty,
  commonFromDto,
  commonPayload,
  commonSchemaShape,
  penaltyConfig,
  type TrueFalseForm,
} from './types';
import { QuestionFrame } from './ChoiceEditor';

// True / false (C§6.1: two fixed options, exactly one correct). The answer rows are
// always "True" (answerOrder 1) and "False" (answerOrder 2); the radio picks the correct one.

const TRUE_FALSE_OPTIONS = [
  { value: 'true', label: 'True' },
  { value: 'false', label: 'False' },
] as const;

export function TrueFalseEditor({
  value,
  onChange,
  errors,
}: {
  value: TrueFalseForm;
  onChange(next: TrueFalseForm): void;
  errors: Record<string, string>;
}) {
  return (
    <QuestionFrame value={value} onChange={onChange} errors={errors}>
      <RadioGroup
        label="Correct answer"
        required
        options={TRUE_FALSE_OPTIONS}
        value={value.correct}
        error={errors.correct ?? errors.answers}
        onChange={(correct) => onChange({ ...value, correct })}
      />
    </QuestionFrame>
  );
}

export const trueFalseSchema = z.object({
  ...commonSchemaShape,
  correct: z.enum(['true', 'false'], { error: 'Mark True or False as the correct answer.' }),
});

export function trueFalseEmpty(): TrueFalseForm {
  return { ...commonEmpty(), correct: null };
}

export function trueFalseToPayload(value: TrueFalseForm): CreateQuestionPayload {
  return {
    ...commonPayload(value),
    questionType: 'true_false',
    config: penaltyConfig(value, false),
    answers: [
      { answerText: 'True', isCorrect: value.correct === 'true', answerOrder: 1 },
      { answerText: 'False', isCorrect: value.correct === 'false', answerOrder: 2 },
    ],
  };
}

export function trueFalseFromDto(question: AdminQuestionDto): TrueFalseForm {
  const correct = question.answers.find((answer) => answer.isCorrect);
  return {
    ...commonFromDto(question),
    correct: correct ? (correct.answerOrder === 1 ? 'true' : 'false') : null,
  };
}
