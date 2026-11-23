import { useMemo, useState } from 'react';
import { ItemKindIcon } from '@/features/curriculum/components/learn/ItemKindIcon';
import {
  getModuleItemRoute,
  useLearnCourse,
  useLearnCourseModules,
  useLearnCourses,
  useLearnModule,
  useLearnModuleItems,
} from '@/features/curriculum/hooks';
import type { ModuleDto, ModuleItemDto } from '@/features/curriculum/types';
import {
  useContinueLearningPointer,
  useCourseModulesProgress,
  useModuleItemsProgress,
} from '@/features/progress/hooks';
import type { ModuleItemProgressDto, ModuleProgressSummary } from '@/features/progress/types';
import {
  Button,
  Collapsible,
  ErrorState,
  Icon,
  Modal,
  ProgressBar,
  Skeleton,
  Spinner,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { cn, formatDuration, pluralize } from '@/shared/utils';

export interface LabModuleOutlineModalProps {
  open: boolean;
  onClose: () => void;
  courseId?: number | null;
  moduleId: number | null;
  activeItemId: number | null;
  activeLabId?: number | null;
  onNavigateItem: (path: string) => void;
}

interface CourseOutlineModuleRowProps {
  module: ModuleDto;
  moduleIndex: number;
  progress?: ModuleProgressSummary;
  isCurrentModule: boolean;
  defaultExpanded: boolean;
  canAccess: boolean;
  activeItemId: number | null;
  activeLabId: number | null;
  onSelectItem: (route: string) => void;
}

function isCurrentItem(
  item: ModuleItemDto,
  activeItemId: number | null,
  activeLabId: number | null,
): boolean {
  if (activeItemId !== null) return item.itemId === activeItemId;
  return activeLabId !== null && item.kind === 'lab' && item.lab?.labId === activeLabId;
}

function CourseOutlineModuleRow({
  module,
  moduleIndex,
  progress,
  isCurrentModule,
  defaultExpanded,
  canAccess,
  activeItemId,
  activeLabId,
  onSelectItem,
}: CourseOutlineModuleRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = `course-outline-mod-${module.moduleId}`;
  const duration = formatDuration({ minutes: module.estimatedMinutes });

  const itemsQuery = useLearnModuleItems(module.moduleId, expanded);
  const itemsProgressQuery = useModuleItemsProgress(module.moduleId, expanded);

  const sortedItems = useMemo(
    () => [...(itemsQuery.data ?? [])].sort((a, b) => a.position - b.position),
    [itemsQuery.data],
  );
  const itemProgressMap = useMemo(
    () =>
      new Map<number, ModuleItemProgressDto>(
        (itemsProgressQuery.data ?? []).map((row) => [row.itemId, row]),
      ),
    [itemsProgressQuery.data],
  );

  const isCompleted = Boolean(progress?.isCompleted);

  return (
    <div className="flex flex-col rounded-md">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
        className={cn(
          'flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-paper-dim focus-visible:outline-none',
          isCurrentModule && 'bg-paper/80',
        )}
      >
        <Icon
          name="chevron-down"
          size={16}
          className="chevron-rotate shrink-0 text-muted"
          data-open={expanded ? 'true' : 'false'}
        />

        <span
          aria-hidden="true"
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-caption font-bold',
            isCompleted
              ? 'bg-check-success text-pearl-100'
              : isCurrentModule
                ? 'bg-ink text-pearl-100'
                : 'bg-paper-dim text-card-foreground',
          )}
        >
          {isCompleted ? <Icon name="check" size={13} /> : moduleIndex + 1}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-card-foreground">
            {module.title}
          </span>
          <span className="flex flex-wrap items-center gap-x-2.5 text-xs text-muted">
            {duration ? <span>{duration}</span> : null}
            <span>{pluralize(module.lessonCount, 'item', 'items')}</span>
          </span>
        </div>

        {progress ? (
          <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
            {progress.completedLessons}/{progress.totalLessons}
          </span>
        ) : null}
      </button>

      <Collapsible open={expanded} id={panelId}>
        <div className="pl-8 pt-1 pb-2">
          {itemsQuery.isPending ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted">
              <Spinner />
              <span>Loading items…</span>
            </div>
          ) : itemsQuery.isError ? (
            <div className="px-3 py-2">
              <ErrorState
                compact
                error={itemsQuery.error}
                onRetry={() => void itemsQuery.refetch()}
              />
            </div>
          ) : sortedItems.length === 0 ? (
            <p className="m-0 px-3 py-2 text-xs text-muted">No items published in this module.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {sortedItems.map((item) => {
                const route = getModuleItemRoute(item);
                const unavailableLab = item.kind === 'lab' && (item.lab?.stepCount ?? 0) === 0;
                const available = canAccess && route !== null && !unavailableLab;
                const current = isCurrentItem(item, activeItemId, activeLabId);
                const itemProg = itemProgressMap.get(item.itemId);
                const itemDone = Boolean(itemProg?.isCompleted);

                return (
                  <li key={item.itemId}>
                    <button
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        if (available && route) onSelectItem(route);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left transition-colors',
                        available ? 'cursor-pointer' : 'cursor-not-allowed opacity-55',
                        current
                          ? 'bg-pearl-200 font-semibold text-card-foreground'
                          : available
                            ? 'text-card-foreground hover:bg-paper-dim'
                            : 'text-muted',
                      )}
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2.5">
                        {itemDone ? (
                          <Icon
                            name="check-circle"
                            filled
                            size={16}
                            className="shrink-0 text-check-success"
                          />
                        ) : (
                          <ItemKindIcon
                            kind={item.kind}
                            contentType={item.contentType}
                            selected={current}
                            size={16}
                          />
                        )}
                        <span className="min-w-0 truncate text-xs sm:text-sm">{item.title}</span>
                      </span>

                      <span className="flex shrink-0 items-center gap-2">
                        {current ? (
                          <span className="rounded-xs bg-ink px-1.5 py-0.5 font-mono text-micro font-semibold text-pearl-100">
                            Current
                          </span>
                        ) : null}
                        {!canAccess ? <Icon name="lock" size={14} className="text-muted" /> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Collapsible>
    </div>
  );
}

/**
 * DataCamp-style Course Outline modal opened from the studio header center `Outline` pill.
 * Shows ALL modules of the current active course with completion progress and item jump links.
 */
export function LabModuleOutlineModal({
  open,
  onClose,
  courseId: courseIdProp = null,
  moduleId: activeModuleId,
  activeItemId,
  activeLabId = null,
  onNavigateItem,
}: LabModuleOutlineModalProps) {
  const needsModuleLookup = open && courseIdProp === null && activeModuleId !== null;
  const moduleQuery = useLearnModule(activeModuleId ?? 0, needsModuleLookup);

  const needsPointerLookup = open && courseIdProp === null && activeModuleId === null;
  const pointerQuery = useContinueLearningPointer(needsPointerLookup);

  const prelimCourseId =
    courseIdProp ?? moduleQuery.data?.courseId ?? pointerQuery.data?.courseId ?? null;
  const needsFallbackCourse =
    open && prelimCourseId === null && !moduleQuery.isPending && !pointerQuery.isPending;
  const coursesQuery = useLearnCourses(needsFallbackCourse);
  const fallbackCourseId =
    coursesQuery.data?.find((course) => course.moduleCount > 0)?.courseId ??
    coursesQuery.data?.[0]?.courseId ??
    null;

  const resolvedCourseId = prelimCourseId ?? fallbackCourseId;

  const courseQuery = useLearnCourse(resolvedCourseId, open && resolvedCourseId !== null);
  const courseModulesQuery = useLearnCourseModules(
    resolvedCourseId,
    open && resolvedCourseId !== null,
  );
  const modulesProgressQuery = useCourseModulesProgress(
    resolvedCourseId,
    open && resolvedCourseId !== null,
  );

  const courseModules = useMemo(
    () => [...(courseModulesQuery.data ?? [])].sort((a, b) => a.moduleOrder - b.moduleOrder),
    [courseModulesQuery.data],
  );

  const moduleProgressMap = useMemo(
    () =>
      new Map<number, ModuleProgressSummary>(
        (modulesProgressQuery.data ?? []).map((row) => [row.moduleId, row]),
      ),
    [modulesProgressQuery.data],
  );

  const completedModulesCount = courseModules.filter(
    (mod) => moduleProgressMap.get(mod.moduleId)?.isCompleted,
  ).length;

  const totalLessonsSum = (modulesProgressQuery.data ?? []).reduce(
    (sum, row) => sum + row.totalLessons,
    0,
  );
  const completedLessonsSum = (modulesProgressQuery.data ?? []).reduce(
    (sum, row) => sum + row.completedLessons,
    0,
  );
  const overallPct =
    totalLessonsSum > 0
      ? Math.round((completedLessonsSum / totalLessonsSum) * 100)
      : courseModules.length > 0
        ? Math.round((completedModulesCount / courseModules.length) * 100)
        : 0;

  const canAccess = courseQuery.data ? courseQuery.data.access.canAccess : true;
  const defaultModuleId = activeModuleId ?? courseModules[0]?.moduleId ?? null;
  const isLoadingOutline =
    (needsModuleLookup && moduleQuery.isPending) ||
    (needsPointerLookup && pointerQuery.isPending) ||
    (needsFallbackCourse && coursesQuery.isPending) ||
    (resolvedCourseId !== null && courseModulesQuery.isPending);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={courseQuery.data?.course.title ?? 'Course Outline'}
      size="lg"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            iconName="arrow-left"
            onClick={() => {
              onClose();
              onNavigateItem(ROUTES.LEARN);
            }}
          >
            Back to Learn
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {courseModules.length > 0 ? (
          <div className="flex items-center gap-3">
            <ProgressBar
              value={overallPct}
              label="Course outline progress"
              size="sm"
              className="flex-1"
            />
            <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
              {completedModulesCount}/{courseModules.length} modules
            </span>
          </div>
        ) : null}

        {courseModulesQuery.isError ? (
          <ErrorState
            compact
            error={courseModulesQuery.error}
            onRetry={() => void courseModulesQuery.refetch()}
          />
        ) : isLoadingOutline ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        ) : courseModules.length === 0 ? (
          <p className="m-0 py-6 text-center font-mono text-xs text-muted">
            No modules published in this course yet.
          </p>
        ) : (
          <div
            key={`${resolvedCourseId ?? 0}-${defaultModuleId ?? 0}`}
            className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto pr-1"
          >
            {courseModules.map((mod, idx) => (
              <CourseOutlineModuleRow
                key={mod.moduleId}
                module={mod}
                moduleIndex={idx}
                progress={moduleProgressMap.get(mod.moduleId)}
                isCurrentModule={mod.moduleId === activeModuleId}
                defaultExpanded={mod.moduleId === defaultModuleId}
                canAccess={canAccess}
                activeItemId={activeItemId}
                activeLabId={activeLabId}
                onSelectItem={(route) => {
                  onClose();
                  onNavigateItem(route);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default LabModuleOutlineModal;
