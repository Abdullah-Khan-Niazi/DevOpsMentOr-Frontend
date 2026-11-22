import type { ReactNode } from 'react';
import type { LearnerQuizQuestionDto, QuizAnswerResultDto } from '@/features/progress/types';
import { Markdown } from '@/shared/components/Markdown';
import { pluralize } from '@/shared/utils';
import { AnswerFeedback } from './AnswerFeedback';
import {
  BucketsResponse,
  ChoiceResponse,
  MultiResponse,
  OrderingResponse,
  TextResponse,
  responseKindOf,
  type QuizAnswerDraft,
} from './QuestionResponses';

export interface QuestionViewProps {
  question: LearnerQuizQuestionDto;
  value: QuizAnswerDraft;
  onChange: (next: QuizAnswerDraft) => void;
  disabled: boolean;
  /** Result of this answer. Omitted falls back to `question.response`; null hides feedback. */
  feedback?: QuizAnswerResultDto | null;
  /** Terminal environment pane, rendered only for terminal questions. */
  terminalSlot?: ReactNode;
}

/**
 * One quiz question: text, instructions, the response editor for its type, the per-question XP
 * cost and the feedback once answered. Answered questions are read-only.
 */
export function QuestionView({
  question,
  value,
  onChange,
  disabled,
  feedback,
  terminalSlot,
}: QuestionViewProps) {
  const result = feedback === undefined ? question.response : feedback;
  const locked = disabled || result !== null;
  const editorProps = { question, value, onChange, disabled: locked };
  const kind = responseKindOf(question);

  let editor: ReactNode;
  switch (kind) {
    case 'choice':
      editor = <ChoiceResponse {...editorProps} />;
      break;
    case 'multi':
      editor = <MultiResponse {...editorProps} />;
      break;
    case 'text':
      editor = <TextResponse {...editorProps} />;
      break;
    case 'ordering':
      editor = <OrderingResponse {...editorProps} />;
      break;
    case 'buckets':
      editor = <BucketsResponse {...editorProps} />;
      break;
    case 'check':
      // Terminal check questions are answered by the lab check; the terminal pane is the whole UI.
      editor = null;
      break;
    default:
      editor = (
        <p role="alert" className="text-sm text-signal">
          This question type is not supported by the quiz player yet. Ask your instructor to fix
          this question.
        </p>
      );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm tabular-nums text-text-tertiary">
          {pluralize(question.points, 'point', 'points')}
        </p>
        <Markdown variant="compact">{question.questionText}</Markdown>
        {question.instructions ? (
          <Markdown variant="compact">{question.instructions}</Markdown>
        ) : null}
      </div>

      {question.questionType === 'terminal' ? terminalSlot : null}

      {editor}

      {question.penalties.wrongAnswer > 0 || question.penalties.guess > 0 ? (
        <div className="flex flex-col gap-1 text-sm text-text-secondary">
          {question.penalties.wrongAnswer > 0 ? (
            <p>A wrong answer costs {question.penalties.wrongAnswer} XP.</p>
          ) : null}
          {question.penalties.guess > 0 ? (
            <p>Guessing without running the command costs {question.penalties.guess} XP.</p>
          ) : null}
        </div>
      ) : null}

      {result ? <AnswerFeedback result={result} /> : null}
    </div>
  );
}
