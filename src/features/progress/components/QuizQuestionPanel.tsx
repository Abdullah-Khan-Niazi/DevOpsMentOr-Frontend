import type { QuizQuestionDto } from '../types';

export type QuizAnswerValue = number | string | number[];
export type QuizAnswerState = Record<number, QuizAnswerValue>;

interface QuizQuestionPanelProps {
  question: QuizQuestionDto;
  index: number;
  total: number;
  answer: QuizAnswerValue | undefined;
  onChange: (questionId: number, value: QuizAnswerValue) => void;
}

function AnswerOptionList({
  question,
  answer,
  onChange,
}: Pick<QuizQuestionPanelProps, 'question' | 'answer' | 'onChange'>) {
  const selected: number[] = typeof answer === 'object' && Array.isArray(answer) ? answer : [];

  if (question.questionType === 'fill_blank') {
    return (
      <input
        id={`question-${question.questionId}`}
        className="input-field mt-4 w-full"
        placeholder="Type your answer…"
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onChange(question.questionId, e.target.value)}
      />
    );
  }

  const isMultiple = question.questionType === 'multiple_select';

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
      <legend className="sr-only">Answer options</legend>
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

/** SCR-F5-02: one question with its answer controls. */
export function QuizQuestionPanel({
  question,
  index,
  total,
  answer,
  onChange,
}: QuizQuestionPanelProps) {
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
      <AnswerOptionList question={question} answer={answer} onChange={onChange} />
      {index === total - 1 ? (
        <p className="mt-4 text-xs text-muted-foreground">Review your answers before submitting.</p>
      ) : null}
    </div>
  );
}

export default QuizQuestionPanel;
