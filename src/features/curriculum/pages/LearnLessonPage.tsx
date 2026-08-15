import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, ErrorState, PageHeader, toast } from '@/shared/components';
import { CONTENT_TYPE_LABELS } from '../components/ContentTypeIcon';
import { LessonBody } from '../components/LessonBody';
import { LessonSidebar } from '../components/LessonSidebar';
import { useLearnLesson, useLearnModule, useLearnModuleLessons } from '../hooks';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useCompleteLesson, useStartLesson } from '@/features/progress/hooks';

/**
 * F4 SCR-F4-06: learner lesson viewer with outline sidebar (F4-API-04..05).
 * F5 boundary exception (user-approved): wires F5-API-01 (auto start on
 * render) and F5-API-02 ("Mark complete") into the lesson screen so the
 * learner journey is end-to-end functional.
 */
export function LearnLessonPage() {
  const { lessonId = '' } = useParams<{ lessonId: string }>();

  const lessonQuery = useLearnLesson(lessonId);
  const lesson = lessonQuery.data;

  const moduleQuery = useLearnModule(lesson?.moduleId ?? '', Boolean(lesson));
  const lessonsQuery = useLearnModuleLessons(lesson?.moduleId ?? '', Boolean(lesson));

  const canWriteProgress = useAuthStore((state) =>
    (state.user?.permissions ?? []).includes('progress.self.write'),
  );
  const startLesson = useStartLesson();
  const completeLesson = useCompleteLesson();
  const startedRef = useRef<number | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!canWriteProgress || !lesson) return;
    if (startedRef.current === lesson.lessonId) return;
    startedRef.current = lesson.lessonId;
    startLesson.mutate(lesson.lessonId, {
      onError: () => undefined,
    });
  }, [canWriteProgress, lesson, startLesson]);

  const handleComplete = () => {
    if (!lesson) return;
    const timeSpentSeconds = Math.min(3600, Math.floor((Date.now() - startedAt) / 1000));
    completeLesson.mutate(
      { lessonId: lesson.lessonId, payload: { timeSpentSeconds } },
      {
        onSuccess: (data) => {
          setIsCompleted(true);
          toast.success(
            `Lesson completed. Course progress: ${data.courseProgress.progressPercentage}%`,
          );
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  if (lessonQuery.isLoading) {
    return (
      <div className="grid grid-cols-[280px_1fr] gap-8">
        <div className="space-y-3">
          <div className="h-4 w-2/3 rounded bg-border" />
          <div className="h-8 rounded-md bg-border" />
          <div className="h-8 rounded-md bg-border" />
          <div className="h-8 rounded-md bg-border" />
        </div>
        <div className="space-y-4">
          <div className="h-8 w-1/2 rounded bg-border" />
          <div className="h-4 w-1/3 rounded bg-border" />
          <div className="h-40 rounded-lg bg-border" />
        </div>
      </div>
    );
  }

  if (lessonQuery.isError || !lesson) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Lesson" />
        <ErrorState
          message={lessonQuery.error?.message ?? 'Lesson unavailable.'}
          onRetry={() => void lessonQuery.refetch()}
        />
      </div>
    );
  }

  const module = moduleQuery.data ?? null;
  const lessons = lessonsQuery.data ?? [];

  const index = lessons.findIndex((item) => item.lessonId === lesson.lessonId);
  const prevLesson = index > 0 ? lessons[index - 1] : null;
  const nextLesson = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
  const minutes = lesson.videoDurationSeconds
    ? Math.max(1, Math.round(lesson.videoDurationSeconds / 60))
    : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <LessonSidebar
        moduleTitle={module?.title ?? 'Lesson'}
        lessons={lessons}
        activeLessonId={lesson.lessonId}
        prevLesson={prevLesson}
        nextLesson={nextLesson}
      />

      <article>
        <PageHeader title={lesson.title} />
        <p className="mt-1 text-sm text-muted">
          {CONTENT_TYPE_LABELS[lesson.contentType]}
          {minutes ? ` · ~${minutes} min` : ''}
          {lesson.tags.length > 0 ? ` · ${lesson.tags.map((tag) => tag.tagName).join(', ')}` : ''}
        </p>

        <div className="mt-6">
          <LessonBody lesson={lesson} />
        </div>

        {canWriteProgress ? (
          <div className="mt-8 flex items-center justify-end gap-3">
            {isCompleted ? (
              <p className="text-sm font-medium text-green-700">✓ Lesson completed</p>
            ) : (
              <Button type="button" onClick={handleComplete} isLoading={completeLesson.isPending}>
                Mark complete
              </Button>
            )}
          </div>
        ) : null}
      </article>
    </div>
  );
}

export default LearnLessonPage;
