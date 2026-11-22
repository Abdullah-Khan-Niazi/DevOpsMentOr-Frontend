import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { AdminTrackDto } from '@/features/labs/types/admin';
import {
  Button,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  Switch,
  Tree,
  TreeItem,
  TreeSkeleton,
  type IconName,
} from '@/shared/components';
import { cn } from '@/shared/utils';
import {
  useAdminCourse,
  useAdminCourseModules,
  useAdminCourses,
  useAdminModule,
  useDeleteCourse,
  useDeleteItem,
  useDeleteModule,
  useSetCoursePublished,
  useSetItemPublished,
  useSetModulePublished,
  type ModuleCacheTarget,
} from '../../hooks/useAdminCurriculum';
import {
  useAdminTrack,
  useAdminTracks,
  useDetachCourse,
  useSetTrackActive,
} from '../../hooks/useAdminTracks';
import type {
  AdminCourseListParams,
  AdminModuleDto,
  AdminModuleItemDto,
  AdminModuleListParams,
  PublishFilter,
} from '../../types/admin';
import { DeleteEntityDialog } from './DeleteEntityDialog';
import type { CurriculumDrawer, CurriculumDrawerKind } from './useCurriculumUrlState';

/**
 * One shared tree for the staff control panel. The root level is the active tab;
 * children load lazily when a node opens. Row actions follow the FE§3.2 table and
 * are hidden without `platform.curriculum.manage` (the backend enforces the same).
 */

const MANAGE_PERMISSION = 'platform.curriculum.manage';
/** Lab step specs are edited with the labs permission (FE§3). */
const LABS_PERMISSION = 'platform.labs.manage';

export type CurriculumRootLevel = 'track' | 'course' | 'module';

export interface CurriculumTreeProps {
  rootLevel: CurriculumRootLevel;
  /** Debounced, trimmed search text. */
  search: string;
  status: PublishFilter;
  /** Course scope of the modules root. */
  courseId?: number | null;
  selectedDrawer: CurriculumDrawer | null;
  onOpenDrawer: (kind: CurriculumDrawerKind, id: number) => void;
  /** Node created a moment ago: it scrolls into view and flashes (`.flash-new`). */
  flash?: TreeFlash | null;
  /**
   * Expand all / collapse all from the toolbar: bump `version` to apply `open` to
   * every node. Nodes that mount later (lazy children) start in that state.
   */
  expand?: TreeExpandSignal | null;
}

export interface TreeExpandSignal {
  open: boolean;
  version: number;
}

/** A node by level and id (`item` is the module item id). */
export interface TreeFlash {
  kind: 'track' | 'course' | 'module' | 'item';
  id: number;
}

interface TreeContext {
  flash: TreeFlash | null;
  expand: TreeExpandSignal | null;
  canManage: boolean;
  canManageLabs: boolean;
  search: string;
  status: PublishFilter;
  selectedDrawer: CurriculumDrawer | null;
  onOpenDrawer: (kind: CurriculumDrawerKind, id: number) => void;
}

const TREE_LABELS: Record<CurriculumRootLevel, string> = {
  track: 'Tracks',
  course: 'Courses',
  module: 'Modules',
};

function usePermission(permission: string): boolean {
  return useAuthStore((state) => state.user?.permissions?.includes(permission) ?? false);
}

function matchesSearch(search: string, ...fields: Array<string | null | undefined>): boolean {
  if (!search) return true;
  const needle = search.toLowerCase();
  return fields.some((field) => field?.toLowerCase().includes(needle) ?? false);
}

function matchesStatus(status: PublishFilter, isPublished: boolean): boolean {
  if (status === 'all') return true;
  return status === 'published' ? isPublished : !isPublished;
}

/** A node's expanded state, following the toolbar's expand/collapse all signal. */
function useNodeOpen(ctx: TreeContext): [boolean, () => void] {
  const signal = ctx.expand;
  const [open, setOpen] = useState(signal?.open ?? false);
  const [seenVersion, setSeenVersion] = useState(signal?.version ?? 0);
  if (signal && signal.version !== seenVersion) {
    setSeenVersion(signal.version);
    setOpen(signal.open);
  }
  return [open, () => setOpen((value) => !value)];
}

/** `flash-new` row class for the flashed node, scrolled into view once it renders. */
function useFlashRow(ctx: TreeContext, kind: TreeFlash['kind'], id: number, treeId: string) {
  const flashing = ctx.flash !== null && ctx.flash.kind === kind && ctx.flash.id === id;
  useEffect(() => {
    if (!flashing) return;
    document
      .querySelector(`[data-tree-id="${treeId}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [flashing, treeId]);
  return flashing ? 'flash-new' : undefined;
}

function isDrawerOpen(
  drawer: CurriculumDrawer | null,
  kind: CurriculumDrawerKind,
  id: number,
): boolean {
  return drawer !== null && drawer.kind === kind && drawer.id === id;
}

function courseListParams(ctx: TreeContext): AdminCourseListParams {
  return { search: ctx.search, status: ctx.status };
}

function moduleListParams(ctx: TreeContext): AdminModuleListParams {
  return {
    search: ctx.search || undefined,
    isPublished: ctx.status === 'all' ? undefined : ctx.status === 'published',
  };
}

/* ── Row pieces ────────────────────────────────────────────────────────── */

/** Icon followed by a number; the unit is kept for screen readers only. */
function Count({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1" title={`${value} ${label}`}>
      <Icon name={icon} size={14} />
      <span>{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function NodeLabel({ text, draft }: { text: string; draft: boolean }) {
  return (
    <>
      {text}
      {draft ? (
        <span
          className="has-tooltip ml-1 inline-flex shrink-0 align-middle text-muted"
          data-tooltip="Draft"
        >
          <Icon name="visibility-off" size={14} title="Draft" />
        </span>
      ) : null}
    </>
  );
}

interface MenuAction {
  label: string;
  icon: IconName;
  onSelect: () => void;
  tone?: 'danger';
}

/**
 * Overflow menu for a row (`More`): focus moves to the first item on open,
 * Up/Down move between items, Escape, scrolling or an outside press closes it.
 * The menu is fixed-positioned so the tree's collapsible groups (overflow
 * hidden) never clip it.
 */
function RowMenu({ label, actions }: { label: string; actions: MenuAction[] }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const open = position !== null;

  function toggle() {
    const rect = triggerRef.current?.getBoundingClientRect();
    setPosition(
      !open && rect ? { top: rect.bottom + 4, right: window.innerWidth - rect.right } : null,
    );
  }

  useEffect(() => {
    if (!open) return;
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus({ preventScroll: true });
    function handleMouseDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setPosition(null);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      // Keep an enclosing overlay open: this Escape only closes the menu.
      event.stopPropagation();
      setPosition(null);
      triggerRef.current?.focus();
    }
    function handleViewportChange() {
      setPosition(null);
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [open]);

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    items[(index + step + items.length) % items.length]?.focus();
  }

  return (
    <span ref={rootRef} className="relative inline-flex">
      <IconButton
        ref={triggerRef}
        icon="more-horizontal"
        label={label}
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      />
      {position ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          style={{ top: position.top, right: position.right }}
          className="fixed z-[var(--z-floating)] flex min-w-40 flex-col gap-0.5 rounded-md bg-card p-1 shadow-md"
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-2 whitespace-nowrap rounded-sm px-2 py-1.5 text-left text-sm hover:bg-pearl-200 focus-visible:bg-pearl-200 focus-visible:outline-none',
                action.tone === 'danger' && 'text-signal',
              )}
              onClick={() => {
                setPosition(null);
                action.onSelect();
              }}
            >
              <Icon name={action.icon} size={18} />
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </span>
  );
}

/* ── Nodes ─────────────────────────────────────────────────────────────── */

interface TrackNodeProps {
  track: AdminTrackDto;
  ctx: TreeContext;
}

function TrackNode({ track, ctx }: TrackNodeProps) {
  const { trackId } = track;
  const [open, toggleOpen] = useNodeOpen(ctx);
  const detail = useAdminTrack(trackId, open);
  const setActive = useSetTrackActive(trackId);
  const selected = isDrawerOpen(ctx.selectedDrawer, 'track', trackId);
  const flashClass = useFlashRow(ctx, 'track', trackId, `track-${trackId}`);

  const content = (detail.data?.content ?? []).filter(
    (row) => matchesSearch(ctx.search, row.title) && matchesStatus(ctx.status, row.isPublished),
  );

  const editButton = (
    <IconButton
      icon="edit"
      label="Edit track"
      size="sm"
      onClick={() => ctx.onOpenDrawer('track', trackId)}
    />
  );
  const publishSwitch = (
    <Switch
      size="sm"
      checked={track.isActive}
      onCheckedChange={(next) => setActive.mutate(next)}
      aria-label="Track published"
    />
  );

  return (
    <TreeItem
      id={`track-${trackId}`}
      rowClassName={flashClass}
      level={1}
      label={<NodeLabel text={track.trackName} draft={!track.isActive} />}
      meta={<Count icon="course" value={track.courseCount} label="courses" />}
      icon="track"
      expandable
      open={open}
      onToggle={toggleOpen}
      onActivate={ctx.canManage ? () => ctx.onOpenDrawer('track', trackId) : undefined}
      selected={selected}
      muted={!track.isActive}
      actions={
        ctx.canManage ? (
          <>
            {editButton}
            <IconButton
              icon="plus"
              label="Attach course"
              size="sm"
              onClick={() => ctx.onOpenDrawer('attach-course', trackId)}
            />
            {publishSwitch}
          </>
        ) : null
      }
      headerActions={
        ctx.canManage ? (
          <>
            {editButton}
            {publishSwitch}
          </>
        ) : null
      }
      footerActions={
        ctx.canManage ? (
          <Button
            variant="ghost"
            size="sm"
            iconName="plus"
            onClick={() => ctx.onOpenDrawer('attach-course', trackId)}
          >
            Attach course
          </Button>
        ) : null
      }
      loading={open && detail.isLoading}
      error={open && detail.isError ? detail.error : undefined}
      onRetry={() => void detail.refetch()}
    >
      {content.map((row) => (
        <CourseNode
          key={row.courseId}
          courseId={row.courseId}
          title={row.title}
          isPublished={row.isPublished}
          moduleCount={row.moduleCount}
          itemCount={row.itemCount}
          trackId={trackId}
          level={2}
          ctx={ctx}
        />
      ))}
    </TreeItem>
  );
}

interface CourseNodeProps {
  courseId: number;
  title: string;
  isPublished: boolean;
  moduleCount: number;
  itemCount: number;
  /** Set when the course is shown under a track (enables Detach). */
  trackId: number | null;
  level: number;
  ctx: TreeContext;
}

function CourseNode({
  courseId,
  title,
  isPublished,
  moduleCount,
  itemCount,
  trackId,
  level,
  ctx,
}: CourseNodeProps) {
  const [open, toggleOpen] = useNodeOpen(ctx);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const detail = useAdminCourse(courseId, open);
  const listParams = courseListParams(ctx);
  const setPublished = useSetCoursePublished(courseId, listParams);
  const deleteCourse = useDeleteCourse(listParams);
  const detach = useDetachCourse(trackId ?? 0);
  const selected = isDrawerOpen(ctx.selectedDrawer, 'course', courseId);
  const treeId = `${trackId === null ? 'courses' : `track-${trackId}`}-course-${courseId}`;
  const flashClass = useFlashRow(ctx, 'course', courseId, treeId);

  const modules = (detail.data?.modules ?? []).filter(
    (module) =>
      matchesSearch(ctx.search, module.title, module.slug) &&
      matchesStatus(ctx.status, module.isPublished),
  );

  const editButton = (
    <IconButton
      icon="edit"
      label="Edit course"
      size="sm"
      onClick={() => ctx.onOpenDrawer('course', courseId)}
    />
  );
  const publishSwitch = (
    <Switch
      size="sm"
      checked={isPublished}
      onCheckedChange={(next) => setPublished.mutate(next)}
      aria-label="Course published"
    />
  );

  const menuActions: MenuAction[] = [
    ...(isPublished
      ? [{ label: 'Archive', icon: 'archive' as const, onSelect: () => setPublished.mutate(false) }]
      : []),
    ...(trackId !== null
      ? [
          {
            label: 'Detach from track',
            icon: 'link' as const,
            onSelect: () => detach.mutate(courseId),
          },
        ]
      : []),
    { label: 'Delete', icon: 'delete', tone: 'danger', onSelect: () => setDeleteOpen(true) },
  ];

  return (
    <>
      <TreeItem
        id={treeId}
        rowClassName={flashClass}
        level={level}
        label={<NodeLabel text={title} draft={!isPublished} />}
        meta={
          <>
            <Count icon="module" value={moduleCount} label="modules" />
            <Count icon="lesson" value={itemCount} label="items" />
          </>
        }
        icon="course"
        expandable
        open={open}
        onToggle={toggleOpen}
        onActivate={ctx.canManage ? () => ctx.onOpenDrawer('course', courseId) : undefined}
        selected={selected}
        muted={!isPublished}
        actions={
          ctx.canManage ? (
            <>
              <IconButton
                icon="plus"
                label="Add module"
                size="sm"
                onClick={() => ctx.onOpenDrawer('module-new', courseId)}
              />
              {editButton}
              {publishSwitch}
              <RowMenu label="More course actions" actions={menuActions} />
            </>
          ) : null
        }
        headerActions={
          ctx.canManage ? (
            <>
              {editButton}
              {publishSwitch}
              <RowMenu label="More course actions" actions={menuActions} />
            </>
          ) : null
        }
        footerActions={
          ctx.canManage ? (
            <Button
              variant="ghost"
              size="sm"
              iconName="plus"
              onClick={() => ctx.onOpenDrawer('module-new', courseId)}
            >
              Add module
            </Button>
          ) : null
        }
        loading={open && detail.isLoading}
        error={open && detail.isError ? detail.error : undefined}
        onRetry={() => void detail.refetch()}
      >
        {modules.map((module) => (
          <ModuleNode
            key={module.moduleId}
            module={module}
            courseId={courseId}
            level={level + 1}
            target={{}}
            ctx={ctx}
          />
        ))}
      </TreeItem>
      <DeleteEntityDialog
        open={deleteOpen}
        entityLabel="course"
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteCourse.mutateAsync(courseId);
        }}
        insteadAction={{
          label: 'Archive instead',
          onClick: async () => {
            await setPublished.mutateAsync(false);
          },
        }}
      />
    </>
  );
}

interface ModuleNodeProps {
  module: AdminModuleDto;
  courseId: number;
  level: number;
  /** Cache the publish and delete mutations write to (the Modules tab list or the course detail). */
  target: ModuleCacheTarget;
  ctx: TreeContext;
}

function ModuleNode({ module, courseId, level, target, ctx }: ModuleNodeProps) {
  const { moduleId, title, isPublished, lessonCount, estimatedMinutes } = module;
  const [open, toggleOpen] = useNodeOpen(ctx);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const detail = useAdminModule(moduleId, open);
  const setPublished = useSetModulePublished(courseId, moduleId, target);
  const deleteModule = useDeleteModule(courseId, target);
  const selected = isDrawerOpen(ctx.selectedDrawer, 'module', moduleId);
  const flashClass = useFlashRow(ctx, 'module', moduleId, `module-${moduleId}`);

  const items = (detail.data?.items ?? []).filter(
    (item) =>
      matchesSearch(ctx.search, item.title, item.slug) &&
      matchesStatus(ctx.status, item.isPublished),
  );

  const addButtons = [
    { label: 'Add lesson', icon: 'lesson' as const, kind: 'lesson-new' as const },
    { label: 'Add lab', icon: 'lab' as const, kind: 'lab-item-new' as const },
    { label: 'Add quiz', icon: 'quiz' as const, kind: 'quiz-new' as const },
  ];
  const editButton = (
    <IconButton
      icon="edit"
      label="Edit module"
      size="sm"
      onClick={() => ctx.onOpenDrawer('module', moduleId)}
    />
  );
  const publishSwitch = (
    <Switch
      size="sm"
      checked={isPublished}
      onCheckedChange={(next) => setPublished.mutate(next)}
      aria-label="Module published"
    />
  );

  const menuActions: MenuAction[] = [
    ...(isPublished
      ? [{ label: 'Archive', icon: 'archive' as const, onSelect: () => setPublished.mutate(false) }]
      : []),
    { label: 'Delete', icon: 'delete', tone: 'danger', onSelect: () => setDeleteOpen(true) },
  ];

  return (
    <>
      <TreeItem
        id={`module-${moduleId}`}
        rowClassName={flashClass}
        level={level}
        label={<NodeLabel text={title} draft={!isPublished} />}
        meta={
          <>
            <Count icon="lesson" value={lessonCount} label="items" />
            <Count icon="clock" value={estimatedMinutes} label="min" />
          </>
        }
        icon="module"
        expandable
        open={open}
        onToggle={toggleOpen}
        onActivate={ctx.canManage ? () => ctx.onOpenDrawer('module', moduleId) : undefined}
        selected={selected}
        muted={!isPublished}
        actions={
          ctx.canManage ? (
            <>
              {addButtons.map((button) => (
                <IconButton
                  key={button.kind}
                  icon={button.icon}
                  label={button.label}
                  size="sm"
                  onClick={() => ctx.onOpenDrawer(button.kind, moduleId)}
                />
              ))}
              {editButton}
              {publishSwitch}
              <RowMenu label="More module actions" actions={menuActions} />
            </>
          ) : null
        }
        headerActions={
          ctx.canManage ? (
            <>
              {editButton}
              {publishSwitch}
              <RowMenu label="More module actions" actions={menuActions} />
            </>
          ) : null
        }
        footerActions={
          ctx.canManage ? (
            <div className="flex flex-wrap items-center justify-center gap-1">
              {addButtons.map((button) => (
                <Button
                  key={button.kind}
                  variant="ghost"
                  size="sm"
                  iconName={button.icon}
                  onClick={() => ctx.onOpenDrawer(button.kind, moduleId)}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          ) : null
        }
        loading={open && detail.isLoading}
        error={open && detail.isError ? detail.error : undefined}
        onRetry={() => void detail.refetch()}
      >
        {items.map((item) => (
          <ItemNode key={item.itemId} item={item} level={level + 1} ctx={ctx} />
        ))}
      </TreeItem>
      <DeleteEntityDialog
        open={deleteOpen}
        entityLabel="module"
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteModule.mutateAsync(moduleId);
        }}
        insteadAction={{
          label: 'Unpublish instead',
          onClick: async () => {
            await setPublished.mutateAsync(false);
          },
        }}
      />
    </>
  );
}

function itemIcon(item: AdminModuleItemDto): IconName {
  if (item.kind === 'lab') return 'lab';
  if (item.kind === 'quiz') return 'quiz';
  if (item.contentType === 'video') return 'video';
  if (item.contentType === 'interactive') return 'slides';
  return 'lesson';
}

const ITEM_NOUN: Record<AdminModuleItemDto['kind'], string> = {
  lesson: 'lesson',
  lab: 'lab',
  quiz: 'quiz',
};

interface ItemNodeProps {
  item: AdminModuleItemDto;
  level: number;
  ctx: TreeContext;
}

function ItemNode({ item, level, ctx }: ItemNodeProps) {
  const { moduleId, itemId, title, isPublished, kind } = item;
  const setPublished = useSetItemPublished(moduleId);
  const deleteItem = useDeleteItem(moduleId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const noun = ITEM_NOUN[kind];
  const flashClass = useFlashRow(ctx, 'item', itemId, `item-${itemId}`);

  // The row's primary drawer: lesson and lab items by item id, quizzes by quiz id.
  const editTarget: CurriculumDrawer | null =
    kind === 'quiz'
      ? item.quiz
        ? { kind: 'quiz', id: item.quiz.quizId }
        : null
      : { kind: kind === 'lab' ? 'lab-item' : 'lesson', id: itemId };
  const selected =
    (editTarget !== null && isDrawerOpen(ctx.selectedDrawer, editTarget.kind, editTarget.id)) ||
    (item.lab !== null && isDrawerOpen(ctx.selectedDrawer, 'lab-spec', item.lab.labId)) ||
    (item.quiz !== null && isDrawerOpen(ctx.selectedDrawer, 'questions', item.quiz.quizId));

  const openEdit = () => {
    if (editTarget) ctx.onOpenDrawer(editTarget.kind, editTarget.id);
  };

  const specReady = item.lab !== null && item.lab.specStatus === 'v2' && item.lab.isActive;
  const meta = (
    <>
      {item.kind === 'lesson' && item.videoDurationSeconds !== null ? (
        <Count icon="clock" value={Math.round(item.videoDurationSeconds / 60)} label="min" />
      ) : null}
      {item.lab ? (
        <>
          <Count icon="numbered" value={item.lab.stepCount} label="steps" />
          {specReady ? null : (
            <span
              className="has-tooltip inline-flex shrink-0 text-muted"
              data-tooltip="Steps not configured"
            >
              <Icon name="warning" size={14} title="Steps not configured" />
            </span>
          )}
        </>
      ) : null}
      {item.quiz ? (
        <Count icon="help" value={item.quiz.activeQuestionCount} label="questions" />
      ) : null}
    </>
  );

  const menuActions: MenuAction[] = [
    { label: 'Delete', icon: 'delete', tone: 'danger', onSelect: () => setDeleteOpen(true) },
  ];

  return (
    <>
      <TreeItem
        id={`item-${itemId}`}
        rowClassName={flashClass}
        level={level}
        label={<NodeLabel text={title} draft={!isPublished} />}
        meta={meta}
        icon={itemIcon(item)}
        expandable={false}
        open={false}
        onToggle={() => undefined}
        onActivate={ctx.canManage ? openEdit : undefined}
        selected={selected}
        muted={!isPublished}
        actions={
          ctx.canManage ? (
            <>
              {item.lab && ctx.canManageLabs ? (
                <IconButton
                  icon="checklist"
                  label="Edit steps"
                  size="sm"
                  onClick={() => ctx.onOpenDrawer('lab-spec', item.lab?.labId ?? 0)}
                />
              ) : null}
              {item.quiz ? (
                <IconButton
                  icon="numbered"
                  label="Questions"
                  size="sm"
                  onClick={() => ctx.onOpenDrawer('questions', item.quiz?.quizId ?? 0)}
                />
              ) : null}
              <IconButton
                icon="edit"
                label={`Edit ${noun}`}
                size="sm"
                disabled={editTarget === null}
                onClick={openEdit}
              />
              <Switch
                size="sm"
                checked={isPublished}
                onCheckedChange={(next) => setPublished.mutate({ itemId, isPublished: next })}
                aria-label={`${noun} published`}
              />
              <RowMenu label={`More ${noun} actions`} actions={menuActions} />
            </>
          ) : null
        }
      />
      <DeleteEntityDialog
        open={deleteOpen}
        entityLabel={noun}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteItem.mutateAsync(itemId);
        }}
        insteadAction={{
          label: 'Unpublish instead',
          onClick: async () => {
            await setPublished.mutateAsync({ itemId, isPublished: false });
          },
        }}
      />
    </>
  );
}

/* ── Roots ─────────────────────────────────────────────────────────────── */

function RootLoading() {
  return (
    <li role="none">
      <TreeSkeleton rows={4} />
    </li>
  );
}

function RootError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <li role="none">
      <ErrorState compact error={error} onRetry={onRetry} />
    </li>
  );
}

function RootEmpty({ noun, filtered, icon }: { noun: string; filtered: boolean; icon: IconName }) {
  return (
    <li role="none">
      <EmptyState title={filtered ? `No ${noun} match` : `No ${noun} yet`} icon={icon} />
    </li>
  );
}

function TracksRoot({ ctx }: { ctx: TreeContext }) {
  const tracks = useAdminTracks();

  if (tracks.isPending) return <RootLoading />;
  if (tracks.isError)
    return <RootError error={tracks.error} onRetry={() => void tracks.refetch()} />;

  const visible = (tracks.data ?? []).filter(
    (track) =>
      matchesSearch(ctx.search, track.trackName, track.slug) &&
      matchesStatus(ctx.status, track.isActive),
  );
  if (visible.length === 0) {
    return (
      <RootEmpty noun="tracks" filtered={ctx.search !== '' || ctx.status !== 'all'} icon="track" />
    );
  }
  return (
    <>
      {visible.map((track) => (
        <TrackNode key={track.trackId} track={track} ctx={ctx} />
      ))}
    </>
  );
}

function CoursesRoot({ ctx }: { ctx: TreeContext }) {
  const courses = useAdminCourses(courseListParams(ctx));

  if (courses.isPending) return <RootLoading />;
  if (courses.isError) {
    return <RootError error={courses.error} onRetry={() => void courses.refetch()} />;
  }

  const rows = courses.data ?? [];
  if (rows.length === 0) {
    return (
      <RootEmpty
        noun="courses"
        filtered={ctx.search !== '' || ctx.status !== 'all'}
        icon="course"
      />
    );
  }
  return (
    <>
      {rows.map((course) => (
        <CourseNode
          key={course.courseId}
          courseId={course.courseId}
          title={course.title}
          isPublished={course.isPublished}
          moduleCount={course.moduleCount}
          itemCount={course.itemCount}
          trackId={null}
          level={1}
          ctx={ctx}
        />
      ))}
    </>
  );
}

function ModulesRoot({ ctx, courseId }: { ctx: TreeContext; courseId: number | null }) {
  const params = moduleListParams(ctx);
  const modules = useAdminCourseModules(courseId ?? 0, params, courseId !== null);

  if (courseId === null) {
    return (
      <li role="none">
        <EmptyState title="No course selected" icon="course" />
      </li>
    );
  }
  if (modules.isPending) return <RootLoading />;
  if (modules.isError) {
    return <RootError error={modules.error} onRetry={() => void modules.refetch()} />;
  }

  const rows = modules.data ?? [];
  if (rows.length === 0) {
    return (
      <RootEmpty
        noun="modules"
        filtered={ctx.search !== '' || ctx.status !== 'all'}
        icon="module"
      />
    );
  }
  return (
    <>
      {rows.map((module) => (
        <ModuleNode
          key={module.moduleId}
          module={module}
          courseId={courseId}
          level={1}
          target={{ list: params }}
          ctx={ctx}
        />
      ))}
    </>
  );
}

/**
 * Curriculum tree for one control panel tab. Only the active root level is
 * mounted, so children and mutations never run for hidden tabs.
 */
export function CurriculumTree({
  rootLevel,
  search,
  status,
  courseId = null,
  selectedDrawer,
  onOpenDrawer,
  flash = null,
  expand = null,
}: CurriculumTreeProps) {
  const canManage = usePermission(MANAGE_PERMISSION);
  const canManageLabs = usePermission(LABS_PERMISSION);
  const ctx: TreeContext = {
    flash,
    expand,
    canManage,
    canManageLabs,
    search,
    status,
    selectedDrawer,
    onOpenDrawer,
  };

  return (
    <Tree ariaLabel={TREE_LABELS[rootLevel]}>
      {rootLevel === 'track' ? (
        <TracksRoot ctx={ctx} />
      ) : rootLevel === 'course' ? (
        <CoursesRoot ctx={ctx} />
      ) : (
        <ModulesRoot ctx={ctx} courseId={courseId} />
      )}
    </Tree>
  );
}

export default CurriculumTree;
