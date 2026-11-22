import { Link, generatePath, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  EmptyState,
  ErrorState,
  Icon,
  Markdown,
  PageHeader,
  ProgressBar,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { getStatusCode } from '@/shared/services';
import { cn, formatDuration, pluralize } from '@/shared/utils';
import {
  useCourseModulesProgress,
  useCourseProgressById,
  useModuleItemsProgress,
} from '@/features/progress/hooks/useProgress';
import type { ModuleProgressSummary } from '@/features/progress/types';
import { AccessDeniedState } from '../components/learn/AccessDeniedState';
import { useLearnCourse, useLearnModuleItems } from '../hooks/useCurriculum';
import type { ModuleDto, ModuleItemDto } from '../types';
import { LearnCoursePageSkeleton } from './LearnCoursePageSkeleton';

const ROW_BASE = 'flex items-center gap-4 rounded-md px-4 py-3';

function parseId(raw: string | undefined): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Route for a module item by kind, or null when the item has no destination. */
function itemRoute(item: ModuleItemDto): string | null {
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

/** First incomplete item of the module (in spine order), else the first item. */
function findResumeItem(
  items: ModuleItemDto[] | undefined,
  progress: Array<{ itemId: number; isCompleted: boolean }> | undefined,
): ModuleItemDto | null {
  if (!items || items.length === 0) return null;
  const ordered = [...items].sort((a, b) => a.position - b.position);
  const completed = new Set(
    (progress ?? []).filter((row) => row.isCompleted).map((row) => row.itemId),
  );
  return ordered.find((item) => !completed.has(item.itemId)) ?? ordered[0];
}

function ModuleRow({
  module,
  progress,
  locked,
}: {
  module: ModuleDto;
  progress?: ModuleProgressSummary;
  locked: boolean;
}) {
  const completed = progress?.isCompleted === true;
  const duration = formatDuration({ minutes: module.estimatedMinutes });

  const content = (
    <>
      <span className="flex shrink-0">
        <Icon
          name={completed ? 'check-circle' : 'module'}
          filled={completed}
          size={20}
          className={cn(completed ? 'text-success' : 'text-muted-foreground')}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium text-card-foreground">{module.title}</span>
        {duration ? <span className="text-sm text-muted-foreground">{duration}</span> : null}
      </span>
      {progress && !locked ? (
        <ProgressBar
          value={progress.progressPercentage}
          label={`${module.title} progress`}
          size="sm"
          className="w-32 shrink-0"
        />
      ) : null}
      {locked ? (
        <Icon name="lock" size={18} title="Locked" className="shrink-0 text-muted-foreground" />
      ) : null}
    </>
  );

  if (locked) {
    return (
      <div aria-disabled="true" className={cn(ROW_BASE, 'opacity-70')}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to={generatePath(ROUTES.LEARN_MODULE, { moduleId: String(module.moduleId) })}
      className={cn(
        ROW_BASE,
        'transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]',
      )}
    >
      {content}
    </Link>
  );
}

function TextList({
  id,
  heading,
  items,
  icon,
}: {
  id: string;
  heading: string;
  items: string[];
  icon: 'check' | 'circle';
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-semibold text-card-foreground">
        {heading}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((entry, index) => (
          <li key={index} className="flex items-start gap-3">
            <Icon name={icon} size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
            <span className="text-card-foreground">{entry}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NotFoundState() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-6">
      <PageHeader title="Course" backTo={ROUTES.LEARN} />
      <EmptyState
        icon="search"
        title="Course not found"
        action={
          <Button variant="secondary" onClick={() => navigate(ROUTES.LEARN)}>
            Back to Learn
          </Button>
        }
      />
    </div>
  );
}

/** Course outline: description, objectives, Start or Resume and the module list with progress. */
export function LearnCoursePage() {
  const navigate = useNavigate();
  const { courseId: rawCourseId } = useParams();
  const courseId = parseId(rawCourseId);

  const detail = useLearnCourse(courseId);
  const courseProgress = useCourseProgressById(courseId);
  const moduleProgress = useCourseModulesProgress(courseId);

  const data = detail.data;
  const canAccess = data?.access.canAccess === true;
  const modules = data?.modules ?? [];
  const progressByModule = new Map<number, ModuleProgressSummary>(
    (moduleProgress.data ?? []).map((row): [number, ModuleProgressSummary] => [row.moduleId, row]),
  );
  const resumeModule =
    modules.find((module) => !progressByModule.get(module.moduleId)?.isCompleted) ??
    modules[0] ??
    null;

  const resumeItems = useLearnModuleItems(resumeModule?.moduleId ?? null, canAccess);
  const resumeProgress = useModuleItemsProgress(resumeModule?.moduleId ?? null, canAccess);
  const resumeItem = findResumeItem(resumeItems.data, resumeProgress.data);
  const startTarget = resumeItem ? itemRoute(resumeItem) : null;
  const started = (courseProgress.data?.progressPercentage ?? 0) > 0;

  if (courseId === null) return <NotFoundState />;

  if (detail.isError) {
    if (getStatusCode(detail.error) === 404) return <NotFoundState />;
    return (
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-6">
        <PageHeader title="Course" backTo={ROUTES.LEARN} />
        <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
      </div>
    );
  }

  if (detail.isPending || !data) return <LearnCoursePageSkeleton />;

  const { course, access } = data;
  const objectives = course.learningObjectives ?? [];
  const prerequisites = course.prerequisites ?? [];
  const hours = formatDuration({ hours: course.estimatedHours });

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-8">
      <PageHeader
        title={course.title}
        backTo={ROUTES.LEARN}
        actions={
          access.canAccess && startTarget ? (
            <Button variant="primary" iconName="play" onClick={() => navigate(startTarget)}>
              {started ? 'Resume' : 'Start'}
            </Button>
          ) : null
        }
      />

      <section className="flex flex-col gap-5">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {course.difficultyName ? <span>{course.difficultyName}</span> : null}
          {hours ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" size={14} />
              {hours}
            </span>
          ) : null}
          <span>{pluralize(modules.length, 'module', 'modules')}</span>
        </p>

        {courseProgress.data ? (
          <ProgressBar
            value={courseProgress.data.progressPercentage}
            label={`${course.title} progress`}
          />
        ) : null}

        {access.canAccess ? null : (
          <AccessDeniedState reason={access.reason} onBack={() => navigate(ROUTES.LEARN)} />
        )}

        {course.description ? <Markdown variant="compact">{course.description}</Markdown> : null}
      </section>

      {objectives.length > 0 ? (
        <TextList
          id="course-objectives"
          heading="What you will learn"
          items={objectives}
          icon="check"
        />
      ) : null}

      {prerequisites.length > 0 ? (
        <TextList
          id="course-prerequisites"
          heading="Prerequisites"
          items={prerequisites}
          icon="circle"
        />
      ) : null}

      <section aria-labelledby="course-modules" className="flex flex-col gap-3">
        <h2 id="course-modules" className="text-lg font-semibold text-card-foreground">
          Modules
        </h2>
        {modules.length === 0 ? (
          <EmptyState icon="module" title="Nothing published yet" />
        ) : (
          <ol className="flex flex-col gap-1">
            {modules.map((module) => (
              <li key={module.moduleId}>
                <ModuleRow
                  module={module}
                  progress={progressByModule.get(module.moduleId)}
                  locked={!access.canAccess}
                />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

export default LearnCoursePage;
