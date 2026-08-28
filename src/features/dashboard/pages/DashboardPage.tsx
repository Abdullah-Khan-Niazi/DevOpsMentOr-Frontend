import { useMemo } from 'react';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  ContinueLearningCard,
  CourseProgressCard,
  ModuleProgressList,
  RecentActivityFeed,
} from '@/features/progress/components';
import {
  useActivityHistory,
  useContinueLearning,
  useCourseProgress,
  useModulesProgress,
} from '@/features/progress/hooks';
import { StatsGrid } from '../components';
import { useDashboardStats } from '../hooks';

function computeStreak(activityDates: string[]): number {
  const days = new Set(activityDates.map((value) => new Date(value).toISOString().slice(0, 10)));
  if (days.size === 0) return 0;

  const today = new Date();
  const cursor = new Date(today);
  let streak = 0;

  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** SCR-F5-01: learner dashboard for users with progress.self.read. */
function LearnerDashboard() {
  const user = useAuthStore((state) => state.user);

  const course = useCourseProgress();
  const modules = useModulesProgress();
  const continueLearning = useContinueLearning();
  const activity = useActivityHistory(20);

  const activityItems = useMemo(() => activity.data ?? [], [activity.data]);

  const streak = useMemo(
    () => computeStreak(activityItems.map((item) => item.createdAt)),
    [activityItems],
  );

  const isError = course.isError || continueLearning.isError;

  const retry = () => {
    void course.refetch();
    void modules.refetch();
    void continueLearning.refetch();
    void activity.refetch();
  };

  if (isError) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <ErrorState
          message={
            course.error?.message ??
            continueLearning.error?.message ??
            'Unable to load your progress.'
          }
          onRetry={retry}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.fullName ?? 'learner'}`}
        description={`${streak} day learning streak`}
      />

      {!course.data ? (
        <EmptyState
          title="Start your learning journey"
          description="Open Module 1 and begin tracking your progress."
        />
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <ContinueLearningCard
          pointer={continueLearning.data ?? null}
          isLoading={continueLearning.isLoading}
        />
        <CourseProgressCard course={course.data ?? null} isLoading={course.isLoading} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ModuleProgressList modules={modules.data ?? []} isLoading={modules.isLoading} />
        <RecentActivityFeed items={activityItems} isLoading={activity.isLoading} />
      </div>
    </div>
  );
}

/** Existing platform stats dashboard (users without progress.self.read). */
function AdminStatsDashboard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardStats();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of platform activity and system health."
      />

      {isLoading || isFetching ? <LoadingState label="Loading dashboard…" /> : null}

      {isError ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && !data ? (
        <EmptyState title="No dashboard data" description="Stats will appear once available." />
      ) : null}

      {!isLoading && !isError && data ? <StatsGrid stats={data} /> : null}
    </div>
  );
}

export default function DashboardPage() {
  const hasProgressRead = useAuthStore((state) =>
    (state.user?.permissions ?? []).includes('progress.self.read'),
  );

  return hasProgressRead ? <LearnerDashboard /> : <AdminStatsDashboard />;
}
