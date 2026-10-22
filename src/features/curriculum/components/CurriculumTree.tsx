import { useState, useMemo } from 'react';
import { Button, Input, toast } from '@/shared/components';
import { ContentTypeIcon } from './ContentTypeIcon';
import { useAdminModuleEditor } from '../hooks';
import { useBadgeCatalog } from '@/features/achievements/hooks/useGamification';
import type { CourseDto, LessonDto, ModuleDto, QuizDetailDto } from '../types';

export type TreeNodeSelection =
  | { type: 'course'; id: number }
  | { type: 'module'; id: number }
  | { type: 'lesson'; id: number; moduleId: number }
  | { type: 'lab'; id: number; moduleId: number }
  | { type: 'quiz'; id: number; moduleId: number };

export type CreateAction =
  | { type: 'module' }
  | { type: 'lesson'; moduleId: number }
  | { type: 'lab'; moduleId: number }
  | { type: 'quiz'; moduleId: number };

interface CurriculumTreeProps {
  course: CourseDto;
  modules: ModuleDto[];
  selectedNode: TreeNodeSelection | null;
  onSelectNode: (selection: TreeNodeSelection) => void;
  onCreateAction: (action: CreateAction) => void;
  onReorderModule?: (moduleId: number, direction: -1 | 1) => void;
  onPublishModule?: (moduleId: number) => void;
  onUnpublishModule?: (moduleId: number) => void;
  busyModuleIds?: Set<number>;
}

interface ModuleNodeProps {
  module: ModuleDto;
  courseId: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedNode: TreeNodeSelection | null;
  onSelectNode: (selection: TreeNodeSelection) => void;
  onCreateAction: (action: CreateAction) => void;
  onReorder?: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isBusy: boolean;
  searchFilter: string;
}

// ─── Professional SVG Icons ──────────────────────────────────────────────────

function TerminalIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function ServerStackIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function WrenchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function CheckmarkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrophyBadgeIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}

function ZapXpIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ClockDurationIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ─── Module Child Items (Interleaved Ordering) ───────────────────────────────

type ModuleChildItem =
  | { kind: 'lesson'; data: LessonDto }
  | { kind: 'quiz'; data: QuizDetailDto };

function getStoredModuleItemOrder(moduleId: number): Array<{ kind: 'lesson' | 'quiz'; id: number }> | null {
  try {
    const raw = localStorage.getItem(`stardust_module_ordering_${moduleId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persistModuleItemOrder(
  moduleId: number,
  order: Array<{ kind: 'lesson' | 'quiz'; id: number }>,
) {
  try {
    localStorage.setItem(`stardust_module_ordering_${moduleId}`, JSON.stringify(order));
  } catch {
    // ignore storage quota
  }
}

// ─── Module Node Component ───────────────────────────────────────────────────

function ModuleNode({
  module,
  isExpanded,
  onToggleExpand,
  selectedNode,
  onSelectNode,
  onCreateAction,
  onReorder,
  canMoveUp,
  canMoveDown,
  isBusy,
  searchFilter,
}: ModuleNodeProps) {
  const editor = useAdminModuleEditor(module.moduleId, isExpanded || searchFilter.trim().length > 0);
  const lessons: LessonDto[] = editor.query.data?.lessons ?? [];
  const quizzes: QuizDetailDto[] = editor.query.data?.quizzes ?? [];
  const [orderVersion, setOrderVersion] = useState(0);

  const isModuleSelected = selectedNode?.type === 'module' && selectedNode.id === module.moduleId;

  // Filter lessons & quizzes if search term provided
  const searchLower = searchFilter.trim().toLowerCase();
  const filteredLessons = useMemo(() => {
    if (!searchLower) return lessons;
    return lessons.filter(
      (l) =>
        l.title.toLowerCase().includes(searchLower) ||
        l.contentType.toLowerCase().includes(searchLower) ||
        l.tags.some((t) => t.tagName.toLowerCase().includes(searchLower)),
    );
  }, [lessons, searchLower]);

  const filteredQuizzes = useMemo(() => {
    if (!searchLower) return quizzes;
    return quizzes.filter((q) => q.title.toLowerCase().includes(searchLower));
  }, [quizzes, searchLower]);

  // DB-driven computed points for the module
  const moduleEstimatedPoints = useMemo(() => {
    const lessonPoints = lessons.reduce((acc, l) => {
      if (l.contentType === 'lab') return acc + 75;
      if (l.contentType === 'interactive') return acc + 20;
      return acc + 15;
    }, 0);
    const quizPoints = quizzes.reduce((acc, q) => acc + (q.questionCount > 0 ? q.questionCount * 10 : 25), 0);
    return lessonPoints + quizPoints || module.lessonCount * 40;
  }, [lessons, quizzes, module.lessonCount]);

  // Unified interleaved item list (lessons, labs, and quizzes)
  const orderedItems = useMemo<ModuleChildItem[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    orderVersion; // subscribe to reorder state mutations
    const lessonMap = new Map(filteredLessons.map((l) => [l.lessonId, l]));
    const quizMap = new Map(filteredQuizzes.map((q) => [q.quizId, q]));

    const saved = getStoredModuleItemOrder(module.moduleId);
    const result: ModuleChildItem[] = [];
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

    // Append remaining lessons not in saved order
    for (const l of filteredLessons) {
      if (!seenLessons.has(l.lessonId)) {
        result.push({ kind: 'lesson', data: l });
      }
    }

    // Append remaining quizzes not in saved order
    for (const q of filteredQuizzes) {
      if (!seenQuizzes.has(q.quizId)) {
        result.push({ kind: 'quiz', data: q });
      }
    }

    return result;
  }, [filteredLessons, filteredQuizzes, module.moduleId, orderVersion]);

  // Handle reordering of any item (lesson, lab, or quiz)
  const handleReorderItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (index < 0 || target < 0 || target >= orderedItems.length) return;

    const next = [...orderedItems];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);

    persistModuleItemOrder(
      module.moduleId,
      next.map((item) => ({
        kind: item.kind,
        id: item.kind === 'lesson' ? item.data.lessonId : item.data.quizId,
      })),
    );
    setOrderVersion((v) => v + 1);

    // If lessons shifted relative positions, synchronize backend database order
    const nextLessons = next.filter((item): item is { kind: 'lesson'; data: LessonDto } => item.kind === 'lesson');
    const orders = nextLessons.map((l, order) => ({
      lessonId: l.data.lessonId,
      lessonOrder: order + 1,
    }));
    if (orders.length > 0) {
      editor.reorderLessons.mutate(orders, {
        onSuccess: () => toast.success('Sequence updated.'),
        onError: (err) => toast.error(err.message),
      });
    } else {
      toast.success('Sequence updated.');
    }
  };

  const matchesSearch =
    !searchLower ||
    module.title.toLowerCase().includes(searchLower) ||
    filteredLessons.length > 0 ||
    filteredQuizzes.length > 0;

  if (!matchesSearch) {
    return null;
  }

  // Exact button styling satisfying:
  // - Text strictly remains black on hover (never turns white, in both light and dark mode)
  // - Text gets more bolder on hover (font-medium -> hover:font-bold -> active:font-black)
  // - White/Paper fill background
  // - Border black on hover and bold 2px on active press
  const quickBtnClass =
    'text-[11px] font-mono px-2.5 py-1 rounded-xs border border-zinc-400 dark:border-zinc-400 bg-white dark:bg-white text-black dark:text-black font-medium hover:font-bold hover:text-black dark:hover:text-black hover:bg-white dark:hover:bg-white hover:border-black dark:hover:border-black hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-[0.98] active:border-2 active:border-black dark:active:border-black active:font-black active:text-black dark:active:text-black transition-all duration-150 ease-out cursor-pointer';
  const quickLabBtnClass =
    'text-[11px] font-mono px-2.5 py-1 rounded-xs border border-zinc-400 dark:border-zinc-400 bg-white dark:bg-white text-black dark:text-black font-medium hover:font-bold hover:text-black dark:hover:text-black hover:bg-white dark:hover:bg-white hover:border-black dark:hover:border-black hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-[0.98] active:border-2 active:border-black dark:active:border-black active:font-black active:text-black dark:active:text-black transition-all duration-150 ease-out cursor-pointer flex items-center gap-1.5';

  return (
    <div className="relative group/module">
      {/* Module Header Card - Transparent Ink & Paper aesthetic */}
      <div
        className={`flex items-center justify-between p-3 rounded-md border transition-all cursor-pointer ${
          isModuleSelected
            ? 'border-brand-600 bg-brand-50/10 shadow-xs ring-1 ring-brand-600/30'
            : 'border-border/50 bg-transparent hover:bg-surface/40 hover:border-border/80'
        }`}
        onClick={() => onSelectNode({ type: 'module', id: module.moduleId })}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            aria-label={isExpanded ? 'Collapse module' : 'Expand module'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="p-1 rounded-xs hover:bg-surface text-muted hover:text-card-foreground transition-transform cursor-pointer"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Module Index - Pure typography, no pill */}
          <span className="font-mono text-xs font-bold text-muted shrink-0">
            M{module.moduleOrder}
          </span>

          {/* Module Title and DB-driven KPIs */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-card-foreground truncate">{module.title}</span>
              <span className="text-[10px] font-mono text-muted shrink-0">
                · {module.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>

            {/* DB-Driven Module Metadata Strip - Pure Ink & Paper, no yellow, no emojis */}
            <div className="flex items-center gap-2.5 text-[11px] font-mono text-muted truncate mt-0.5">
              <span>{module.lessonCount} {module.lessonCount === 1 ? 'item' : 'items'}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <ClockDurationIcon className="w-3 h-3 text-muted" />
                {module.estimatedMinutes} min
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-card-foreground font-semibold">
                <ZapXpIcon className="w-3 h-3 text-card-foreground" />
                {moduleEstimatedPoints} XP
              </span>
              {module.description && (
                <>
                  <span>·</span>
                  <span className="truncate">{module.description}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          {/* Quick Create Buttons - ONLY revealed on hover when module is COLLAPSED (Strictly B&W, Lift on Hover, Bold on Pressed) */}
          {!isExpanded && (
            <div className="opacity-0 group-hover/module:opacity-100 transition-opacity duration-150 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onCreateAction({ type: 'lesson', moduleId: module.moduleId })}
                title="Add Standard Lesson"
                className={quickBtnClass}
              >
                + Lesson
              </button>
              <button
                type="button"
                onClick={() => onCreateAction({ type: 'lab', moduleId: module.moduleId })}
                title="Add Hands-On Lab Sandbox"
                className={quickLabBtnClass}
              >
                <TerminalIcon className="w-3 h-3 text-current" /> Lab
              </button>
              <button
                type="button"
                onClick={() => onCreateAction({ type: 'quiz', moduleId: module.moduleId })}
                title="Add Knowledge Quiz"
                className={quickBtnClass}
              >
                + Quiz
              </button>
            </div>
          )}

          {/* Module Reorder Controls */}
          {onReorder && (
            <div className="inline-flex items-center border border-border rounded-xs overflow-hidden bg-paper divide-x divide-border shadow-2xs ml-1.5">
              <button
                type="button"
                disabled={!canMoveUp || isBusy}
                onClick={() => onReorder(-1)}
                className="px-2 py-1 hover:bg-surface-hover text-muted hover:text-card-foreground active:scale-[0.95] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="Move module up"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={!canMoveDown || isBusy}
                onClick={() => onReorder(1)}
                className="px-2 py-1 hover:bg-surface-hover text-muted hover:text-card-foreground active:scale-[0.95] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="Move module down"
              >
                ↓
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Module Children Tree: Unified Interleaved Sequence (Walkthroughs, Lessons, Labs, Break-Fix, Quizzes) */}
      {(isExpanded || searchFilter.trim().length > 0) && (
        <div className="relative pl-6 ml-4 mt-2 border-l-2 border-border/70 space-y-1.5">
          {editor.query.isLoading ? (
            <div className="space-y-1.5 py-1">
              <div className="h-9 rounded-xs bg-border/30 animate-pulse" />
              <div className="h-9 rounded-xs bg-border/30 animate-pulse" />
            </div>
          ) : orderedItems.length === 0 ? (
            <div className="p-3 rounded-xs border border-dashed border-border/80 bg-transparent text-center">
              <p className="text-xs text-muted font-mono">No lessons or quizzes yet in this module.</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onCreateAction({ type: 'lesson', moduleId: module.moduleId })}
                  className={quickBtnClass}
                >
                  + Lesson
                </button>
                <button
                  type="button"
                  onClick={() => onCreateAction({ type: 'lab', moduleId: module.moduleId })}
                  className={quickLabBtnClass}
                >
                  <TerminalIcon className="w-3.5 h-3.5" /> Hands-On Lab
                </button>
                <button
                  type="button"
                  onClick={() => onCreateAction({ type: 'quiz', moduleId: module.moduleId })}
                  className={quickBtnClass}
                >
                  + Quiz
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Interleaved Lessons, Labs, Break-Fix, and Quizzes with full reordering */}
              {orderedItems.map((item, itemIndex) => {
                const canMoveItemUp = itemIndex > 0;
                const canMoveItemDown = itemIndex < orderedItems.length - 1;

                if (item.kind === 'quiz') {
                  const quiz = item.data;
                  const isSelected = selectedNode?.type === 'quiz' && selectedNode.id === quiz.quizId;
                  const quizXp = quiz.questionCount > 0 ? quiz.questionCount * 10 : 25;

                  return (
                    <div
                      key={`quiz-${quiz.quizId}`}
                      onClick={() =>
                        onSelectNode({ type: 'quiz', id: quiz.quizId, moduleId: module.moduleId })
                      }
                      className={`group/item flex items-center justify-between p-2.5 rounded-xs border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/10 shadow-xs ring-1 ring-brand-600/30'
                          : 'border-border/50 bg-transparent hover:bg-surface/40 hover:border-border/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs bg-paper border border-border text-card-foreground"
                          title="Knowledge Check Quiz"
                        >
                          <CheckmarkIcon className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-card-foreground truncate">
                              {quiz.title}
                            </span>
                            <span className="text-[10px] font-mono text-muted uppercase tracking-wider font-semibold">
                              QUIZ
                            </span>
                            <span className="text-[10px] font-mono text-muted">
                              · {quiz.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-muted">
                            <span>{quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}</span>
                            <span>·</span>
                            <span>Pass {quiz.passingScore}%</span>
                            {quiz.timeLimitMinutes && (
                              <>
                                <span>·</span>
                                <span>{quiz.timeLimitMinutes}m limit</span>
                              </>
                            )}
                            <span>·</span>
                            <span className="flex items-center gap-0.5 text-card-foreground font-semibold">
                              <ZapXpIcon className="w-3 h-3 text-card-foreground" />
                              {quizXp} XP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quiz Reorder Controls & Order Indicator */}
                      <div
                        className="flex items-center gap-1.5 shrink-0 ml-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center border border-border/80 rounded-xs overflow-hidden bg-paper opacity-60 group-hover/item:opacity-100 transition-opacity">
                          <button
                            type="button"
                            disabled={!canMoveItemUp || editor.reorderLessons.isPending}
                            onClick={() => handleReorderItem(itemIndex, -1)}
                            className="px-1.5 py-0.5 hover:bg-surface-hover text-muted hover:text-card-foreground active:scale-[0.95] transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                            title="Move quiz up in module sequence"
                          >
                            ↑
                          </button>
                          <span className="w-px h-3 bg-border" />
                          <button
                            type="button"
                            disabled={!canMoveItemDown || editor.reorderLessons.isPending}
                            onClick={() => handleReorderItem(itemIndex, 1)}
                            className="px-1.5 py-0.5 hover:bg-surface-hover text-muted hover:text-card-foreground active:scale-[0.95] transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                            title="Move quiz down in module sequence"
                          >
                            ↓
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-muted shrink-0">
                          #{module.moduleOrder}.{itemIndex + 1}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Lesson / Lab / Break-Fix / Walkthrough item
                const lesson = item.data;
                const isLab = lesson.contentType === 'lab';
                const isInteractive = lesson.contentType === 'interactive';
                const isSelected =
                  isLab
                    ? selectedNode?.type === 'lab' && selectedNode.id === lesson.lessonId
                    : selectedNode?.type === 'lesson' && selectedNode.id === lesson.lessonId;

                // Identify Break-Fix Diagnostic Lab
                const isBreakFix =
                  lesson.tags.some((t) =>
                    ['break-fix', 'breakfix', 'diagnostic', 'troubleshoot', 'incident', 'sherlock'].some(
                      (term) => t.tagName.toLowerCase().includes(term),
                    ),
                  ) ||
                  ['break-fix', 'breakfix', 'troubleshoot', 'diagnostic', 'incident'].some((term) =>
                    lesson.title.toLowerCase().includes(term),
                  );

                // Identify Guided vs Unguided Lab
                const isGuided =
                  lesson.tags.some((t) =>
                    ['guided', 'vip', 'step-by-step', 'tutorial'].some((term) =>
                      t.tagName.toLowerCase().includes(term),
                    ),
                  ) || lesson.title.toLowerCase().includes('guided');

                // Compute DB-driven XP & Duration for item
                const xpPoints = isBreakFix ? 100 : isLab ? 75 : isInteractive ? 20 : 15;
                const estimatedMinutes = lesson.videoDurationSeconds
                  ? Math.round(lesson.videoDurationSeconds / 60)
                  : isBreakFix
                    ? 60
                    : isLab
                      ? 45
                      : isInteractive
                        ? 15
                        : 10;

                const subtypeBadge = isBreakFix
                  ? 'BREAK-FIX'
                  : isLab
                    ? isGuided
                      ? 'LAB · GUIDED'
                      : 'LAB · UNGUIDED'
                    : isInteractive
                      ? 'WALKTHROUGH'
                      : lesson.contentType === 'video'
                        ? 'VIDEO'
                        : 'LESSON';

                return (
                  <div
                    key={`lesson-${lesson.lessonId}`}
                    onClick={() =>
                      onSelectNode(
                        isLab
                          ? { type: 'lab', id: lesson.lessonId, moduleId: module.moduleId }
                          : { type: 'lesson', id: lesson.lessonId, moduleId: module.moduleId },
                      )
                    }
                    className={`group/item flex items-center justify-between p-2.5 rounded-xs border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/10 shadow-xs ring-1 ring-brand-600/30'
                        : 'border-border/50 bg-transparent hover:bg-surface/40 hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Left Clean Monochrome SVG Icon */}
                      {isBreakFix ? (
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs bg-paper border border-border text-card-foreground"
                          title="Break-Fix Incident Sandbox"
                        >
                          <WrenchIcon className="w-3.5 h-3.5" />
                        </span>
                      ) : isLab ? (
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs bg-paper border border-border text-card-foreground"
                          title={`Hands-On Lab (${subtypeBadge})`}
                        >
                          <TerminalIcon className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs bg-paper border border-border text-muted">
                          <ContentTypeIcon type={lesson.contentType} />
                        </span>
                      )}

                      {/* Title, Subtype label, and DB KPIs */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-card-foreground truncate">
                            {lesson.title}
                          </span>
                          <span className="text-[10px] font-mono text-muted uppercase tracking-wider font-semibold">
                            {subtypeBadge}
                          </span>
                          <span className="text-[10px] font-mono text-muted">
                            · {lesson.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>

                        {/* Metrics: Time, XP, and Skill Tags */}
                        <div className="flex items-center gap-2 mt-0.5 overflow-hidden text-[10px] font-mono text-muted">
                          <span className="flex items-center gap-0.5">
                            <ClockDurationIcon className="w-3 h-3 text-muted" />
                            {estimatedMinutes}m
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 text-card-foreground font-semibold">
                            <ZapXpIcon className="w-3 h-3 text-card-foreground" />
                            {xpPoints} XP
                          </span>
                          {lesson.tags.length > 0 && (
                            <>
                              <span>·</span>
                              <div className="flex items-center gap-1 overflow-hidden">
                                {lesson.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag.tagId}
                                    className="text-[9px] font-mono text-muted bg-paper px-1 rounded-xs border border-border truncate"
                                  >
                                    #{tag.tagName}
                                  </span>
                                ))}
                                {lesson.tags.length > 3 && (
                                  <span className="text-[9px] font-mono text-muted">
                                    +{lesson.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reorder controls and order indicator */}
                    <div
                      className="flex items-center gap-1.5 shrink-0 ml-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center border border-border/80 rounded-xs overflow-hidden bg-paper opacity-60 group-hover/item:opacity-100 transition-opacity">
                        <button
                          type="button"
                          disabled={!canMoveItemUp || editor.reorderLessons.isPending}
                          onClick={() => handleReorderItem(itemIndex, -1)}
                          className="px-1.5 py-0.5 hover:bg-surface-hover text-muted hover:text-card-foreground active:scale-[0.95] transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                          title="Move lesson up in module sequence"
                        >
                          ↑
                        </button>
                        <span className="w-px h-3 bg-border" />
                        <button
                          type="button"
                          disabled={!canMoveItemDown || editor.reorderLessons.isPending}
                          onClick={() => handleReorderItem(itemIndex, 1)}
                          className="px-1.5 py-0.5 hover:bg-surface-hover text-muted hover:text-card-foreground active:scale-[0.95] transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                          title="Move lesson down in module sequence"
                        >
                          ↓
                        </button>
                      </div>
                      <span className="text-[10px] font-mono text-muted shrink-0">
                        #{module.moduleOrder}.{itemIndex + 1}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Bottom Quick-Add Strip in expanded module - Strictly B&W with lift-up and bold-press microinteractions */}
              <div className="pt-2.5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onCreateAction({ type: 'lesson', moduleId: module.moduleId })}
                  className={quickBtnClass}
                >
                  + Lesson
                </button>
                <button
                  type="button"
                  onClick={() => onCreateAction({ type: 'lab', moduleId: module.moduleId })}
                  className={quickLabBtnClass}
                >
                  <TerminalIcon className="w-3 h-3 text-current" /> Hands-On Lab
                </button>
                <button
                  type="button"
                  onClick={() => onCreateAction({ type: 'quiz', moduleId: module.moduleId })}
                  className={quickBtnClass}
                >
                  + Quiz
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main CurriculumTree Component ───────────────────────────────────────────

export function CurriculumTree({
  course,
  modules,
  selectedNode,
  onSelectNode,
  onCreateAction,
  onReorderModule,
  busyModuleIds = new Set(),
}: CurriculumTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'published' | 'draft'>('all');
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<number>>(() => new Set(modules.map((m) => m.moduleId)));

  const toggleModule = (id: number) => {
    setExpandedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedModuleIds(new Set(modules.map((m) => m.moduleId)));
  };

  const collapseAll = () => {
    setExpandedModuleIds(new Set());
  };

  // Filter modules according to published filter
  const filteredModules = useMemo(() => {
    let list = modules;
    if (filterState === 'published') {
      list = list.filter((m) => m.isPublished);
    } else if (filterState === 'draft') {
      list = list.filter((m) => !m.isPublished);
    }
    return list;
  }, [modules, filterState]);

  // DB-driven overall curriculum KPIs
  const totalCoursePoints = useMemo(() => {
    return (course.totalLessons * 60) + (course.totalQuizzes * 40) + 500;
  }, [course.totalLessons, course.totalQuizzes]);

  const badgesQuery = useBadgeCatalog();
  const courseBadge = useMemo(() => {
    const list = badgesQuery.data ?? [];
    return (
      list.find(
        (b) =>
          b.slug.toLowerCase().includes('devops') ||
          b.badgeType === 'diamond' ||
          b.badgeType === 'platinum' ||
          b.badgeType === 'gold',
      ) ??
      list[0] ??
      null
    );
  }, [badgesQuery.data]);

  const isCourseSelected = selectedNode?.type === 'course';

  return (
    <div className="space-y-4 w-full">
      {/* 1. TOP TOOLBAR: Search, Filters, and Expand/Collapse Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-md border border-border/50 bg-paper/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Input
            placeholder="Search modules, lessons, labs, quizzes…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs"
          />

          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value as 'all' | 'published' | 'draft')}
            className="filter-input text-xs font-mono shrink-0 h-9"
          >
            <option value="all">All States</option>
            <option value="published">Published</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center border border-border/80 rounded-xs overflow-hidden bg-card">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1 text-xs font-mono text-muted hover:text-card-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              title="Expand all modules"
            >
              Expand All
            </button>
            <span className="w-px h-3.5 bg-border" />
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1 text-xs font-mono text-muted hover:text-card-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              title="Collapse all modules"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* 2. COURSE ROOT NODE: Transparent aesthetic with DB-driven KPIs */}
      <div
        className={`p-4 rounded-md border transition-all cursor-pointer ${
          isCourseSelected
            ? 'border-brand-600 bg-brand-50/10 shadow-sm ring-1 ring-brand-600/30'
            : 'border-border/50 bg-transparent hover:border-border/80 hover:bg-surface/30'
        }`}
        onClick={() => onSelectNode({ type: 'course', id: course.courseId })}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xs bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <ServerStackIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                  Canonical Track
                </span>
                <span className="text-[10px] font-mono text-muted">
                  · {course.isPublished ? 'Live & Published' : 'Draft / Unpublished'}
                </span>
              </div>
              <h2 className="text-base font-bold text-card-foreground truncate mt-0.5">
                {course.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCreateAction({ type: 'module' });
              }}
              className="text-xs font-mono shadow-xs active:scale-[0.97] transition-all cursor-pointer"
            >
              + New Module
            </Button>
          </div>
        </div>

        {/* DB-Driven Course KPIs Strip: Points, Time, Badges, Modules */}
        <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-mono text-muted">
          <span className="flex items-center gap-1.5 text-card-foreground font-semibold">
            <ZapXpIcon className="w-3.5 h-3.5 text-card-foreground" />
            {totalCoursePoints.toLocaleString()} Total XP
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <ClockDurationIcon className="w-3.5 h-3.5 text-muted" />
            {course.estimatedHours} Estimated Hours
          </span>
          <span>·</span>
          <span>{modules.length} Modules</span>
          <span>·</span>
          <span>{course.totalLessons} Lessons & Labs</span>
          <span>·</span>
          <span>{course.totalQuizzes} Quizzes</span>
          <span>·</span>
          {courseBadge ? (
            <span
              className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
              title={`${courseBadge.description ?? courseBadge.badgeName} (${courseBadge.pointsRequired} pts required)`}
            >
              <TrophyBadgeIcon className="w-3.5 h-3.5" />
              {courseBadge.badgeName}
            </span>
          ) : badgesQuery.isLoading ? (
            <span className="h-4 w-28 bg-border/40 rounded-xs animate-pulse inline-block" />
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <TrophyBadgeIcon className="w-3.5 h-3.5" />
              Canonical Certified Track Badge
            </span>
          )}
        </div>
      </div>

      {/* 3. MODULE LIST / TREE HIERARCHY */}
      <div className="space-y-3">
        {filteredModules.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border/80 rounded-md bg-transparent">
            <p className="text-sm font-mono text-muted">No modules match current filters.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => onCreateAction({ type: 'module' })}
            >
              + Create First Module
            </Button>
          </div>
        ) : (
          filteredModules.map((module, index) => (
            <ModuleNode
              key={module.moduleId}
              module={module}
              courseId={course.courseId}
              isExpanded={expandedModuleIds.has(module.moduleId)}
              onToggleExpand={() => toggleModule(module.moduleId)}
              selectedNode={selectedNode}
              onSelectNode={onSelectNode}
              onCreateAction={onCreateAction}
              onReorder={
                onReorderModule
                  ? (direction) => onReorderModule(module.moduleId, direction)
                  : undefined
              }
              canMoveUp={index > 0}
              canMoveDown={index < filteredModules.length - 1}
              isBusy={busyModuleIds.has(module.moduleId)}
              searchFilter={searchTerm}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default CurriculumTree;
