import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, ErrorState, PageHeader, Pagination } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { ActivityLogTable } from '../components/ActivityLogTable';
import { CourseProgressCard } from '../components/CourseProgressCard';
import { ModuleBreakdownTable } from '../components/ModuleBreakdownTable';
import { useAdminUserProgress } from '../hooks';

const PAGE_SIZE = 20;

/** SCR-F5-05: platform-admin full progress view for one user (F5-API-12). */
export function AdminUserProgressPage() {
  const { userId = '' } = useParams<{ userId: string }>();
  const [page, setPage] = useState(1);

  const query = useAdminUserProgress(userId);
  const data = query.data;

  const activity = useMemo(() => data?.activity ?? [], [data]);
  const pagedActivity = activity.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(activity.length / PAGE_SIZE));

  if (query.isError) {
    return (
      <div>
        <PageHeader title="User progress" />
        <ErrorState
          message={query.error?.message ?? 'Unable to load user progress.'}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const { user } = query.data ?? { user: { userId: 0, fullName: null, username: '', email: '' } };
  const isLoading = query.isLoading;

  return (
    <div>
      <PageHeader
        title={user.fullName ?? user.username}
        description={`${user.email} · @${user.username}`}
        actions={
          <Link
            to={ROUTES.ADMIN_USERS}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            ← Back to users
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CourseProgressCard course={data?.course ?? null} isLoading={isLoading} />
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Quiz attempts</h2>
          {isLoading ? (
            <div className="mt-3 space-y-2">
              <div className="h-3 w-2/3 rounded bg-border" />
              <div className="h-3 w-1/2 rounded bg-border" />
            </div>
          ) : (data?.quizAttempts.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No quiz attempts yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {(data?.quizAttempts ?? []).map((attempt) => (
                <li
                  key={attempt.attemptId}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="text-card-foreground">Attempt #{attempt.attemptNumber}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {attempt.score}% · {attempt.isPassed ? 'Passed' : 'Failed'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-sm font-semibold text-card-foreground">Module breakdown</h2>
        <ModuleBreakdownTable modules={data?.modules ?? []} isLoading={isLoading} />
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-sm font-semibold text-card-foreground">Activity log</h2>
        <ActivityLogTable items={pagedActivity} isLoading={isLoading} />
        {!isLoading ? (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={activity.length}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        ) : null}
      </Card>
    </div>
  );
}

export default AdminUserProgressPage;
