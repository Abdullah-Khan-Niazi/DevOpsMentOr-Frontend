import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, generatePath, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Collapsible,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  PageHeader,
  ProgressBar,
  SearchInput,
  Spinner,
  TabSwitcher,
  type TabSwitcherItem,
} from '@/shared/components';
import { QUERY_KEYS, ROUTES } from '@/shared/constants';
import { useUrlSearch, useUrlState } from '@/shared/hooks';
import { cn, formatDuration, pluralize } from '@/shared/utils';
import { useLabCatalog } from '@/features/labs/hooks/useLabs';
import type { LabDto } from '@/features/labs/types';
import {
  useContinueLearningPointer,
  useCoursesProgress,
} from '@/features/progress/hooks/useProgress';
import { progressService } from '@/features/progress/services';
import type {
  ContinueLearningPointerDto,
  CourseProgressDto,
  ModuleItemProgressDto,
  ModuleProgressSummary,
} from '@/features/progress/types';
import { ItemKindIcon } from '../components/learn/ItemKindIcon';
import { ModuleItemRow } from '../components/learn/ModuleItemRow';
import { useLearnCourse, useLearnCourses, useLearnModuleItems } from '../hooks/useCurriculum';
import type { LearnerCourseDto, ModuleDto, ModuleItemDto } from '../types';
import { LearnPageSkeleton } from './LearnPageSkeleton';

const TAB_IDS = ['all', 'in-progress', 'completed', 'labs'] as const;
type LearnTab = (typeof TAB_IDS)[number];

const FILTER_TABS: ReadonlyArray<TabSwitcherItem<LearnTab>> = [
  { id: 'all', label: 'All courses', icon: 'course' },
  { id: 'in-progress', label: 'In progress', icon: 'play' },
  { id: 'completed', label: 'Completed', icon: 'check-circle' },
  { id: 'labs', label: 'Labs', icon: 'lab' },
];

/** Case-insensitive match of the lowercased search text against any field. */
function matchesQuery(query: string, ...fields: Array<string | null | undefined>): boolean {
  if (!query) return true;
  return fields.some((field) => (field ?? '').toLowerCase().includes(query));
}

/** Route for the continue pointer by item kind; a lab keeps its module context in `itemId`. */
function continueTarget(pointer: ContinueLearningPointerDto): string | null {
  if (pointer.kind === 'lab') {
    return pointer.labId === null
      ? null
      : `${generatePath(ROUTES.LEARN_LAB, { labId: String(pointer.labId) })}?itemId=${pointer.lessonId}`;
  }
  if (pointer.kind === 'quiz') {
    return pointer.quizId === null
      ? null
      : generatePath(ROUTES.LEARN_QUIZ, { quizId: String(pointer.quizId) });
  }
  return generatePath(ROUTES.LEARN_LESSON, { lessonId: String(pointer.lessonId) });
}

/** Route of one module item (same pattern as module outline). */
function itemTarget(item: ModuleItemDto): string | null {
  if (item.kind === 'lab') {
    return item.lab
      ? `${generatePath(ROUTES.LEARN_LAB, { labId: String(item.lab.labId) })}?itemId=${item.itemId}`
      : null;
  }
  if (item.kind === 'quiz') {
    return item.quiz ? generatePath(ROUTES.LEARN_QUIZ, { quizId: String(item.quiz.quizId) }) : null;
  }
  return generatePath(ROUTES.LEARN_LESSON, { lessonId: String(item.itemId) });
}

function ActiveHero({
  pointer,
  starterCourse,
}: {
  pointer: ContinueLearningPointerDto | null;
  starterCourse: LearnerCourseDto | null;
}) {
  const navigate = useNavigate();

  if (pointer !== null) {
    const target = continueTarget(pointer);
    return (
      <section
        aria-label="Active learning"
        className="motion-lift flex flex-col justify-between gap-6 rounded-xl border border-paper-line bg-pearl-100 p-6 shadow-xs sm:flex-row sm:items-center sm:p-7"
      >
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
          <span className="shrink-0 text-card-foreground">
            <ItemKindIcon kind={pointer.kind} size={32} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-sm font-medium text-muted-foreground">
              {pointer.moduleTitle}
            </span>
            <h2 className="truncate text-2xl font-bold tracking-tight text-card-foreground">
              {pointer.lessonTitle}
            </h2>
            <div className="flex max-w-md flex-col gap-1.5 pt-1">
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {pointer.progressPct}% complete
              </span>
              <ProgressBar
                value={pointer.progressPct}
                label={`${pointer.lessonTitle} progress`}
                size="sm"
              />
            </div>
          </div>
        </div>
        {target ? (
          <Button
            variant="primary"
            size="md"
            iconName="arrow-right"
            iconPosition="right"
            onClick={() => navigate(target)}
            className="shrink-0 whitespace-nowrap"
          >
            {pointer.progressPct >= 100 ? 'Review' : 'Resume learning'}
          </Button>
        ) : null}
      </section>
    );
  }

  if (starterCourse === null) return null;

  const hours = formatDuration({ hours: starterCourse.estimatedHours });
  return (
    <section
      aria-label="Recommended starting course"
      className="motion-lift flex flex-col justify-between gap-6 rounded-xl border border-paper-line bg-pearl-100 p-6 shadow-xs sm:flex-row sm:items-center sm:p-7"
    >
      <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
        <Icon name="course" size={32} className="shrink-0 text-card-foreground" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="truncate text-2xl font-bold tracking-tight text-card-foreground">
            {starterCourse.title}
          </h2>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {starterCourse.difficultyName ? <span>{starterCourse.difficultyName}</span> : null}
            {hours ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="clock" size={14} />
                {hours}
              </span>
            ) : null}
            <span>{pluralize(starterCourse.moduleCount, 'module', 'modules')}</span>
            <span>{pluralize(starterCourse.itemCount, 'item', 'items')}</span>
          </p>
        </div>
      </div>
      <Button
        variant="primary"
        size="md"
        iconName="arrow-right"
        iconPosition="right"
        onClick={() =>
          navigate(generatePath(ROUTES.LEARN_COURSE, { courseId: String(starterCourse.courseId) }))
        }
        className="shrink-0 whitespace-nowrap"
      >
        Start course
      </Button>
    </section>
  );
}

function ModuleAccordionRow({
  module,
  progress,
  courseLocked,
}: {
  module: ModuleDto;
  progress?: ModuleProgressSummary;
  courseLocked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `learn-module-panel-${module.moduleId}`;
  const duration = formatDuration({ minutes: module.estimatedMinutes });

  const itemsQuery = useLearnModuleItems(module.moduleId, open);
  const itemProgressQuery = useQuery({
    queryKey: QUERY_KEYS.progress.moduleItems(module.moduleId),
    queryFn: () => progressService.getModuleItemsProgress(module.moduleId),
    enabled: open,
    retry: false,
  });

  const itemProgressMap = new Map<number, ModuleItemProgressDto>(
    (itemProgressQuery.data ?? []).map((row) => [row.itemId, row]),
  );

  return (
    <div className="flex flex-col rounded-md">
      <div className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-surface-hover">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-sm text-left focus-visible:outline-none"
        >
          <Icon
            name="chevron-down"
            size={16}
            className="chevron-rotate shrink-0 text-muted-foreground"
            data-open={open ? 'true' : 'false'}
          />
          <Icon
            name={progress?.isCompleted ? 'check-circle' : 'module'}
            filled={progress?.isCompleted}
            size={18}
            className={cn(
              'shrink-0',
              progress?.isCompleted ? 'text-success' : 'text-muted-foreground',
            )}
          />
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="truncate font-medium text-card-foreground">{module.title}</span>
            <span className="flex items-center gap-2.5 text-xs text-muted-foreground">
              {duration ? <span>{duration}</span> : null}
              <span>{pluralize(module.lessonCount, 'item', 'items')}</span>
            </span>
          </span>
        </button>

        {progress ? (
          <ProgressBar
            value={progress.progressPercentage}
            label={`${module.title} progress`}
            size="sm"
            className="hidden w-24 shrink-0 sm:block"
          />
        ) : null}

        <Link
          to={generatePath(ROUTES.LEARN_MODULE, { moduleId: String(module.moduleId) })}
          className="shrink-0 whitespace-nowrap text-xs font-medium text-muted-foreground hover:text-card-foreground hover:underline"
        >
          Open module
        </Link>
      </div>

      <Collapsible open={open} id={panelId}>
        <div className="pl-7 pt-1 pb-2">
          {itemsQuery.isPending ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Spinner />
              <span>Loading module items…</span>
            </div>
          ) : itemsQuery.isError ? (
            <div className="px-4 py-2">
              <ErrorState
                compact
                error={itemsQuery.error}
                onRetry={() => void itemsQuery.refetch()}
              />
            </div>
          ) : (itemsQuery.data ?? []).length === 0 ? (
            <p className="px-4 py-2 text-sm text-muted-foreground">
              No items published in this module.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {(itemsQuery.data ?? []).map((item) => (
                <li key={item.itemId}>
                  <ModuleItemRow
                    item={item}
                    progress={itemProgressMap.get(item.itemId)}
                    locked={courseLocked}
                    to={itemTarget(item)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Collapsible>
    </div>
  );
}

function CourseAccordionItem({
  course,
  progress,
  open,
  onToggle,
}: {
  course: LearnerCourseDto;
  progress: CourseProgressDto | null;
  open: boolean;
  onToggle: (courseId: number) => void;
}) {
  const navigate = useNavigate();
  const panelId = `learn-course-panel-${course.courseId}`;
  const courseUrl = generatePath(ROUTES.LEARN_COURSE, { courseId: String(course.courseId) });
  const duration = formatDuration({ hours: course.estimatedHours });

  const detailQuery = useLearnCourse(course.courseId, open);
  const modulesProgressQuery = useQuery({
    queryKey: QUERY_KEYS.progress.courseModules(course.courseId),
    queryFn: () => progressService.getCourseModulesProgress(course.courseId),
    enabled: open,
    retry: false,
  });

  const modules = detailQuery.data?.modules ?? [];
  const courseLocked = detailQuery.data ? !detailQuery.data.access.canAccess : false;
  const moduleProgressMap = new Map<number, ModuleProgressSummary>(
    (modulesProgressQuery.data ?? []).map((row) => [row.moduleId, row]),
  );

  return (
    <article className="rounded-lg border border-paper-line bg-pearl-100 shadow-2xs transition-shadow duration-(--duration-fast) ease-(--ease-apple-out) hover:shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onToggle(course.courseId)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3.5 rounded-sm text-left focus-visible:outline-none"
        >
          <Icon
            name="chevron-down"
            size={20}
            className="chevron-rotate shrink-0 text-muted-foreground"
            data-open={open ? 'true' : 'false'}
          />
          <Icon
            name={progress?.isCompleted ? 'check-circle' : 'course'}
            filled={progress?.isCompleted}
            size={22}
            className={cn(
              'shrink-0',
              progress?.isCompleted ? 'text-success' : 'text-card-foreground',
            )}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="truncate text-base font-bold tracking-tight text-card-foreground sm:text-lg">
              {course.title}
            </h3>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {course.difficultyName ? <span>{course.difficultyName}</span> : null}
              {duration ? (
                <span className="inline-flex items-center gap-1">
                  <Icon name="clock" size={13} />
                  {duration}
                </span>
              ) : null}
              <span>{pluralize(course.moduleCount, 'module', 'modules')}</span>
              <span>{pluralize(course.itemCount, 'item', 'items')}</span>
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-4">
          {progress ? (
            <div className="hidden w-32 flex-col gap-1 sm:flex">
              <div className="flex justify-between font-mono text-xs tabular-nums text-muted-foreground">
                <span>
                  {progress.completedLessonCount}/{progress.totalLessons}
                </span>
                <span>{progress.progressPercentage}%</span>
              </div>
              <ProgressBar
                value={progress.progressPercentage}
                label={`${course.title} progress`}
                size="sm"
              />
            </div>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            iconName="arrow-right"
            iconPosition="right"
            onClick={() => navigate(courseUrl)}
          >
            Open course
          </Button>
        </div>
      </div>

      <Collapsible open={open} id={panelId}>
        <div className="px-3 pb-4 sm:px-5 sm:pb-5">
          {detailQuery.isPending ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
              <Spinner />
              <span>Loading syllabus…</span>
            </div>
          ) : detailQuery.isError ? (
            <div className="px-4 py-3">
              <ErrorState
                compact
                error={detailQuery.error}
                onRetry={() => void detailQuery.refetch()}
              />
            </div>
          ) : modules.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No modules published yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {modules.map((mod) => (
                <ModuleAccordionRow
                  key={mod.moduleId}
                  module={mod}
                  progress={moduleProgressMap.get(mod.moduleId)}
                  courseLocked={courseLocked}
                />
              ))}
            </div>
          )}
        </div>
      </Collapsible>
    </article>
  );
}

function LabCard({ lab }: { lab: LabDto }) {
  const hours = formatDuration({ hours: lab.estimatedHours });

  return (
    <Link
      to={generatePath(ROUTES.LEARN_LAB, { labId: String(lab.labId) })}
      className="motion-lift block h-full rounded-md focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]"
    >
      <div className="flex h-full flex-col gap-3 rounded-md border border-paper-line bg-pearl-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <Icon name="lab" size={24} className="shrink-0 text-muted-foreground" />
          {lab.isPremium ? (
            <Icon
              name="lock"
              size={18}
              title="Premium"
              className="shrink-0 text-muted-foreground"
            />
          ) : null}
        </div>
        <h3 className="line-clamp-2 font-semibold text-card-foreground">{lab.labName}</h3>
        {lab.difficultyName || hours ? (
          <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {lab.difficultyName ? <span>{lab.difficultyName}</span> : null}
            {hours ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="clock" size={14} />
                {hours}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function CompletedCourseBanner({
  completedCourse,
  nextCourse,
  onDismiss,
}: {
  completedCourse: LearnerCourseDto;
  nextCourse: LearnerCourseDto | null;
  onDismiss: () => void;
}) {
  const navigate = useNavigate();
  const hours = nextCourse ? formatDuration({ hours: nextCourse.estimatedHours }) : null;

  return (
    <section
      aria-label="Course completed"
      className="motion-lift flex flex-col justify-between gap-6 rounded-xl border border-paper-line bg-pearl-100 p-6 shadow-xs sm:flex-row sm:items-center sm:p-7"
    >
      <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
        <Icon
          name={nextCourse ? 'check-circle' : 'trophy'}
          filled
          size={32}
          className="shrink-0 text-check-success"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-sm font-medium text-muted-foreground">
            {`Completed: ${completedCourse.title}`}
          </span>
          <h2 className="truncate text-2xl font-bold tracking-tight text-card-foreground">
            {nextCourse ? nextCourse.title : 'All available courses completed'}
          </h2>
          {nextCourse ? (
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {nextCourse.difficultyName ? <span>{nextCourse.difficultyName}</span> : null}
              {hours ? (
                <span className="inline-flex items-center gap-1">
                  <Icon name="clock" size={14} />
                  {hours}
                </span>
              ) : null}
              <span>{pluralize(nextCourse.moduleCount, 'module', 'modules')}</span>
              <span>{pluralize(nextCourse.itemCount, 'item', 'items')}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {nextCourse ? (
          <Button
            variant="primary"
            size="md"
            iconName="arrow-right"
            iconPosition="right"
            onClick={() =>
              navigate(generatePath(ROUTES.LEARN_COURSE, { courseId: String(nextCourse.courseId) }))
            }
            className="shrink-0 whitespace-nowrap"
          >
            Proceed to next course
          </Button>
        ) : null}
        <IconButton
          icon="x"
          label="Dismiss completed course notice"
          size="sm"
          showTooltip={false}
          onClick={onDismiss}
        />
      </div>
    </section>
  );
}

/** Learn hub: single-row search + filter tabs, active hero CTA, and DataCamp-style courses accordion. */
export function LearnPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useUrlState<LearnTab>('tab', TAB_IDS, 'all');
  const search = useUrlSearch('q');
  const query = search.debouncedValue.toLowerCase();
  const [manualOpen, setManualOpen] = useState<Record<number, boolean>>({});

  const courses = useLearnCourses();
  const labs = useLabCatalog(tab === 'labs');
  const coursesProgress = useCoursesProgress();
  const continuePointer = useContinueLearningPointer();

  if (tab === 'labs' ? labs.isPending : courses.isPending) {
    return <LearnPageSkeleton />;
  }

  const courseList = courses.data ?? [];
  const progressById = new Map<number, CourseProgressDto>(
    (coursesProgress.data ?? []).map((row): [number, CourseProgressDto] => [row.courseId, row]),
  );

  const completedCourseParam = Number(searchParams.get('completedCourse'));
  const completedCourseId =
    Number.isInteger(completedCourseParam) && completedCourseParam > 0
      ? completedCourseParam
      : null;
  const completedCourse =
    completedCourseId !== null
      ? (courseList.find((course) => course.courseId === completedCourseId) ?? null)
      : null;
  const completedCourseIdx = completedCourse
    ? courseList.findIndex((course) => course.courseId === completedCourse.courseId)
    : -1;
  const nextRecommendedCourse =
    completedCourse !== null
      ? (courseList
          .slice(completedCourseIdx + 1)
          .find((course) => !progressById.get(course.courseId)?.isCompleted) ??
        courseList.find(
          (course) =>
            course.courseId !== completedCourse.courseId &&
            !progressById.get(course.courseId)?.isCompleted,
        ) ??
        null)
      : null;

  const dismissCompletedBanner = () => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('completedCourse');
        return next;
      },
      { replace: true },
    );
  };

  const visibleCourses = courseList.filter((course) => {
    const progress = progressById.get(course.courseId);
    const matchesStatus =
      tab === 'completed'
        ? Boolean(progress?.isCompleted)
        : tab === 'in-progress'
          ? Boolean(
              progress &&
              !progress.isCompleted &&
              (progress.completedLessonCount > 0 || progress.progressPercentage > 0),
            )
          : true;

    return (
      matchesStatus &&
      matchesQuery(
        query,
        course.title,
        course.description,
        course.slug,
        course.difficultyName,
        course.categoryName,
      )
    );
  });

  const visibleLabs = (labs.data ?? []).filter((lab) =>
    matchesQuery(query, lab.labName, lab.description, lab.slug, lab.difficultyName),
  );

  const activePointerCourseId = continuePointer.data?.courseId ?? null;
  const defaultExpandedId =
    (nextRecommendedCourse &&
    visibleCourses.some((course) => course.courseId === nextRecommendedCourse.courseId)
      ? nextRecommendedCourse.courseId
      : null) ??
    (activePointerCourseId !== null &&
    visibleCourses.some((course) => course.courseId === activePointerCourseId)
      ? activePointerCourseId
      : null) ??
    visibleCourses.find((course) => {
      const prog = progressById.get(course.courseId);
      return prog && !prog.isCompleted && prog.progressPercentage > 0;
    })?.courseId ??
    visibleCourses[0]?.courseId ??
    null;

  function toggleCourse(courseId: number) {
    setManualOpen((prev) => {
      const currentlyOpen = prev[courseId] ?? courseId === defaultExpandedId;
      return { ...prev, [courseId]: !currentlyOpen };
    });
  }

  const clearSearch = () => search.setValue('');

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-6 pb-12">
      <PageHeader title="Learn" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search.value}
          onValueChange={search.setValue}
          label="Search courses and labs"
          shortcut
          className="w-full sm:w-80"
        />
        <TabSwitcher
          items={FILTER_TABS}
          value={tab}
          onChange={setTab}
          ariaLabel="Learn filter"
          idPrefix="learn"
        />
      </div>

      {tab !== 'labs' ? (
        <>
          {completedCourse ? (
            <CompletedCourseBanner
              completedCourse={completedCourse}
              nextCourse={nextRecommendedCourse}
              onDismiss={dismissCompletedBanner}
            />
          ) : (
            <ActiveHero
              pointer={continuePointer.data ?? null}
              starterCourse={courseList[0] ?? null}
            />
          )}

          {courses.isError ? (
            <ErrorState error={courses.error} onRetry={() => void courses.refetch()} />
          ) : visibleCourses.length === 0 ? (
            courseList.length === 0 ? (
              <EmptyState icon="course" title="Nothing published yet" />
            ) : query ? (
              <EmptyState
                icon="search"
                title="No results"
                action={
                  <Button variant="secondary" onClick={clearSearch}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon="course"
                title={
                  tab === 'completed'
                    ? 'No completed courses yet'
                    : tab === 'in-progress'
                      ? 'No courses in progress yet'
                      : 'Nothing published yet'
                }
              />
            )
          ) : (
            <section aria-label="Courses syllabus" className="flex flex-col gap-3">
              {visibleCourses.map((course) => (
                <CourseAccordionItem
                  key={course.courseId}
                  course={course}
                  progress={progressById.get(course.courseId) ?? null}
                  open={manualOpen[course.courseId] ?? course.courseId === defaultExpandedId}
                  onToggle={toggleCourse}
                />
              ))}
            </section>
          )}
        </>
      ) : labs.isError ? (
        <ErrorState error={labs.error} onRetry={() => void labs.refetch()} />
      ) : visibleLabs.length === 0 ? (
        (labs.data ?? []).length === 0 ? (
          <EmptyState icon="lab" title="No labs published yet" />
        ) : (
          <EmptyState
            icon="search"
            title="No matching labs"
            action={
              <Button variant="secondary" onClick={clearSearch}>
                Clear search
              </Button>
            }
          />
        )
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleLabs.map((lab) => (
            <li key={lab.labId}>
              <LabCard lab={lab} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LearnPage;
