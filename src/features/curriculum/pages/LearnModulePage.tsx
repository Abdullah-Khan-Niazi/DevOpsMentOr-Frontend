import { useState } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  EmptyState,
  ErrorState,
  Markdown,
  PageHeader,
  ProgressBar,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { getStatusCode } from '@/shared/services';
import { useModuleItemsProgress } from '@/features/progress/hooks/useProgress';
import { ModuleItemRow } from '../components/learn/ModuleItemRow';
import { AccessDeniedState } from '../components/learn/AccessDeniedState';
import { CourseOutlineDrawer } from '../components/learn/CourseOutlineDrawer';
import { useLearnCourse, useLearnModule, useLearnModuleItems } from '../hooks/useCurriculum';
import type { ModuleItemDto } from '../types';
import { LearnModulePageSkeleton } from './LearnModulePageSkeleton';

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

function NotFoundState() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-6">
      <PageHeader title="Module" backTo={ROUTES.LEARN} />
      <EmptyState
        icon="search"
        title="Module not found"
        action={
          <Button variant="secondary" onClick={() => navigate(ROUTES.LEARN)}>
            Back to Learn
          </Button>
        }
      />
    </div>
  );
}

/** Ordered items of one module with progress; items open by kind; outline drawer from the header. */
export function LearnModulePage() {
  const navigate = useNavigate();
  const { moduleId: rawModuleId } = useParams();
  const moduleId = parseId(rawModuleId);
  const [outlineOpen, setOutlineOpen] = useState(false);

  const moduleQuery = useLearnModule(moduleId ?? 0);
  const courseId = moduleQuery.data?.courseId ?? null;
  const courseQuery = useLearnCourse(courseId);
  const itemsQuery = useLearnModuleItems(moduleId);
  const progressQuery = useModuleItemsProgress(moduleId);

  if (moduleId === null) return <NotFoundState />;

  if (moduleQuery.isError) {
    if (getStatusCode(moduleQuery.error) === 404) return <NotFoundState />;
    return (
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-6">
        <PageHeader title="Module" backTo={ROUTES.LEARN} />
        <ErrorState error={moduleQuery.error} onRetry={() => void moduleQuery.refetch()} />
      </div>
    );
  }

  if (moduleQuery.isPending || !moduleQuery.data) return <LearnModulePageSkeleton />;

  if (courseQuery.isError) {
    return (
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-6">
        <PageHeader title={moduleQuery.data.title} backTo={ROUTES.LEARN} />
        <ErrorState error={courseQuery.error} onRetry={() => void courseQuery.refetch()} />
      </div>
    );
  }

  if (courseQuery.isPending || !courseQuery.data) return <LearnModulePageSkeleton />;

  const module = moduleQuery.data;
  const { access } = courseQuery.data;
  const backTo = generatePath(ROUTES.LEARN_COURSE, { courseId: String(module.courseId) });

  const outlineButton = (
    <Button variant="secondary" iconName="list" onClick={() => setOutlineOpen(true)}>
      Course outline
    </Button>
  );

  if (itemsQuery.isError) {
    return (
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-6">
        <PageHeader title={module.title} backTo={backTo} actions={outlineButton} />
        <ErrorState error={itemsQuery.error} onRetry={() => void itemsQuery.refetch()} />
      </div>
    );
  }

  if (itemsQuery.isPending) return <LearnModulePageSkeleton />;

  const items = [...(itemsQuery.data ?? [])].sort((a, b) => a.position - b.position);
  const progressById = new Map((progressQuery.data ?? []).map((row) => [row.itemId, row] as const));
  const completedCount = items.filter((item) => progressById.get(item.itemId)?.isCompleted).length;
  const percentage = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100);

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-8">
      <PageHeader title={module.title} backTo={backTo} actions={outlineButton} />

      <section className="flex flex-col gap-5">
        {items.length > 0 ? (
          <ProgressBar value={percentage} label={`${module.title} progress`} />
        ) : null}
        {module.description ? <Markdown variant="compact">{module.description}</Markdown> : null}
        {access.canAccess ? null : (
          <AccessDeniedState reason={access.reason} onBack={() => navigate(ROUTES.LEARN)} />
        )}
      </section>

      {items.length === 0 ? (
        <EmptyState icon="checklist" title="Nothing published yet" />
      ) : (
        <ol aria-label="Module items" className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.itemId}>
              <ModuleItemRow
                item={item}
                progress={progressById.get(item.itemId)}
                locked={!access.canAccess}
                to={access.canAccess ? itemRoute(item) : null}
              />
            </li>
          ))}
        </ol>
      )}

      <CourseOutlineDrawer
        open={outlineOpen}
        courseId={module.courseId}
        currentModuleId={module.moduleId}
        onClose={() => setOutlineOpen(false)}
      />
    </div>
  );
}

export default LearnModulePage;
