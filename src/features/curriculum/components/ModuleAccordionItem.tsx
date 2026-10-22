import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useLearnModuleLessons, useLearnModuleQuizzes } from '../hooks';
import type { ModuleDto, LessonDto } from '../types';

interface ModuleAccordionItemProps {
  module: ModuleDto;
  activeLessonId?: number | null;
  defaultOpen?: boolean;
  onOpenLesson: (lessonId: number) => void;
}

function LessonPlayIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
    </svg>
  );
}

function LabTerminalIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function QuizCheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

/**
 * DataCamp-style Chapter Card:
 * Features numbered circle, module metadata, progress bar, practice button,
 * and seamless interactive listing of lessons, labs, and quizzes with XP rewards.
 */
export function ModuleAccordionItem({
  module,
  activeLessonId,
  defaultOpen = false,
  onOpenLesson,
}: ModuleAccordionItemProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(defaultOpen);
  const lessonsQuery = useLearnModuleLessons(module.moduleId, open);
  const quizzesQuery = useLearnModuleQuizzes(module.moduleId, open);

  const lessons: LessonDto[] = useMemo(() => lessonsQuery.data ?? [], [lessonsQuery.data]);
  const quizzes = useMemo(() => quizzesQuery.data ?? [], [quizzesQuery.data]);

  const estimatedXp = useMemo(() => {
    const lXp = lessons.reduce((acc, l) => (l.contentType === 'lab' ? acc + 75 : acc + 25), 0);
    const qXp = quizzes.reduce((acc, q) => acc + (q.questionCount > 0 ? q.questionCount * 10 : 25), 0);
    return lXp + qXp || module.lessonCount * 40;
  }, [lessons, quizzes, module.lessonCount]);

  const handleStartChapter = () => {
    if (lessons.length > 0) {
      onOpenLesson(lessons[0].lessonId);
    } else if (quizzes.length > 0) {
      navigate(ROUTES.LEARN_QUIZ.replace(':quizId', String(quizzes[0].quizId)));
    } else {
      setOpen(true);
    }
  };

  return (
    <div className="rounded-lg border border-border/80 bg-card shadow-2xs overflow-hidden transition-all duration-150">
      {/* ─── Top Chapter Header (DataCamp Standard) ────────────────────────── */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            {/* Circled Chapter Index Number */}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-black font-mono text-xs font-bold">
              {module.moduleOrder}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-card-foreground">
                  {module.title}
                </h3>
                <span className="text-xs font-mono text-muted">
                  · Available
                </span>
              </div>
            </div>
          </div>

          {/* Right: Progress Indicator */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <div className="flex items-center gap-2">
              <div className="w-24 sm:w-32 h-1.5 rounded-xs bg-paper border border-border overflow-hidden">
                <div
                  className="h-full bg-ink dark:bg-pearl-100 transition-all duration-300"
                  style={{ width: `${module.isPublished ? '0%' : '0%'}` }}
                />
              </div>
              <span className="text-xs font-mono text-muted">0%</span>
            </div>
          </div>
        </div>

        {/* Module Description */}
        {module.description && (
          <p className="text-xs text-muted leading-relaxed mt-2.5 pl-0 sm:pl-10">
            {module.description}
          </p>
        )}
      </div>

      {/* ─── Action & Toggle Sub-header ─────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-paper/60 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-mono text-muted hover:text-card-foreground flex items-center gap-1.5 transition-colors cursor-pointer select-none font-medium"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span>{open ? 'Hide Chapter Details' : 'Show Chapter Details'}</span>
          </button>
          <span className="text-[11px] font-mono text-muted hidden sm:inline">
            · {estimatedXp} XP Available
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleStartChapter}
          className="text-xs font-mono h-7 px-3 shadow-2xs active:scale-[0.97] transition-all"
        >
          Practice Chapter
        </Button>
      </div>

      {/* ─── Expanded Curriculum Items List ─────────────────────────────────── */}
      {open && (
        <div className="p-3 bg-surface/30 border-t border-border/60 space-y-1">
          {lessonsQuery.isLoading ? (
            <div className="space-y-2 p-2">
              <div className="h-9 rounded-xs bg-border/40 animate-pulse" />
              <div className="h-9 rounded-xs bg-border/40 animate-pulse" />
            </div>
          ) : lessons.length === 0 && quizzes.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted font-mono">
              No lessons or quizzes currently published in this chapter.
            </div>
          ) : (
            <>
              {/* Lessons & Hands-on Labs */}
              {lessons.map((lesson) => {
                const isActive = lesson.lessonId === activeLessonId;
                const isLab = lesson.contentType === 'lab';
                const isInteractive = lesson.contentType === 'interactive';
                const xpReward = isLab ? 75 : isInteractive ? 30 : 25;

                return (
                  <div
                    key={lesson.lessonId}
                    onClick={() => onOpenLesson(lesson.lessonId)}
                    className={`flex items-center justify-between p-2.5 rounded-xs border transition-all cursor-pointer ${
                      isActive
                        ? 'border-brand-600 bg-brand-50/15 text-brand-700 shadow-2xs'
                        : 'border-transparent hover:border-border/80 hover:bg-paper text-card-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Leading Type Icon */}
                      <span className="shrink-0 text-muted">
                        {isLab ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-xs bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                            <LabTerminalIcon className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded-xs bg-surface text-muted border border-border">
                            <LessonPlayIcon className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold truncate">
                            {lesson.title}
                          </span>
                          <span className="text-[10px] font-mono text-muted uppercase tracking-wider font-semibold">
                            · {lesson.contentType}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: XP Reward Indicator */}
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs font-mono text-muted font-medium">
                        {xpReward} XP
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Quizzes as First-Class Chapter Items */}
              {quizzes.map((quiz) => {
                const quizXp = quiz.questionCount > 0 ? quiz.questionCount * 10 : 25;

                return (
                  <div
                    key={quiz.quizId}
                    onClick={() => navigate(ROUTES.LEARN_QUIZ.replace(':quizId', String(quiz.quizId)))}
                    className="flex items-center justify-between p-2.5 rounded-xs border border-transparent hover:border-border/80 hover:bg-paper transition-all cursor-pointer text-card-foreground"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded-xs bg-paper border border-border text-card-foreground shrink-0">
                        <QuizCheckIcon className="w-3.5 h-3.5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold truncate">
                            {quiz.title}
                          </span>
                          <span className="text-[10px] font-mono text-muted uppercase tracking-wider font-semibold">
                            · QUIZ
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-[11px] font-mono text-muted hidden sm:inline">
                        {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}
                      </span>
                      <span className="text-xs font-mono text-muted font-medium">
                        {quizXp} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ModuleAccordionItem;
