import { useQueries } from '@tanstack/react-query';
import { Link, generatePath, useNavigate } from 'react-router-dom';
import {
  Button,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  ProgressBar,
  SearchInput,
  TabPanel,
  TabSwitcher,
  type TabSwitcherItem,
} from '@/shared/components';
import { QUERY_KEYS, ROUTES } from '@/shared/constants';
import { useUrlSearch, useUrlState } from '@/shared/hooks';
import { formatDuration } from '@/shared/utils';
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
  ModuleProgressSummary,
} from '@/features/progress/types';
import { CourseCard } from '../components/learn/CourseCard';
import { ItemKindIcon } from '../components/learn/ItemKindIcon';
import { useAllLearnModules, useLearnCourses } from '../hooks/useCurriculum';
import type { LearnerCourseDto, ModuleDto } from '../types';
import { LearnPageSkeleton } from './LearnPageSkeleton';

const TAB_IDS = ['courses', 'modules', 'labs'] as const;
type LearnTab = (typeof TAB_IDS)[number];

const TAB_ITEMS: ReadonlyArray<TabSwitcherItem<LearnTab>> = [
  { id: 'courses', label: 'Courses', icon: 'course' },
  { id: 'modules', label: 'Modules', icon: 'module' },
  { id: 'labs', label: 'Labs', icon: 'lab' },
];

const ROW_CLASS =
  'flex items-center gap-4 rounded-md px-4 py-3 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]';

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

interface NoMatchesProps {
  /** Whether the tab has any published content before the search applies. */
  hasItems: boolean;
  icon: 'course' | 'module' | 'lab';
  onClear: () => void;
}

function NoMatches({ hasItems, icon, onClear }: NoMatchesProps) {
  if (!hasItems) return <EmptyState icon={icon} title="Nothing published yet" />;
  return (
    <EmptyState
      icon="search"
      title="No results"
      action={
        <Button variant="secondary" onClick={onClear}>
          Clear search
        </Button>
      }
    />
  );
}

function ContinueStrip({ pointer }: { pointer: ContinueLearningPointerDto }) {
  const navigate = useNavigate();
  const target = continueTarget(pointer);

  return (
    <section
      aria-label="Continue learning"
      className="flex flex-wrap items-center gap-4 rounded-md border border-paper-line bg-pearl-100 p-4"
    >
      <ItemKindIcon kind={pointer.kind} size={24} />
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-2">
        <p className="truncate font-semibold text-card-foreground">{pointer.lessonTitle}</p>
        <p className="truncate text-sm text-muted-foreground">{pointer.moduleTitle}</p>
        <ProgressBar
          value={pointer.progressPct}
          label={`${pointer.lessonTitle} progress`}
          size="sm"
        />
      </div>
      {target ? (
        <Button
          variant="secondary"
          iconName="arrow-right"
          iconPosition="right"
          onClick={() => navigate(target)}
        >
          Resume
        </Button>
      ) : null}
    </section>
  );
}

interface CoursesPanelProps {
  courses: LearnerCourseDto[];
  progressById: Map<number, CourseProgressDto>;
  query: string;
  onClear: () => void;
}

function CoursesPanel({ courses, progressById, query, onClear }: CoursesPanelProps) {
  const visible = courses.filter((course) =>
    matchesQuery(
      query,
      course.title,
      course.description,
      course.slug,
      course.difficultyName,
      course.categoryName,
    ),
  );

  if (visible.length === 0) {
    return <NoMatches hasItems={courses.length > 0} icon="course" onClear={onClear} />;
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((course) => (
        <li key={course.courseId}>
          <CourseCard
            course={course}
            progress={progressById.get(course.courseId) ?? null}
            to={generatePath(ROUTES.LEARN_COURSE, { courseId: String(course.courseId) })}
          />
        </li>
      ))}
    </ul>
  );
}

function ModuleLinkRow({
  module,
  progress,
}: {
  module: ModuleDto;
  progress?: ModuleProgressSummary;
}) {
  const duration = formatDuration({ minutes: module.estimatedMinutes });

  return (
    <Link
      to={generatePath(ROUTES.LEARN_MODULE, { moduleId: String(module.moduleId) })}
      className={ROW_CLASS}
    >
      <Icon name="module" size={20} className="shrink-0 text-muted-foreground" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium text-card-foreground">{module.title}</span>
        {duration ? <span className="text-sm text-muted-foreground">{duration}</span> : null}
      </span>
      {progress ? (
        <ProgressBar
          value={progress.progressPercentage}
          label={`${module.title} progress`}
          size="sm"
          className="w-32 shrink-0"
        />
      ) : null}
    </Link>
  );
}

interface ModulesPanelProps {
  courses: LearnerCourseDto[];
  modules: ModuleDto[];
  progressById: Map<number, ModuleProgressSummary>;
  query: string;
  onClear: () => void;
}

/** Modules of every course, grouped under the course title. */
function ModulesPanel({ courses, modules, progressById, query, onClear }: ModulesPanelProps) {
  const groups = courses
    .map((course) => ({
      course,
      visible: modules.filter(
        (module) =>
          module.courseId === course.courseId &&
          matchesQuery(query, module.title, module.description, module.slug, course.title),
      ),
    }))
    .filter((group) => group.visible.length > 0);

  if (groups.length === 0) {
    return <NoMatches hasItems={modules.length > 0} icon="module" onClear={onClear} />;
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map(({ course, visible }) => (
        <section
          key={course.courseId}
          aria-labelledby={`learn-course-${course.courseId}`}
          className="flex flex-col gap-2"
        >
          <h2
            id={`learn-course-${course.courseId}`}
            className="text-lg font-semibold text-card-foreground"
          >
            {course.title}
          </h2>
          <ul className="flex flex-col gap-1">
            {visible.map((module) => (
              <li key={module.moduleId}>
                <ModuleLinkRow module={module} progress={progressById.get(module.moduleId)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
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

interface LabsPanelProps {
  labs: LabDto[];
  query: string;
  onClear: () => void;
}

function LabsPanel({ labs, query, onClear }: LabsPanelProps) {
  const visible = labs.filter((lab) =>
    matchesQuery(query, lab.labName, lab.description, lab.slug, lab.difficultyName),
  );

  if (visible.length === 0) {
    return <NoMatches hasItems={labs.length > 0} icon="lab" onClear={onClear} />;
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((lab) => (
        <li key={lab.labId}>
          <LabCard lab={lab} />
        </li>
      ))}
    </ul>
  );
}

/** Learn hub: continue strip, then courses, modules and labs with client-side search. */
export function LearnPage() {
  const [tab, setTab] = useUrlState<LearnTab>('tab', TAB_IDS, 'courses');
  const search = useUrlSearch('q');
  const query = search.debouncedValue.toLowerCase();

  const courses = useLearnCourses();
  const modules = useAllLearnModules();
  const labs = useLabCatalog(tab === 'labs');
  const coursesProgress = useCoursesProgress();
  const continuePointer = useContinueLearningPointer();

  const courseIds = courses.data?.map((course) => course.courseId) ?? [];
  const moduleProgress = useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: QUERY_KEYS.progress.courseModules(courseId),
      queryFn: () => progressService.getCourseModulesProgress(courseId),
      enabled: tab === 'modules',
      retry: false,
    })),
  });

  const courseProgressById = new Map<number, CourseProgressDto>(
    (coursesProgress.data ?? []).map((row): [number, CourseProgressDto] => [row.courseId, row]),
  );
  const moduleProgressById = new Map<number, ModuleProgressSummary>();
  moduleProgress.forEach((entry) => {
    (entry.data ?? []).forEach((row) => moduleProgressById.set(row.moduleId, row));
  });

  const clearSearch = () => search.setValue('');
  const activeQuery = tab === 'courses' ? courses : tab === 'modules' ? modules : labs;

  if (activeQuery.isPending) return <LearnPageSkeleton />;

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-6">
      <PageHeader title="Learn" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search.value}
          onValueChange={search.setValue}
          label="Search learn"
          shortcut
          className="w-full sm:w-72"
        />
        <TabSwitcher
          items={TAB_ITEMS}
          value={tab}
          onChange={setTab}
          ariaLabel="Learn sections"
          idPrefix="learn"
        />
      </div>

      {continuePointer.data ? <ContinueStrip pointer={continuePointer.data} /> : null}

      <TabPanel idPrefix="learn" id="courses" active={tab === 'courses'}>
        {courses.isError ? (
          <ErrorState error={courses.error} onRetry={() => void courses.refetch()} />
        ) : (
          <CoursesPanel
            courses={courses.data ?? []}
            progressById={courseProgressById}
            query={query}
            onClear={clearSearch}
          />
        )}
      </TabPanel>

      <TabPanel idPrefix="learn" id="modules" active={tab === 'modules'}>
        {modules.isError ? (
          <ErrorState error={modules.error} onRetry={() => void modules.refetch()} />
        ) : (
          <ModulesPanel
            courses={courses.data ?? []}
            modules={modules.data ?? []}
            progressById={moduleProgressById}
            query={query}
            onClear={clearSearch}
          />
        )}
      </TabPanel>

      <TabPanel idPrefix="learn" id="labs" active={tab === 'labs'}>
        {labs.isError ? (
          <ErrorState error={labs.error} onRetry={() => void labs.refetch()} />
        ) : (
          <LabsPanel labs={labs.data ?? []} query={query} onClear={clearSearch} />
        )}
      </TabPanel>
    </div>
  );
}

export default LearnPage;
