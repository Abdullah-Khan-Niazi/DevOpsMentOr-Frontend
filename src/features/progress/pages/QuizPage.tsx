import type { ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useAttempt,
  useQuizReview,
  useQuizStatus,
  useStartAttempt,
} from '@/features/progress/hooks/useQuiz';
import { QuizIntro } from '@/features/progress/components/quiz/QuizIntro';
import { QuizReview } from '@/features/progress/components/quiz/QuizReview';
import { QuizRunner } from '@/features/progress/components/quiz/QuizRunner';
import { Button, EmptyState, ErrorState, PageHeader } from '@/shared/components';
import { ERROR_CODES, ROUTES } from '@/shared/constants';
import { getStatusCode, hasCode } from '@/shared/services';
import { QuizPageSkeleton } from './QuizPageSkeleton';

/** A positive integer from a route or query value; null when it is not one. */
function positiveInt(value: string | null | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 ? parsed : null;
}

/** Review of a passed attempt (C§4.4). Questions label the option texts of the review. */
function ReviewView({ attemptId, onBack }: { attemptId: number; onBack: () => void }) {
  const review = useQuizReview(attemptId);
  const attempt = useAttempt(attemptId);

  if (review.isPending) return <QuizPageSkeleton variant="intro" />;
  if (review.isError) {
    return (
      <div className="flex w-full flex-col gap-6">
        <PageHeader onBack={onBack} />
        <ErrorState error={review.error} onRetry={() => void review.refetch()} />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <PageHeader onBack={onBack} />
      <QuizReview review={review.data} questions={attempt.data?.attempt.questions} />
    </div>
  );
}

/**
 * Quiz page (LEARN_QUIZ). Status decides the landing view; `?attempt=` opens the runner and
 * `?view=review` the review (of `?attempt=` or of the first passed attempt). Renders its own
 * skeleton while loading, and 403/404 states for a quiz the learner cannot open.
 */
export function QuizPage() {
  const { quizId: quizParam } = useParams<{ quizId: string }>();
  const quizId = positiveInt(quizParam);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = useQuizStatus(quizId);
  const start = useStartAttempt(quizId ?? 0);

  const attemptId = positiveInt(searchParams.get('attempt'));
  const reviewing = searchParams.get('view') === 'review';

  const backToLearn = (
    <Button variant="secondary" onClick={() => navigate(ROUTES.LEARN)}>
      Back to learn
    </Button>
  );
  const frame = (children: ReactNode) => (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">{children}</div>
  );

  if (quizId === null) {
    return frame(<EmptyState icon="error" title="Quiz not found" action={backToLearn} />);
  }

  if (status.isPending) return <QuizPageSkeleton variant="intro" />;

  if (status.isError) {
    const code = getStatusCode(status.error);
    if (hasCode(status.error, ERROR_CODES.QUIZ_NOT_FOUND) || code === 404) {
      return frame(<EmptyState icon="error" title="Quiz not found" action={backToLearn} />);
    }
    if (code === 403 || hasCode(status.error, ERROR_CODES.COURSE_ACCESS_DENIED)) {
      return frame(
        <EmptyState icon="lock" title="You do not have access to this quiz" action={backToLearn} />,
      );
    }
    return frame(<ErrorState error={status.error} onRetry={() => void status.refetch()} />);
  }

  const quiz = status.data;

  const startAttempt = () => {
    start.mutate(undefined, {
      onSuccess: (attempt) => {
        setSearchParams({ attempt: String(attempt.attemptId), q: '1' });
      },
    });
  };

  const resumeAttempt = () => {
    if (quiz.openAttemptId !== null) {
      setSearchParams({ attempt: String(quiz.openAttemptId) });
    }
  };

  const showReview = () => setSearchParams({ view: 'review' });
  const backToIntro = () => setSearchParams({});

  if (attemptId !== null && reviewing) {
    return frame(<ReviewView attemptId={attemptId} onBack={backToIntro} />);
  }

  if (attemptId !== null) {
    return frame(
      <>
        <PageHeader title={quiz.title} backTo={ROUTES.LEARN} />
        <QuizRunner key={attemptId} attemptId={attemptId} />
      </>,
    );
  }

  if (reviewing && quiz.passedAttemptId !== null) {
    return frame(<ReviewView attemptId={quiz.passedAttemptId} onBack={backToIntro} />);
  }

  return frame(
    <div className="w-full max-w-3xl">
      <QuizIntro
        status={quiz}
        onStart={startAttempt}
        onResume={resumeAttempt}
        onReview={showReview}
        onRetryAvailable={() => void status.refetch()}
        startPending={start.isPending}
        startError={start.error ?? null}
      />
    </div>,
  );
}

export default QuizPage;
