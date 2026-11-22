import type { LearnerQuizQuestionDto, QuizReviewDto } from '@/features/progress/types';
import { Icon } from '@/shared/components/Icon';
import { Markdown } from '@/shared/components/Markdown';

export interface QuizReviewProps {
  review: QuizReviewDto;
  /**
   * Questions of the reviewed attempt (`useAttempt(review.attemptId)`): the review DTO carries
   * answer ids only, so option texts and bucket labels are looked up here. Without them an id
   * reads as "Answer <id>".
   */
  questions?: ReadonlyArray<LearnerQuizQuestionDto>;
}

/** Option texts and bucket labels of one question, keyed for the line builders. */
interface Labels {
  answer: (answerId: number) => string;
  bucket: (bucket: number) => string;
}

function labelsFor(question: LearnerQuizQuestionDto | undefined): Labels {
  const texts = new Map(question?.options.map((option) => [option.answerId, option.answerText]));
  const buckets = question?.buckets ?? [];
  return {
    answer: (answerId) => texts.get(answerId) ?? `Answer ${answerId}`,
    bucket: (bucket) => buckets[bucket - 1] ?? `bucket ${bucket}`,
  };
}

type ReviewQuestion = QuizReviewDto['questions'][number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numbersOf(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number')
    : [];
}

function parseJsonRecord(value: string): Record<string, unknown> | null {
  if (!value.trimStart().startsWith('{')) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** One line per chosen item of the learner's response; unknown shapes read as "Submitted". */
function yourResponseLines(value: unknown, labels: Labels): string[] {
  if (typeof value === 'string') {
    // The server stores the submitted response as JSON text; plain text answers stay as is.
    const parsed = parseJsonRecord(value);
    return parsed ? yourResponseLines(parsed, labels) : [value];
  }
  if (!isRecord(value)) return ['No answer recorded'];
  if (value.type === 'terminal_check') return ['Checked in the lab environment'];
  if (typeof value.text === 'string') return [value.text];
  if (typeof value.answerId === 'number') return [labels.answer(value.answerId)];
  const ids = numbersOf(value.answerIds);
  if (ids.length > 0) {
    return value.type === 'ordering'
      ? ids.map((id, index) => `${index + 1}. ${labels.answer(id)}`)
      : ids.map(labels.answer);
  }
  if (Array.isArray(value.placements)) {
    return value.placements.filter(isRecord).map((placement) => {
      const answerId = typeof placement.answerId === 'number' ? placement.answerId : 0;
      const bucket = typeof placement.bucket === 'number' ? placement.bucket : 0;
      return `${labels.answer(answerId)} in ${labels.bucket(bucket)}`;
    });
  }
  return ['Submitted'];
}

function correctLines(correct: ReviewQuestion['correct'], labels: Labels): string[] {
  if (!correct) return ['Not shown'];
  if (typeof correct.text === 'string') return [correct.text];
  const ordered = numbersOf(correct.orderedAnswerIds);
  if (ordered.length > 0) return ordered.map((id, index) => `${index + 1}. ${labels.answer(id)}`);
  const ids = numbersOf(correct.answerIds);
  if (ids.length > 0) return ids.map(labels.answer);
  if (correct.placements && correct.placements.length > 0) {
    return correct.placements.map(
      (placement) => `${labels.answer(placement.answerId)} in ${labels.bucket(placement.bucket)}`,
    );
  }
  return ['Not shown'];
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {lines.map((line, index) => (
        <li key={`${index}-${line}`}>{line}</li>
      ))}
    </ul>
  );
}

/** Post-pass review: per question, the learner's response next to the correct one. */
export function QuizReview({ review, questions }: QuizReviewProps) {
  const correctCount = review.questions.filter((question) => question.isCorrect).length;
  const byId = new Map(questions?.map((question) => [question.questionId, question]));

  return (
    <section className="flex flex-col gap-6">
      <p className="text-sm tabular-nums text-text-secondary">
        {correctCount} of {review.questions.length} correct
      </p>
      <ol className="flex flex-col gap-6">
        {review.questions.map((question, index) => {
          const labels = labelsFor(byId.get(question.questionId));
          return (
            <li key={question.questionId} className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Icon
                  name={question.isCorrect ? 'check-circle' : 'x-circle'}
                  size={20}
                  className={question.isCorrect ? 'text-check-success' : 'text-signal'}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <p className="text-sm font-semibold text-card-foreground">Question {index + 1}</p>
                  <Markdown variant="compact">{question.questionText}</Markdown>
                </div>
              </div>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 pl-7 text-sm">
                <dt className="text-text-tertiary">Your answer</dt>
                <dd className="text-card-foreground">
                  <Lines lines={yourResponseLines(question.yourResponse, labels)} />
                </dd>
                <dt className="text-text-tertiary">Correct answer</dt>
                <dd className="text-card-foreground">
                  <Lines lines={correctLines(question.correct, labels)} />
                </dd>
              </dl>
              {question.explanation ? (
                <div className="pl-7">
                  <Markdown variant="compact">{question.explanation}</Markdown>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
