import { useMemo, useState, type ReactNode } from 'react';
import { Button, ConfirmDialog, toast } from '@/shared/components';
import { cn } from '@/shared/utils';
import { useTrackDetail } from '@/features/labs/hooks';
import {
  useAdminModuleEditor,
  useAdminQuizEditor,
  useLearnModuleLessons,
  useLearnModuleQuizzes,
} from '../hooks';
import { CONTENT_TYPE_LABELS, ContentTypeIcon } from './ContentTypeIcon';
import type { AdminTrackDto, TrackContentItemDto } from '@/features/labs/types';
import type { CourseDto, LessonDto, ModuleDto, QuizDetailDto, QuizDto } from '../types';
import type { CreateAction, TreeNodeSelection } from './CurriculumTree';

/* ─── Public contract ────────────────────────────────────────────────────── */

export type InlineTreeRoot =
  { kind: 'track'; track: AdminTrackDto } | { kind: 'course'; course: CourseDto };

export interface InlineTreeActions {
  /** Open the entity in the task drawer (module/lesson/lab/quiz/course). */
  onSelect: (selection: TreeNodeSelection) => void;
  /** Open the matching create drawer (module/item). */
  onCreate: (action: CreateAction) => void;
  /** Open the canonical course settings drawer. */
  onEditCourse: (courseId: number) => void;
  onEditTrack?: (track: AdminTrackDto) => void;
  onAttachCourse?: (track: AdminTrackDto) => void;
  onToggleTrackPublish?: (track: AdminTrackDto, next: boolean) => void;
  onToggleCoursePublish?: (course: CourseDto, next: boolean) => void;
  onOpenCoursesTab?: () => void;
  busyTrackIds?: Set<number>;
  busyCourseIds?: Set<number>;
}

export interface CurriculumInlineTreeProps {
  /** Track roots (Tracks tab) or course roots (Courses tab). */
  roots: InlineTreeRoot[];
  /** Admin module list (all states); grouped by course inside the tree. */
  modules: ModuleDto[];
  modulesLoading?: boolean;
  modulesError?: string | null;
  onRetryModules?: () => void;
  /** Merged course list (published catalog + canonical course). */
  courses: CourseDto[];
  /** Only this course's modules/items are writable through the admin API. */
  canonicalCourseId: number | null;
  selected?: TreeNodeSelection | null;
  /** Auto-expanded node keys: `track-{id}`, `course-{id}`, `module-{id}`. */
  autoExpandKeys?: Set<string>;
  actions: InlineTreeActions;
}

export type CurriculumInlineTreeBaseProps = Omit<CurriculumInlineTreeProps, 'roots'>;

const EMPTY_KEYS: Set<string> = new Set();

/* ─── Shared row styling ─────────────────────────────────────────────────── */

const ROW_BASE =
  'w-full rounded-sm border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40';
const ROW_IDLE =
  'border-border/60 bg-transparent hover:border-paper-line-strong hover:bg-surface/40';
const ROW_SELECTED = 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-600/30';

function statusClass(isPublished: boolean): string {
  return isPublished ? 'text-success' : 'text-warning';
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */

function TrackIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M5 8v5a5 5 0 0 0 5 5h9" />
    </svg>
  );
}

function CourseIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ModuleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function LabIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function QuizIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/* ─── Expansion helper ───────────────────────────────────────────────────── */

/**
 * Local expand/collapse choice applies while the auto-expand signal is stable;
 * a new deep-link selection takes precedence over the previous manual choice.
 */
function useAutoOpen(key: string, autoExpandKeys: Set<string>) {
  const autoOpen = autoExpandKeys.has(key);
  const [manualOpen, setManualOpen] = useState<{ key: boolean; value: boolean } | null>(null);
  const open = manualOpen && manualOpen.key === autoOpen ? manualOpen.value : autoOpen;
  const toggle = () => setManualOpen({ key: autoOpen, value: !open });
  return { open, toggle };
}

/* ─── Small state blocks ─────────────────────────────────────────────────── */

function InlineNote({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-sm border border-dashed border-border bg-surface/30 px-2.5 py-3 text-center">
      <p className="text-xs font-semibold text-card-foreground">{title}</p>
      {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

function InlineError({
  title,
  message,
  onRetry,
  extraAction,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  extraAction?: ReactNode;
}) {
  return (
    <div className="rounded-sm border border-error/30 bg-error/5 px-2.5 py-2 text-center">
      <p className="text-xs font-semibold text-error">{title}</p>
      <p className="mt-0.5 text-xs text-error/80">{message}</p>
      {onRetry || extraAction ? (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {onRetry ? (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
          {extraAction}
        </div>
      ) : null}
    </div>
  );
}

function InlineLoadingRows() {
  return (
    <div className="space-y-1.5 py-0.5" aria-label="Loading hierarchy items" role="status">
      <div className="h-8 animate-pulse rounded-sm bg-border/30" />
      <div className="h-8 animate-pulse rounded-sm bg-border/30" />
    </div>
  );
}

/* ─── Publish control ────────────────────────────────────────────────────── */

function InlinePublishButton({
  isPublished,
  label,
  busy,
  onPublish,
  onUnpublish,
}: {
  isPublished: boolean;
  label: string;
  busy: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="font-mono text-micro"
        disabled={busy}
        title={`${isPublished ? 'Unpublish' : 'Publish'} ${label}`}
        onClick={() => (isPublished ? setConfirming(true) : onPublish())}
      >
        {busy ? 'Working…' : isPublished ? 'Unpublish' : 'Publish'}
      </Button>
      <ConfirmDialog
        open={confirming}
        title="Unpublish"
        message={`This will hide ${label} from learners. Continue?`}
        confirmLabel="Unpublish"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onUnpublish();
        }}
      />
    </>
  );
}

/* ─── Linked track content rows (labs / unknown courses) ─────────────────── */

function InlineLinkedItemRow({
  item,
  actions,
}: {
  item: TrackContentItemDto;
  actions: InlineTreeActions;
}) {
  const isLab = item.contentType === 'lab';
  const label = isLab ? 'Linked lab' : 'Linked course';

  return (
    <div className={cn(ROW_BASE, 'flex items-center gap-2 border-border/60 bg-transparent')}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted">
        {isLab ? <LabIcon /> : <CourseIcon />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-card-foreground">
          {item.title}
        </span>
        <span className="block truncate font-mono text-micro text-muted">
          {label} · content #{item.contentId} · {item.required ? 'Required' : 'Optional'}
        </span>
      </span>
      {!isLab && actions.onOpenCoursesTab ? (
        <Button variant="ghost" size="sm" onClick={actions.onOpenCoursesTab}>
          Courses tab
        </Button>
      ) : null}
    </div>
  );
}

/* ─── Leaf item rows (canonical module) ──────────────────────────────────── */

function InlineLessonRow({
  lesson,
  moduleId,
  selected,
  publishPending,
  onSelect,
  onTogglePublish,
}: {
  lesson: LessonDto;
  moduleId: number;
  selected: TreeNodeSelection | null;
  publishPending: boolean;
  onSelect: (selection: TreeNodeSelection) => void;
  onTogglePublish: (lesson: LessonDto) => void;
}) {
  const isLab = lesson.contentType === 'lab';
  const isSelected = isLab
    ? selected?.type === 'lab' && selected.id === lesson.lessonId
    : selected?.type === 'lesson' && selected.id === lesson.lessonId;

  return (
    <div className={cn(ROW_BASE, isSelected ? ROW_SELECTED : ROW_IDLE, 'flex items-center gap-2')}>
      <button
        type="button"
        onClick={() =>
          onSelect(
            isLab
              ? { type: 'lab', id: lesson.lessonId, moduleId }
              : { type: 'lesson', id: lesson.lessonId, moduleId },
          )
        }
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        {isLab ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted">
            <LabIcon />
          </span>
        ) : (
          <ContentTypeIcon type={lesson.contentType} />
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-card-foreground">
          {lesson.title}
        </span>
        <span className="shrink-0 font-mono text-micro text-muted">
          {isLab ? 'Lab' : CONTENT_TYPE_LABELS[lesson.contentType]}
        </span>
        <span className={cn('shrink-0 text-micro font-medium', statusClass(lesson.isPublished))}>
          {lesson.isPublished ? 'Published' : 'Draft'}
        </span>
      </button>
      <InlinePublishButton
        isPublished={lesson.isPublished}
        label={lesson.title}
        busy={publishPending}
        onPublish={() => onTogglePublish(lesson)}
        onUnpublish={() => onTogglePublish(lesson)}
      />
    </div>
  );
}

function InlineQuizRow({
  quiz,
  moduleId,
  selected,
  onSelect,
}: {
  quiz: QuizDetailDto;
  moduleId: number;
  selected: TreeNodeSelection | null;
  onSelect: (selection: TreeNodeSelection) => void;
}) {
  // Disabled query: this row only needs the publish mutation, not the quiz body.
  const quizEditor = useAdminQuizEditor(quiz.quizId, false);
  const isSelected = selected?.type === 'quiz' && selected.id === quiz.quizId;
  const pending = quizEditor.update.isPending;

  const togglePublish = () => {
    quizEditor.update.mutate(
      { isPublished: !quiz.isPublished },
      {
        onSuccess: () => toast.success(quiz.isPublished ? 'Quiz unpublished.' : 'Quiz published.'),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className={cn(ROW_BASE, isSelected ? ROW_SELECTED : ROW_IDLE, 'flex items-center gap-2')}>
      <button
        type="button"
        onClick={() => onSelect({ type: 'quiz', id: quiz.quizId, moduleId })}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted">
          <QuizIcon />
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-card-foreground">
          {quiz.title}
        </span>
        <span className="shrink-0 font-mono text-micro text-muted">
          Quiz · {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}
        </span>
        <span className={cn('shrink-0 text-micro font-medium', statusClass(quiz.isPublished))}>
          {quiz.isPublished ? 'Published' : 'Draft'}
        </span>
      </button>
      <InlinePublishButton
        isPublished={quiz.isPublished}
        label={quiz.title}
        busy={pending}
        onPublish={togglePublish}
        onUnpublish={togglePublish}
      />
    </div>
  );
}

/* ─── Read-only leaf rows (non-canonical module preview) ─────────────────── */

function InlineReadOnlyLessonRow({ lesson }: { lesson: LessonDto }) {
  const isLab = lesson.contentType === 'lab';
  return (
    <div className={cn(ROW_BASE, 'flex items-center gap-2 border-border/60 bg-transparent')}>
      {isLab ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted">
          <LabIcon />
        </span>
      ) : (
        <ContentTypeIcon type={lesson.contentType} />
      )}
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-card-foreground">
        {lesson.title}
      </span>
      <span className="shrink-0 font-mono text-micro text-muted">
        {isLab ? 'Lab' : CONTENT_TYPE_LABELS[lesson.contentType]}
      </span>
      <span className="shrink-0 text-micro font-medium text-success">Published</span>
    </div>
  );
}

function InlineReadOnlyQuizRow({ quiz }: { quiz: QuizDto }) {
  return (
    <div className={cn(ROW_BASE, 'flex items-center gap-2 border-border/60 bg-transparent')}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted">
        <QuizIcon />
      </span>
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-card-foreground">
        {quiz.title}
      </span>
      <span className="shrink-0 font-mono text-micro text-muted">
        Quiz · {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}
      </span>
      <span className="shrink-0 text-micro font-medium text-success">Published</span>
    </div>
  );
}

/* ─── Module node ────────────────────────────────────────────────────────── */

function InlineModuleNode({
  module,
  manageable,
  selected,
  autoExpandKeys,
  actions,
}: {
  module: ModuleDto;
  manageable: boolean;
  selected: TreeNodeSelection | null;
  autoExpandKeys: Set<string>;
  actions: InlineTreeActions;
}) {
  const { open, toggle } = useAutoOpen(`module-${module.moduleId}`, autoExpandKeys);
  const adminEditor = useAdminModuleEditor(module.moduleId, open && manageable);
  const readOnlyLessons = useLearnModuleLessons(
    module.moduleId,
    open && !manageable && module.isPublished,
  );
  const readOnlyQuizzes = useLearnModuleQuizzes(
    module.moduleId,
    open && !manageable && module.isPublished,
  );

  const isSelected = selected?.type === 'module' && selected.id === module.moduleId;

  const lessons = adminEditor.query.data?.lessons;
  const quizzes = adminEditor.query.data?.quizzes ?? [];
  const orderedLessons = useMemo(
    () => [...(lessons ?? [])].sort((a, b) => a.lessonOrder - b.lessonOrder),
    [lessons],
  );

  const lessonPublishPending =
    adminEditor.publishLesson.isPending || adminEditor.updateLesson.isPending;

  const toggleLessonPublish = (lesson: LessonDto) => {
    if (lesson.isPublished) {
      adminEditor.updateLesson.mutate(
        { lessonId: lesson.lessonId, data: { isPublished: false } },
        {
          onSuccess: () => toast.success('Lesson unpublished.'),
          onError: (error) => toast.error(error.message),
        },
      );
    } else {
      adminEditor.publishLesson.mutate(lesson.lessonId, {
        onSuccess: () => toast.success('Lesson published.'),
        onError: (error) => toast.error(error.message),
      });
    }
  };

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          ROW_BASE,
          isSelected ? ROW_SELECTED : ROW_IDLE,
          'flex flex-wrap items-center gap-1.5',
        )}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={open ? `Collapse ${module.title}` : `Expand ${module.title}`}
          aria-expanded={open}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs text-muted transition-colors hover:bg-surface hover:text-card-foreground"
        >
          <ChevronIcon open={open} />
        </button>
        {!manageable ? (
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center text-muted"
            title="Read-only preview"
          >
            <ModuleIcon />
          </span>
        ) : null}

        {manageable ? (
          <button
            type="button"
            onClick={() => actions.onSelect({ type: 'module', id: module.moduleId })}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-card-foreground">
              {module.title}
            </span>
            <span className="shrink-0 font-mono text-micro text-muted">M{module.moduleOrder}</span>
            <span className="shrink-0 text-micro text-muted">
              {module.lessonCount} {module.lessonCount === 1 ? 'item' : 'items'} ·{' '}
              {module.estimatedMinutes} min
            </span>
            <span
              className={cn('shrink-0 text-micro font-medium', statusClass(module.isPublished))}
            >
              {module.isPublished ? 'Published' : 'Draft'}
            </span>
          </button>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-card-foreground">
              {module.title}
            </span>
            <span className="shrink-0 font-mono text-micro text-muted">M{module.moduleOrder}</span>
            <span className="shrink-0 text-micro text-muted">
              {module.lessonCount} {module.lessonCount === 1 ? 'item' : 'items'} ·{' '}
              {module.estimatedMinutes} min
            </span>
            <span
              className={cn('shrink-0 text-micro font-medium', statusClass(module.isPublished))}
            >
              {module.isPublished ? 'Published' : 'Draft'}
            </span>
          </span>
        )}

        {manageable && open ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-micro"
              onClick={() => actions.onCreate({ type: 'lesson', moduleId: module.moduleId })}
            >
              + Lesson
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-micro"
              onClick={() => actions.onCreate({ type: 'lab', moduleId: module.moduleId })}
            >
              + Lab
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-micro"
              onClick={() => actions.onCreate({ type: 'quiz', moduleId: module.moduleId })}
            >
              + Quiz
            </Button>
          </div>
        ) : null}
      </div>

      {manageable && open ? (
        <div className="ml-3 space-y-1.5 border-l border-border pl-3">
          {adminEditor.query.isLoading ? (
            <InlineLoadingRows />
          ) : adminEditor.query.isError ? (
            <InlineError
              title="Could not load module items"
              message={adminEditor.query.error?.message ?? 'This module could not be loaded.'}
              onRetry={() => void adminEditor.query.refetch()}
            />
          ) : orderedLessons.length === 0 && quizzes.length === 0 ? (
            <InlineNote
              title="No lessons, labs or quizzes yet."
              description="Create the first item in this module."
              action={
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => actions.onCreate({ type: 'lesson', moduleId: module.moduleId })}
                  >
                    + Lesson
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => actions.onCreate({ type: 'lab', moduleId: module.moduleId })}
                  >
                    + Lab
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => actions.onCreate({ type: 'quiz', moduleId: module.moduleId })}
                  >
                    + Quiz
                  </Button>
                </>
              }
            />
          ) : (
            <>
              {orderedLessons.map((lesson) => (
                <InlineLessonRow
                  key={`lesson-${lesson.lessonId}`}
                  lesson={lesson}
                  moduleId={module.moduleId}
                  selected={selected}
                  publishPending={lessonPublishPending}
                  onSelect={actions.onSelect}
                  onTogglePublish={toggleLessonPublish}
                />
              ))}
              {quizzes.map((quiz) => (
                <InlineQuizRow
                  key={`quiz-${quiz.quizId}`}
                  quiz={quiz}
                  moduleId={module.moduleId}
                  selected={selected}
                  onSelect={actions.onSelect}
                />
              ))}
            </>
          )}
        </div>
      ) : null}

      {!manageable && open ? (
        <div className="ml-3 space-y-1.5 border-l border-border pl-3">
          {!module.isPublished ? (
            <InlineNote
              title="Draft module in another course"
              description="Only published items can be previewed and this module is still a draft. Content editing is limited to the canonical course."
            />
          ) : (
            <>
              <p className="font-mono text-micro text-muted">
                Read-only preview · published items only. This module belongs to another course; use
                the canonical course to edit content.
              </p>
              {readOnlyLessons.isLoading || readOnlyQuizzes.isLoading ? (
                <InlineLoadingRows />
              ) : readOnlyLessons.isError || readOnlyQuizzes.isError ? (
                <InlineError
                  title="Could not load the published preview"
                  message={
                    readOnlyLessons.error?.message ??
                    readOnlyQuizzes.error?.message ??
                    'The published items are unavailable.'
                  }
                  onRetry={() => {
                    void readOnlyLessons.refetch();
                    void readOnlyQuizzes.refetch();
                  }}
                />
              ) : (readOnlyLessons.data ?? []).length === 0 &&
                (readOnlyQuizzes.data ?? []).length === 0 ? (
                <InlineNote
                  title="No published items."
                  description="This module has no published lessons or quizzes to preview."
                />
              ) : (
                <>
                  {(readOnlyLessons.data ?? []).map((lesson) => (
                    <InlineReadOnlyLessonRow key={`ro-lesson-${lesson.lessonId}`} lesson={lesson} />
                  ))}
                  {(readOnlyQuizzes.data ?? []).map((quiz) => (
                    <InlineReadOnlyQuizRow key={`ro-quiz-${quiz.quizId}`} quiz={quiz} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ─── Course node ────────────────────────────────────────────────────────── */

function InlineCourseNode({
  course,
  modules,
  modulesLoading,
  modulesError,
  onRetryModules,
  manageable,
  selected,
  autoExpandKeys,
  actions,
}: {
  course: CourseDto;
  modules: ModuleDto[];
  modulesLoading: boolean;
  modulesError: string | null;
  onRetryModules?: () => void;
  manageable: boolean;
  selected: TreeNodeSelection | null;
  autoExpandKeys: Set<string>;
  actions: InlineTreeActions;
}) {
  const { open, toggle } = useAutoOpen(`course-${course.courseId}`, autoExpandKeys);
  const isSelected = selected?.type === 'course' && selected.id === course.courseId;
  const busy = actions.busyCourseIds?.has(course.courseId) ?? false;

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          ROW_BASE,
          isSelected ? ROW_SELECTED : ROW_IDLE,
          'flex flex-wrap items-center gap-2',
        )}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={open ? `Collapse ${course.title}` : `Expand ${course.title}`}
          aria-expanded={open}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs text-muted transition-colors hover:bg-surface hover:text-card-foreground"
        >
          <ChevronIcon open={open} />
        </button>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs bg-brand-50 text-brand-600">
          <CourseIcon />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-card-foreground">
            {course.title}
          </span>
          <span className="block truncate font-mono text-micro text-muted">
            /{course.slug} · {modules.length} {modules.length === 1 ? 'module' : 'modules'} ·{' '}
            {course.estimatedHours} hrs
          </span>
        </span>

        <span className={cn('shrink-0 text-micro font-medium', statusClass(course.isPublished))}>
          {course.isPublished ? 'Published' : 'Draft'}
        </span>

        {!manageable ? (
          <span
            className="shrink-0 font-mono text-micro text-muted"
            title="The admin editor manages the canonical course only."
          >
            Read-only
          </span>
        ) : null}

        {manageable ? (
          <div className="flex shrink-0 items-center gap-1.5">
            {actions.onToggleCoursePublish ? (
              <InlinePublishButton
                isPublished={course.isPublished}
                label={course.title}
                busy={busy}
                onPublish={() => actions.onToggleCoursePublish?.(course, true)}
                onUnpublish={() => actions.onToggleCoursePublish?.(course, false)}
              />
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => actions.onEditCourse(course.courseId)}
            >
              Edit course
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => actions.onCreate({ type: 'module' })}
            >
              + New Module
            </Button>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="ml-3 space-y-1.5 border-l border-border pl-3">
          {modulesLoading ? (
            <InlineLoadingRows />
          ) : modulesError ? (
            <InlineError
              title="Could not load modules"
              message={modulesError}
              onRetry={onRetryModules}
            />
          ) : modules.length === 0 ? (
            <InlineNote
              title="No modules yet."
              description={
                manageable
                  ? 'Modules are the top-level sections of the course.'
                  : 'This course has no published modules to preview.'
              }
              action={
                manageable ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => actions.onCreate({ type: 'module' })}
                  >
                    + New Module
                  </Button>
                ) : actions.onOpenCoursesTab ? (
                  <Button variant="secondary" size="sm" onClick={actions.onOpenCoursesTab}>
                    Open Courses tab
                  </Button>
                ) : undefined
              }
            />
          ) : (
            modules.map((module) => (
              <InlineModuleNode
                key={module.moduleId}
                module={module}
                manageable={manageable}
                selected={selected}
                autoExpandKeys={autoExpandKeys}
                actions={actions}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ─── Track node ─────────────────────────────────────────────────────────── */

function InlineTrackNode({
  track,
  coursesById,
  canonicalCourseId,
  modulesByCourse,
  modulesLoading,
  modulesError,
  onRetryModules,
  selected,
  autoExpandKeys,
  actions,
}: {
  track: AdminTrackDto;
  coursesById: Map<number, CourseDto>;
  canonicalCourseId: number | null;
  modulesByCourse: Map<number, ModuleDto[]>;
  modulesLoading: boolean;
  modulesError: string | null;
  onRetryModules?: () => void;
  selected: TreeNodeSelection | null;
  autoExpandKeys: Set<string>;
  actions: InlineTreeActions;
}) {
  const { open, toggle } = useAutoOpen(`track-${track.trackId}`, autoExpandKeys);
  const detail = useTrackDetail(String(track.trackId), open && track.isActive);
  const busy = actions.busyTrackIds?.has(track.trackId) ?? false;

  return (
    <div className="space-y-1.5">
      <div
        className={cn(ROW_BASE, 'flex flex-wrap items-center gap-2 border-border bg-surface/50')}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={open ? `Collapse ${track.trackName}` : `Expand ${track.trackName}`}
          aria-expanded={open}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs text-muted transition-colors hover:bg-surface hover:text-card-foreground"
        >
          <ChevronIcon open={open} />
        </button>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs bg-brand-50 text-brand-600">
          <TrackIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-card-foreground">
            {track.trackName}
          </span>
          <span className="block truncate font-mono text-micro text-muted">
            /{track.slug} · {track.difficultyName ?? 'Any difficulty'} · {track.estimatedHours} hrs
          </span>
        </span>
        <span className={cn('shrink-0 text-micro font-medium', statusClass(track.isActive))}>
          {track.isActive ? 'Published' : 'Draft'}
        </span>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {actions.onToggleTrackPublish ? (
            <InlinePublishButton
              isPublished={track.isActive}
              label={track.trackName}
              busy={busy}
              onPublish={() => actions.onToggleTrackPublish?.(track, true)}
              onUnpublish={() => actions.onToggleTrackPublish?.(track, false)}
            />
          ) : null}
          {actions.onAttachCourse ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={!track.isActive || busy}
              title={
                track.isActive
                  ? 'Attach an existing course to this track'
                  : 'Publish this track before attaching courses.'
              }
              onClick={() => actions.onAttachCourse?.(track)}
            >
              Attach course
            </Button>
          ) : null}
          {actions.onEditTrack ? (
            <Button variant="secondary" size="sm" onClick={() => actions.onEditTrack?.(track)}>
              Edit track
            </Button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="ml-3 space-y-1.5 border-l border-border pl-3">
          {!track.isActive ? (
            <InlineNote
              title="Hierarchy hidden for draft tracks"
              description="The tracks API returns linked content for published tracks only. Publish this track to inspect and attach its courses."
              action={
                actions.onToggleTrackPublish ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => actions.onToggleTrackPublish?.(track, true)}
                  >
                    Publish track
                  </Button>
                ) : undefined
              }
            />
          ) : detail.isLoading ? (
            <InlineLoadingRows />
          ) : detail.isError ? (
            <InlineError
              title="Could not load track hierarchy"
              message={detail.error?.message ?? 'The track hierarchy is unavailable.'}
              onRetry={() => void detail.refetch()}
            />
          ) : !detail.data ? (
            <InlineError
              title="Track hierarchy unavailable"
              message="The tracks API returned no hierarchy for this track."
              onRetry={() => void detail.refetch()}
            />
          ) : detail.data.items.length === 0 ? (
            <InlineNote
              title="No content linked to this track yet."
              description="Attach an existing course to build the track hierarchy."
              action={
                actions.onAttachCourse ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => actions.onAttachCourse?.(track)}
                  >
                    Attach existing course
                  </Button>
                ) : undefined
              }
            />
          ) : (
            [...detail.data.items]
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((item) => {
                const linkedCourse =
                  item.contentType === 'course' ? coursesById.get(item.contentId) : undefined;
                if (linkedCourse) {
                  return (
                    <InlineCourseNode
                      key={`course-${linkedCourse.courseId}`}
                      course={linkedCourse}
                      modules={modulesByCourse.get(linkedCourse.courseId) ?? []}
                      modulesLoading={modulesLoading}
                      modulesError={modulesError}
                      onRetryModules={onRetryModules}
                      manageable={linkedCourse.courseId === canonicalCourseId}
                      selected={selected}
                      autoExpandKeys={autoExpandKeys}
                      actions={actions}
                    />
                  );
                }
                return (
                  <InlineLinkedItemRow
                    key={`${item.contentType}-${item.contentId}`}
                    item={item}
                    actions={actions}
                  />
                );
              })
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ─── Public component ───────────────────────────────────────────────────── */

/**
 * Inline indented curriculum tree used inside the Tracks and Courses tabs.
 * Renders only real API data: tracks → linked courses/labs → modules →
 * lessons/quizzes/labs. Module children are fetched lazily on expand; only
 * the canonical course exposes write controls (the admin API enforces it).
 */
export function CurriculumInlineTree({
  roots,
  modules,
  modulesLoading = false,
  modulesError = null,
  onRetryModules,
  courses,
  canonicalCourseId,
  selected = null,
  autoExpandKeys = EMPTY_KEYS,
  actions,
}: CurriculumInlineTreeProps) {
  const coursesById = useMemo(() => {
    const map = new Map<number, CourseDto>();
    for (const course of courses) {
      map.set(course.courseId, course);
    }
    return map;
  }, [courses]);

  const modulesByCourse = useMemo(() => {
    const map = new Map<number, ModuleDto[]>();
    for (const module of modules) {
      const list = map.get(module.courseId) ?? [];
      list.push(module);
      map.set(module.courseId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.moduleOrder - b.moduleOrder);
    }
    return map;
  }, [modules]);

  if (roots.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {roots.map((root) =>
        root.kind === 'track' ? (
          <InlineTrackNode
            key={`track-${root.track.trackId}`}
            track={root.track}
            coursesById={coursesById}
            canonicalCourseId={canonicalCourseId}
            modulesByCourse={modulesByCourse}
            modulesLoading={modulesLoading}
            modulesError={modulesError}
            onRetryModules={onRetryModules}
            selected={selected}
            autoExpandKeys={autoExpandKeys}
            actions={actions}
          />
        ) : (
          <InlineCourseNode
            key={`course-${root.course.courseId}`}
            course={root.course}
            modules={modulesByCourse.get(root.course.courseId) ?? []}
            modulesLoading={modulesLoading}
            modulesError={modulesError}
            onRetryModules={onRetryModules}
            manageable={root.course.courseId === canonicalCourseId}
            selected={selected}
            autoExpandKeys={autoExpandKeys}
            actions={actions}
          />
        ),
      )}
    </div>
  );
}

export default CurriculumInlineTree;
