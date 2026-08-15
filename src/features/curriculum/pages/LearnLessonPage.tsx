import { useParams } from 'react-router-dom';
import { ErrorState, PageHeader } from '@/shared/components';
import { CONTENT_TYPE_LABELS } from '../components/ContentTypeIcon';
import { LessonBody } from '../components/LessonBody';
import { LessonSidebar } from '../components/LessonSidebar';
import { useLearnLesson, useLearnModule, useLearnModuleLessons } from '../hooks';

/** F4 SCR-F4-06: learner lesson viewer with outline sidebar (F4-API-04..05). */
export function LearnLessonPage() {
  const { lessonId = '' } = useParams<{ lessonId: string }>();

  const lessonQuery = useLearnLesson(lessonId);
  const lesson = lessonQuery.data;

  const moduleQuery = useLearnModule(lesson?.moduleId ?? '', Boolean(lesson));
  const lessonsQuery = useLearnModuleLessons(lesson?.moduleId ?? '', Boolean(lesson));

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
      </article>
    </div>
  );
}

export default LearnLessonPage;
