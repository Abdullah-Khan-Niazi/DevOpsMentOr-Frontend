import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import type { LessonDto } from '../types';
import { LessonListItem } from './LessonListItem';

interface LessonSidebarProps {
  moduleTitle: string;
  lessons: LessonDto[];
  activeLessonId: number;
  prevLesson: LessonDto | null;
  nextLesson: LessonDto | null;
}

/** F4 SCR-F4-06: module outline with prev/next navigation. */
export function LessonSidebar({
  moduleTitle,
  lessons,
  activeLessonId,
  prevLesson,
  nextLesson,
}: LessonSidebarProps) {
  const navigate = useNavigate();

  const openLesson = (lessonId: number) => {
    navigate(ROUTES.LEARN_LESSON.replace(':lessonId', String(lessonId)));
  };

  return (
    <aside className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{moduleTitle}</h2>
        <ul className="mt-3 space-y-0.5">
          {lessons.map((lesson) => (
            <LessonListItem
              key={lesson.lessonId}
              lesson={lesson}
              isActive={lesson.lessonId === activeLessonId}
              onOpen={openLesson}
            />
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        {prevLesson ? (
          <Button variant="secondary" size="sm" onClick={() => openLesson(prevLesson.lessonId)}>
            Previous: {prevLesson.title}
          </Button>
        ) : null}
        {nextLesson ? (
          <Button size="sm" onClick={() => openLesson(nextLesson.lessonId)}>
            Next: {nextLesson.title}
          </Button>
        ) : (
          <p className="text-sm text-muted">This is the last lesson.</p>
        )}
      </div>
    </aside>
  );
}
