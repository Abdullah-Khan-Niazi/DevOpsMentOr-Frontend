import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, ErrorState, LoadingState, PageHeader, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { QuizQuestionPanel, type QuizAnswerValue } from '../components/QuizQuestionPanel';
import { QuizResultPanel } from '../components/QuizResultPanel';
import { useQuizMeta, useQuizQuestions, useSubmitQuizAttempt } from '../hooks';
import type { QuizAnswerPayload, QuizAttemptResultDto, QuizQuestionDto } from '../types';

type AnswerMap = Record<number, QuizAnswerValue>;

function isAnswered(question: QuizQuestionDto, answer: QuizAnswerValue | undefined): boolean {
  if (answer === undefined) return false;
  if (question.questionType === 'multiple_select') {
    return Array.isArray(answer) && answer.length > 0;
  }
  if (question.questionType === 'fill_blank') {
    return typeof answer === 'string' && answer.trim().length > 0;
  }
  return typeof answer === 'number';
}

function formatRemaining(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** SCR-F5-02: quiz attempt view (questions, navigation, result card). */
function QuizAttemptView({ quizId }: { quizId: string }) {
  const queryClient = useQueryClient();

  const meta = useQuizMeta(quizId);
  const questionsQuery = useQuizQuestions(quizId);
  const questions = useMemo(() => questionsQuery.data ?? [], [questionsQuery.data]);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [result, setResult] = useState<QuizAttemptResultDto | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const submit = useSubmitQuizAttempt(quizId);

  const timeLimitSeconds = meta.data?.timeLimitMinutes ? meta.data.timeLimitMinutes * 60 : null;

  const elapsedSeconds = Math.floor((now - startedAt) / 1000);
  const isExpired =
    timeLimitSeconds !== null && elapsedSeconds >= timeLimitSeconds && questions.length > 0;
  const timeLeftSeconds =
    timeLimitSeconds !== null ? Math.max(0, timeLimitSeconds - elapsedSeconds) : null;

  const ticking = timeLimitSeconds !== null && result === null && !isExpired;

  useEffect(() => {
    if (!ticking) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [ticking]);

  const unanswered = useMemo(
    () => questions.filter((question) => !isAnswered(question, answers[question.questionId])),
    [questions, answers],
  );

  const handleChange = (questionId: number, value: QuizAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (isExpired) {
      toast.error('Time is up. This attempt cannot be submitted.');
      return;
    }
    if (unanswered.length > 0) {
      const confirmed = window.confirm(
        `${unanswered.length} question${unanswered.length === 1 ? ' is' : 's are'} unanswered. Submit anyway?`,
      );
      if (!confirmed) return;
    }

    const payloadAnswers = questions
      .map((question): QuizAnswerPayload[] => {
        const value = answers[question.questionId];
        if (question.questionType === 'multiple_select' && Array.isArray(value)) {
          return value.map((answerId) => ({ questionId: question.questionId, answerId }));
        }
        if (question.questionType === 'fill_blank' || typeof value === 'string') {
          return [
            { questionId: question.questionId, answerText: typeof value === 'string' ? value : '' },
          ];
        }
        return [{ questionId: question.questionId, answerId: value as number }];
      })
      .flat();

    submit.mutate(
      { answers: payloadAnswers, timeTakenSeconds: Math.floor((Date.now() - startedAt) / 1000) },
      {
        onSuccess: (data) => {
          setResult(data);
          void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.progress.quizAttempts(quizId),
          });
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  if (meta.isLoading || questionsQuery.isLoading) {
    return <LoadingState label="Loading quiz…" />;
  }

  if (meta.isError || questionsQuery.isError || !meta.data) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Quiz" />
        <ErrorState
          message={meta.error?.message ?? questionsQuery.error?.message ?? 'Quiz unavailable.'}
          onRetry={() => {
            void meta.refetch();
            void questionsQuery.refetch();
          }}
        />
      </div>
    );
  }

  const question = questions[current];
  const total = questions.length;

  if (result) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title={meta.data.title}
          description={`Passing score: ${meta.data.passingScore}%`}
          actions={
            <Link
              to={ROUTES.LEARN}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              ← Back to curriculum
            </Link>
          }
        />
        <QuizResultPanel
          result={result}
          onRetry={() => {
            setResult(null);
            setAnswers({});
            setCurrent(0);
            setStartedAt(Date.now());
            setNow(Date.now());
          }}
        />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title={meta.data.title} />
        <ErrorState message="This quiz has no questions yet." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={meta.data.title}
        description={`Question ${current + 1} of ${total} · Passing score: ${meta.data.passingScore}%`}
        actions={
          <div className="flex items-center gap-3">
            {timeLimitSeconds !== null ? (
              <span
                className={`text-sm font-semibold tabular-nums ${
                  isExpired ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                Time remaining: {formatRemaining(timeLeftSeconds ?? 0)}
              </span>
            ) : null}
            <Link
              to={ROUTES.LEARN}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              ← Back to curriculum
            </Link>
          </div>
        }
      />

      {isExpired ? (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Time is up. Submit is disabled and this attempt cannot be recorded.
        </div>
      ) : null}

      <QuizQuestionPanel
        question={question}
        index={current}
        total={total}
        answer={answers[question.questionId]}
        onChange={handleChange}
      />

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          Previous
        </Button>

        {current < total - 1 ? (
          <Button onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} isLoading={submit.isPending} disabled={isExpired}>
            Submit quiz
          </Button>
        )}
      </div>
    </div>
  );
}

/** SCR-F5-02 route entry; keyed by quizId so state resets between quizzes. */
export function QuizAttemptPage() {
  const { quizId = '' } = useParams<{ quizId: string }>();
  return <QuizAttemptView key={quizId} quizId={quizId} />;
}

export default QuizAttemptPage;
