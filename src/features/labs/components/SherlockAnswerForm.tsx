import { useState } from 'react';
import { Button, toast } from '@/shared/components';
import { useSubmitSherlockAnswers } from '../hooks';
import type { SherlockDetailDto } from '../types';

interface SherlockAnswerFormProps {
  labId: number;
  sherlock: SherlockDetailDto;
}

/** SCR-F6-03: dynamic answer form; all questions must be non-empty to submit. */
export function SherlockAnswerForm({ labId, sherlock }: SherlockAnswerFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const submit = useSubmitSherlockAnswers(labId);

  const allAnswered = sherlock.questions.every(
    (question) => (answers[question.id] ?? '').trim().length > 0,
  );

  const onSubmit = (): void => {
    if (!allAnswered) {
      toast.error('All questions must have an answer before submitting.');
      return;
    }
    submit.mutate(
      sherlock.questions.map((question) => ({
        questionId: question.id,
        answer: answers[question.id] ?? '',
      })),
      {
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="sherlock-form" data-testid="sherlock-answer-form">
      {sherlock.questions.map((question) => {
        const result = submit.data?.results.find((r) => r.questionId === question.id);
        return (
          <div key={question.id} className="sherlock-form__question">
            <label className="sherlock-form__label">
              {question.text}
              {question.hint && <span className="sherlock-form__hint">{question.hint}</span>}
            </label>
            <input
              className="sherlock-form__input"
              value={answers[question.id] ?? ''}
              disabled={submit.isPending}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))
              }
            />
            {result && (
              <span
                className={`sherlock-form__result sherlock-form__result--${result.passed ? 'pass' : 'fail'}`}
              >
                {result.passed ? 'Correct' : 'Incorrect'}
              </span>
            )}
          </div>
        );
      })}
      <div className="sherlock-form__actions">
        <Button
          onClick={onSubmit}
          isLoading={submit.isPending}
          disabled={!allAnswered || submit.isPending}
        >
          Submit Answers
        </Button>
        {submit.data && (
          <span
            className={`sherlock-form__summary sherlock-form__summary--${submit.data.isPassed ? 'pass' : 'fail'}`}
          >
            Score {submit.data.score}% · {submit.data.isPassed ? 'Lab completed' : 'Keep trying'}
          </span>
        )}
      </div>
    </div>
  );
}

export default SherlockAnswerForm;
