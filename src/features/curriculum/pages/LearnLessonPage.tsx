import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  EmptyState,
  ErrorState,
  Icon,
  Markdown,
  PageHeader,
  XpDelta,
  toast,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { getStatusCode, hasCode, isApiError } from '@/shared/services';
import { safeHttpUrl } from '@/shared/utils';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  useCompleteLesson,
  useModuleItemsProgress,
  useStartLesson,
} from '@/features/progress/hooks';
import type { CourseAccessReason } from '@/features/curriculum/types';
import { useCourseSequence, useLearnLesson } from '../hooks';
import { AccessDeniedState } from '../components/learn/AccessDeniedState';
import { CourseCompleteOverlay } from '../components/learn/CourseCompleteOverlay';
import { LessonPager } from '../components/learn/LessonPager';
import { SlideDeck } from '../components/learn/SlideDeck';
import { LessonPageSkeleton } from './LessonPageSkeleton';

const CourseOutlineDrawer = lazy(() =>
  import('../components/learn/CourseOutlineDrawer').then((module) => ({
    default: module.CourseOutlineDrawer,
  })),
);

/** Upper bound of the client-measured reading time sent with `complete`. */
const MAX_TIME_SPENT_SECONDS = 3600;
const AUTO_PROCEED_DELAY_MS = 1_200;

const ACCESS_REASONS: ReadonlyArray<CourseAccessReason> = [
  'platform_admin',
  'unpublished',
  'free',
  'assigned',
  'org_subscription',
  'not_entitled',
];

function toAccessReason(value: string | undefined): CourseAccessReason | null {
  return ACCESS_REASONS.find((reason) => reason === value) ?? null;
}

interface LessonViewProps {
  lessonId: string;
}

/** Lesson body for one item. Mounted with `key={lessonId}`, so timing and start state reset per item. */
function LessonView({ lessonId }: LessonViewProps) {
  const navigate = useNavigate();

  const lessonQuery = useLearnLesson(lessonId);
  const lesson = lessonQuery.data;
  const moduleId = lesson?.moduleId ?? null;
  const sequence = useCourseSequence({
    courseId: lesson?.courseId ?? null,
    moduleId,
    currentItemId: lesson?.lessonId ?? null,
    enabled: Boolean(lesson && lesson.kind === 'lesson'),
  });
  const progressQuery = useModuleItemsProgress(moduleId, Boolean(lesson));

  const canWriteProgress = useAuthStore((state) =>
    (state.user?.permissions ?? []).includes('progress.self.write'),
  );
  const startLesson = useStartLesson();
  const completeLesson = useCompleteLesson();
  const startRequestedRef = useRef<number | null>(null);
  const [startedLessonId, setStartedLessonId] = useState<number | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (!canWriteProgress || !lesson || lesson.kind !== 'lesson') return;
    if (startRequestedRef.current === lesson.lessonId) return;
    startRequestedRef.current = lesson.lessonId;
    startLesson.mutate(lesson.lessonId, {
      onSuccess: () => setStartedLessonId(lesson.lessonId),
    });
  }, [canWriteProgress, lesson, startLesson]);

  const nextTargetUrl = sequence.nextItem?.to ?? null;
  const crossesModule = sequence.nextItem?.crossesModule ?? false;

  useEffect(() => {
    if (!justCompleted || !sequence.ready || nextTargetUrl === null) return undefined;
    toast.success(
      crossesModule
        ? 'Module complete — opening next module…'
        : 'Lesson complete — opening next item…',
    );
    const timer = window.setTimeout(() => {
      navigate(nextTargetUrl);
    }, AUTO_PROCEED_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [justCompleted, sequence.ready, nextTargetUrl, crossesModule, navigate]);

  if (lessonQuery.isPending) return <LessonPageSkeleton />;

  if (lessonQuery.isError || !lesson) {
    const error = lessonQuery.error;
    if (hasCode(error, ERROR_CODES.COURSE_ACCESS_DENIED)) {
      const detail = isApiError(error) ? error.errors[0] : undefined;
      return (
        <div className="w-full py-8">
          <AccessDeniedState
            reason={toAccessReason(detail?.reason)}
            onBack={() => navigate(ROUTES.LEARN)}
          />
        </div>
      );
    }
    if (getStatusCode(error) === 404) {
      return (
        <div className="w-full py-8">
          <EmptyState
            icon="search"
            title="Lesson not found"
            action={
              <Button variant="secondary" onClick={() => navigate(ROUTES.LEARN)}>
                Back to Learn
              </Button>
            }
          />
        </div>
      );
    }
    return (
      <div className="w-full py-8">
        <ErrorState error={error} onRetry={() => void lessonQuery.refetch()} />
      </div>
    );
  }

  // Lab and quiz items share the lesson route; the server answers the item kind.
  if (lesson.kind === 'lab' && lesson.labId !== null) {
    return (
      <Navigate
        replace
        to={`${ROUTES.LEARN_LAB.replace(':labId', String(lesson.labId))}?itemId=${lesson.lessonId}`}
      />
    );
  }
  if (lesson.kind === 'quiz' && lesson.quizId !== null) {
    return <Navigate replace to={ROUTES.LEARN_QUIZ.replace(':quizId', String(lesson.quizId))} />;
  }

  const prevTarget = sequence.prevItem
    ? { title: sequence.prevItem.title, to: sequence.prevItem.to }
    : null;
  const nextTarget = sequence.nextItem
    ? { title: sequence.nextItem.title, to: sequence.nextItem.to }
    : null;

  const isCompleted =
    progressQuery.data?.some((item) => item.itemId === lesson.lessonId && item.isCompleted) ??
    false;
  const canComplete = startedLessonId === lesson.lessonId && !isCompleted;
  const completion = completeLesson.data;

  const retryStart = () => {
    startLesson.mutate(lesson.lessonId, {
      onSuccess: () => setStartedLessonId(lesson.lessonId),
    });
  };

  const handleComplete = () => {
    const timeSpentSeconds = Math.min(
      MAX_TIME_SPENT_SECONDS,
      Math.floor((Date.now() - startedAt) / 1000),
    );
    completeLesson.mutate(
      { lessonId: lesson.lessonId, payload: { timeSpentSeconds } },
      {
        onSuccess: () => {
          setJustCompleted(true);
        },
      },
    );
  };

  let body: ReactNode;
  if (lesson.contentType === 'video') {
    const videoSrc = safeHttpUrl(lesson.videoUrl);
    body = videoSrc ? (
      <video
        controls
        preload="metadata"
        src={videoSrc}
        aria-label={`Video: ${lesson.title}`}
        className="aspect-video w-full rounded-md bg-black"
      >
        Your browser cannot play this video.
      </video>
    ) : (
      <EmptyState icon="video" title="Video unavailable" />
    );
  } else if (!lesson.content) {
    body = <EmptyState icon="lesson" title="No content yet" />;
  } else if (lesson.contentType === 'interactive') {
    body = <SlideDeck markdown={lesson.content} />;
  } else {
    body = (
      <div className="prose-measure">
        <Markdown variant="prose">{lesson.content}</Markdown>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PageHeader
        title={lesson.title}
        backTo={ROUTES.LEARN_MODULE.replace(':moduleId', String(lesson.moduleId))}
        actions={
          <Button
            variant="secondary"
            size="sm"
            iconName="list"
            onClick={() => setOutlineOpen(true)}
          >
            Course outline
          </Button>
        }
      />

      {body}

      {canWriteProgress ? (
        <div className="flex flex-col gap-3">
          {startLesson.isError ? (
            <ErrorState
              compact
              title="Could not start this lesson"
              error={startLesson.error}
              onRetry={retryStart}
              retrying={startLesson.isPending}
            />
          ) : null}
          {completeLesson.isError ? (
            <ErrorState
              compact
              title="Could not mark this lesson complete"
              error={completeLesson.error}
              onRetry={handleComplete}
              retrying={completeLesson.isPending}
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            {isCompleted ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-success">
                <Icon name="check-circle" filled size={18} />
                Completed
              </span>
            ) : (
              <Button
                variant="primary"
                iconName="check-circle"
                isLoading={completeLesson.isPending}
                disabled={!canComplete}
                onClick={handleComplete}
              >
                Mark complete
              </Button>
            )}
            {completion && completion.xp.delta !== 0 ? (
              <XpDelta delta={completion.xp.delta} />
            ) : null}
            {isCompleted && nextTarget ? (
              <Button
                variant="secondary"
                iconName="arrow-right"
                iconPosition="right"
                onClick={() => navigate(nextTarget.to)}
              >
                Next
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <LessonPager prev={prevTarget} next={nextTarget} />

      {outlineOpen ? (
        <Suspense fallback={null}>
          <CourseOutlineDrawer
            open={outlineOpen}
            onClose={() => setOutlineOpen(false)}
            courseId={lesson.courseId}
            currentItemId={lesson.lessonId}
            currentModuleId={lesson.moduleId}
          />
        </Suspense>
      ) : null}

      <CourseCompleteOverlay
        open={
          justCompleted &&
          sequence.ready &&
          nextTargetUrl === null &&
          (sequence.isLastItemInCourse || Boolean(completion?.courseNewlyCompleted))
        }
        courseTitle={sequence.courseTitle}
        onContinue={() => navigate(`${ROUTES.LEARN}?completedCourse=${lesson.courseId}`)}
      />
    </div>
  );
}

/**
 * Lesson page for one module item (text, video or interactive slides). Labs and quizzes
 * redirect to their own pages. Start and complete run server-side; XP comes from the response.
 */
export function LearnLessonPage() {
  const { lessonId = '' } = useParams<{ lessonId: string }>();
  return <LessonView key={lessonId} lessonId={lessonId} />;
}

export default LearnLessonPage;
