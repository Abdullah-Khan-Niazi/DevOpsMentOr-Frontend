import { useState } from 'react';
import { useLearnModuleLessons, useLearnModuleQuizzes } from '../hooks';
import type { ModuleDto } from '../types';
import { LessonListItem } from './LessonListItem';

interface ModuleAccordionItemProps {
  module: ModuleDto;
  activeLessonId?: number | null;
  defaultOpen?: boolean;
  onOpenLesson: (lessonId: number) => void;
}

/** F4 SCR-F4-05: collapsible module block that lazy-loads its lessons and quiz metadata. */
export function ModuleAccordionItem({
  module,
  activeLessonId,
  defaultOpen = false,
  onOpenLesson,
}: ModuleAccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const lessonsQuery = useLearnModuleLessons(module.moduleId, open);
  const quizzesQuery = useLearnModuleQuizzes(module.moduleId, open);

  return (
    <div className="rounded-lg border border-border bg-surface/50">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 rounded-lg p-4 text-left"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`}
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-card-foreground">{module.title}</p>
          <p className="text-xs text-muted">
            {module.lessonCount} {module.lessonCount === 1 ? 'lesson' : 'lessons'} ·{' '}
            {module.estimatedMinutes} min
          </p>
        </div>
      </button>

      {open ? (
        <div className="border-t border-border p-2">
          {lessonsQuery.isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2].map((row) => (
                <div key={row} className="h-8 rounded-md bg-border" />
              ))}
            </div>
          ) : lessonsQuery.isError || !lessonsQuery.data ? (
            <p className="p-2 text-sm text-muted">
              {lessonsQuery.error?.message ?? 'Unable to load lessons.'}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {lessonsQuery.data.map((lesson) => (
                <LessonListItem
                  key={lesson.lessonId}
                  lesson={lesson}
                  isActive={lesson.lessonId === activeLessonId}
                  onOpen={onOpenLesson}
                />
              ))}
            </ul>
          )}

          {quizzesQuery.data && quizzesQuery.data.length > 0 ? (
            <div className="mt-3 border-t border-border pt-3">
              <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted">
                Quizzes
              </p>
              <ul className="space-y-0.5">
                {quizzesQuery.data.map((quiz) => (
                  <li
                    key={quiz.quizId}
                    className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-card-foreground"
                  >
                    <span className="min-w-0 flex-1 truncate">{quiz.title}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'} ·
                      Pass mark {quiz.passingScore}%
                      {quiz.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
