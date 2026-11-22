import { useId } from 'react';
import { Select, type SelectOptionItem } from '@/shared/components';
import type { LabAnswerNormalize, LabStepAnswer } from '@/features/labs/types/labSpec';
import { StringListField } from '../fields/StringListField';
import { MAX_ACCEPTED_ANSWERS, MAX_ANSWER_LENGTH, rowIssues } from './labSpecSchema';

// Accepted answers of a question step (1..20) and how the learner's text is matched.
// `issues` are relative to the step ("answer.accepted", "answer.accepted.0").

export interface AnswerEditorProps {
  answer: LabStepAnswer;
  issues: Record<string, string>;
  disabled?: boolean;
  onChange: (next: LabStepAnswer) => void;
}

const NORMALIZE_OPTIONS: SelectOptionItem[] = [
  { value: 'none', label: 'Exact text' },
  { value: 'trim', label: 'Ignore surrounding spaces' },
  { value: 'trim_lower', label: 'Ignore case and surrounding spaces' },
  { value: 'collapse_ws_lower', label: 'Ignore case and extra spaces' },
];

export function AnswerEditor({ answer, issues, disabled = false, onChange }: AnswerEditorProps) {
  const idPrefix = `answer-${useId()}`;

  return (
    <section className="flex flex-col gap-4">
      <StringListField
        id={`${idPrefix}-accepted`}
        label="Accepted answers"
        values={answer.accepted}
        maxItems={MAX_ACCEPTED_ANSWERS}
        maxLength={MAX_ANSWER_LENGTH}
        addLabel="Add answer"
        required
        disabled={disabled}
        errors={rowIssues(issues, 'answer.accepted', answer.accepted.length)}
        error={issues['answer.accepted']}
        onChange={(accepted) => onChange({ ...answer, accepted })}
      />
      <Select
        id={`${idPrefix}-normalize`}
        label="Matching"
        value={answer.normalize}
        options={NORMALIZE_OPTIONS}
        disabled={disabled}
        error={issues['answer.normalize']}
        onChange={(event) =>
          onChange({ ...answer, normalize: event.target.value as LabAnswerNormalize })
        }
      />
    </section>
  );
}
