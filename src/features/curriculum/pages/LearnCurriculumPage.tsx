import { useNavigate } from 'react-router-dom';
import { Card, ErrorState, PageHeader } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { ModuleAccordionList } from '../components/ModuleAccordionList';
import { useCourseOverview } from '../hooks';

/** F4 SCR-F4-05: learner course viewer with module accordions (F4-API-01..03). */
export function LearnCurriculumPage() {
  const navigate = useNavigate();
  const overview = useCourseOverview();

  if (overview.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Learn" />
        <Card className="space-y-3 p-4">
          <div className="h-6 w-1/3 rounded bg-border" />
          <div className="h-4 w-2/3 rounded bg-border" />
          <div className="h-12 rounded-lg bg-border" />
          <div className="h-12 rounded-lg bg-border" />
        </Card>
      </div>
    );
  }

  if (overview.isError || !overview.data) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Learn" />
        <ErrorState
          message={overview.error?.message ?? 'Unable to load the curriculum.'}
          onRetry={() => void overview.refetch()}
        />
      </div>
    );
  }

  const { course, modules } = overview.data;

  const openLesson = (lessonId: number) => {
    navigate(ROUTES.LEARN_LESSON.replace(':lessonId', String(lessonId)));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Learn" description={course.title} />

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-card-foreground">{course.title}</h2>
        <p className="mt-1 text-sm text-muted">{course.description ?? 'No description.'}</p>
        <dl className="mt-4 flex gap-6 text-sm">
          <div>
            <dt className="text-muted">Modules</dt>
            <dd className="font-medium text-card-foreground">{modules.length}</dd>
          </div>
          <div>
            <dt className="text-muted">Lessons</dt>
            <dd className="font-medium text-card-foreground">{course.totalLessons}</dd>
          </div>
          <div>
            <dt className="text-muted">Quizzes</dt>
            <dd className="font-medium text-card-foreground">{course.totalQuizzes}</dd>
          </div>
          <div>
            <dt className="text-muted">Est. hours</dt>
            <dd className="font-medium text-card-foreground">{course.estimatedHours}</dd>
          </div>
        </dl>
      </Card>

      <ModuleAccordionList
        modules={modules}
        isError={false}
        onRetry={() => void overview.refetch()}
        onOpenLesson={openLesson}
      />
    </div>
  );
}

export default LearnCurriculumPage;
