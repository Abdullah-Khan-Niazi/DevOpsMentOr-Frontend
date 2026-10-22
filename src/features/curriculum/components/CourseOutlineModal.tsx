import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { ContentTypeIcon } from './ContentTypeIcon';
import { useCourseOverview, useLearnModuleLessons, useLearnModuleQuizzes } from '../hooks';
import type { LessonDto, QuizDto } from '../types';

export interface CourseOutlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLessonId?: number;
  moduleId?: number;
}

function TerminalIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function CheckmarkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WrenchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

type OutlineItem =
  | { kind: 'lesson'; data: LessonDto }
  | { kind: 'quiz'; data: QuizDto };

function getStoredOrder(modId: number): Array<{ kind: 'lesson' | 'quiz'; id: number }> | null {
  try {
    const raw = localStorage.getItem(`stardust_module_ordering_${modId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * DataCamp-style Module Outline Modal.
 * Focused specifically on the current module's syllabus, sequence, items, and jump navigation.
 */
export function CourseOutlineModal({
  isOpen,
  onClose,
  activeLessonId,
  moduleId,
}: CourseOutlineModalProps) {
  const navigate = useNavigate();
  const overviewQuery = useCourseOverview();
  const modules = overviewQuery.data?.modules ?? [];

  const [selectedModuleId, setSelectedModuleId] = useState<number | undefined>(moduleId);

  useEffect(() => {
    if (moduleId) {
      setSelectedModuleId(moduleId);
    }
  }, [moduleId, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentModule = useMemo(() => {
    if (selectedModuleId) {
      const match = modules.find((m) => m.moduleId === selectedModuleId);
      if (match) return match;
    }
    return modules[0] ?? null;
  }, [modules, selectedModuleId]);

  const targetModuleId = currentModule?.moduleId ?? 0;
  const lessonsQuery = useLearnModuleLessons(targetModuleId, isOpen && targetModuleId > 0);
  const quizzesQuery = useLearnModuleQuizzes(targetModuleId, isOpen && targetModuleId > 0);

  const lessons = useMemo(() => lessonsQuery.data ?? [], [lessonsQuery.data]);
  const quizzes = useMemo(() => quizzesQuery.data ?? [], [quizzesQuery.data]);

  // Combine lessons and quizzes in saved order or default sequence
  const orderedItems = useMemo<OutlineItem[]>(() => {
    const lessonMap = new Map(lessons.map((l) => [l.lessonId, l]));
    const quizMap = new Map(quizzes.map((q) => [q.quizId, q]));

    const saved = targetModuleId > 0 ? getStoredOrder(targetModuleId) : null;
    const result: OutlineItem[] = [];
    const seenLessons = new Set<number>();
    const seenQuizzes = new Set<number>();

    if (saved) {
      for (const item of saved) {
        if (item.kind === 'lesson') {
          const l = lessonMap.get(item.id);
          if (l) {
            result.push({ kind: 'lesson', data: l });
            seenLessons.add(l.lessonId);
          }
        } else if (item.kind === 'quiz') {
          const q = quizMap.get(item.id);
          if (q) {
            result.push({ kind: 'quiz', data: q });
            seenQuizzes.add(q.quizId);
          }
        }
      }
    }

    for (const l of lessons) {
      if (!seenLessons.has(l.lessonId)) {
        result.push({ kind: 'lesson', data: l });
      }
    }

    for (const q of quizzes) {
      if (!seenQuizzes.has(q.quizId)) {
        result.push({ kind: 'quiz', data: q });
      }
    }

    return result;
  }, [lessons, quizzes, targetModuleId]);

  const moduleXp = useMemo(() => {
    const lXp = lessons.reduce((acc, l) => (l.contentType === 'lab' ? acc + 75 : 20), 0);
    const qXp = quizzes.reduce((acc, q) => acc + (q.questionCount > 0 ? q.questionCount * 10 : 25), 0);
    return lXp + qXp;
  }, [lessons, quizzes]);

  if (!isOpen) return null;

  const handleSelectItem = (item: OutlineItem) => {
    onClose();
    if (item.kind === 'quiz') {
      navigate(ROUTES.LEARN_QUIZ.replace(':quizId', String(item.data.quizId)));
    } else {
      navigate(ROUTES.LEARN_LESSON.replace(':lessonId', String(item.data.lessonId)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-sm border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header: Module Info & Module Switcher */}
          <div className="border-b border-border pb-4 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold block">
                  Module Outline
                </span>
                <h2 className="text-lg font-bold text-card-foreground truncate mt-0.5">
                  {currentModule
                    ? `Module ${currentModule.moduleOrder}: ${currentModule.title}`
                    : 'Module Syllabus'}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {modules.length > 1 && (
                  <select
                    value={selectedModuleId ?? currentModule?.moduleId}
                    onChange={(e) => setSelectedModuleId(Number(e.target.value))}
                    className="filter-input text-xs font-mono h-8 px-2"
                    aria-label="Select Module"
                  >
                    {modules.map((m) => (
                      <option key={m.moduleId} value={m.moduleId}>
                        M{m.moduleOrder}: {m.title}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-muted hover:text-card-foreground hover:bg-surface-hover rounded-xs transition-colors cursor-pointer"
                  aria-label="Close outline"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {currentModule?.description && (
              <p className="text-xs text-muted leading-relaxed">
                {currentModule.description}
              </p>
            )}

            {/* DB-driven Module Metrics */}
            <div className="flex items-center gap-3 text-xs font-mono text-muted pt-1">
              <span>{orderedItems.length} items</span>
              <span>·</span>
              <span>{currentModule?.estimatedMinutes ?? 45} min</span>
              <span>·</span>
              <span className="font-semibold text-card-foreground">{moduleXp} XP Available</span>
            </div>
          </div>

          {/* Module Items List */}
          <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
            {lessonsQuery.isLoading || quizzesQuery.isLoading ? (
              <div className="space-y-2 py-2">
                <div className="h-9 rounded-xs bg-border/20 animate-pulse" />
                <div className="h-9 rounded-xs bg-border/20 animate-pulse" />
                <div className="h-9 rounded-xs bg-border/20 animate-pulse" />
              </div>
            ) : orderedItems.length === 0 ? (
              <p className="text-xs font-mono text-muted py-6 text-center">
                No items staged in this module yet.
              </p>
            ) : (
              orderedItems.map((item, idx) => {
                const isLesson = item.kind === 'lesson';
                const isActive = isLesson && item.data.lessonId === activeLessonId;
                const isLab = isLesson && item.data.contentType === 'lab';
                const isBreakFix =
                  isLesson &&
                  (item.data.tags.some((t) => t.tagName.toLowerCase().includes('break-fix')) ||
                    item.data.title.toLowerCase().includes('break-fix'));

                const xp = isLesson ? (isLab ? 75 : 20) : (item.data.questionCount > 0 ? item.data.questionCount * 10 : 25);
                const typeLabel = isLesson
                  ? isBreakFix
                    ? 'BREAK-FIX'
                    : isLab
                      ? 'LAB'
                      : item.data.contentType.toUpperCase()
                  : 'QUIZ';

                return (
                  <button
                    key={isLesson ? `lesson-${item.data.lessonId}` : `quiz-${item.data.quizId}`}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xs text-left transition-all cursor-pointer border ${
                      isActive
                        ? 'border-foreground bg-surface-hover shadow-2xs font-semibold'
                        : 'border-transparent hover:border-border hover:bg-surface-hover/60 text-card-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Left Item Icon */}
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs bg-paper border border-border text-card-foreground">
                        {!isLesson ? (
                          <CheckmarkIcon className="w-3.5 h-3.5" />
                        ) : isBreakFix ? (
                          <WrenchIcon className="w-3.5 h-3.5" />
                        ) : isLab ? (
                          <TerminalIcon className="w-3.5 h-3.5" />
                        ) : (
                          <ContentTypeIcon type={item.data.contentType} />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium truncate">
                            {item.data.title}
                          </span>
                          <span className="text-[10px] font-mono text-muted uppercase font-semibold">
                            · {typeLabel}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded-xs border border-foreground bg-foreground text-background font-bold">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-muted shrink-0 ml-3">
                      <span>{xp} XP</span>
                      <span className="text-[10px] text-muted">
                        #{currentModule?.moduleOrder}.{idx + 1}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(ROUTES.LEARN);
              }}
              className="text-xs font-mono text-muted hover:text-card-foreground transition-colors cursor-pointer"
            >
              ← Full Course Curriculum
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xs border border-border bg-paper hover:bg-surface-hover text-xs font-mono text-card-foreground transition-all cursor-pointer font-medium active:scale-[0.98]"
            >
              Close Outline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseOutlineModal;
