import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { useMyClass } from '../hooks';

/** F3 contract §09 SCR-F3-10: student's own class (ENR-03). */
export function StudentMyClassPage() {
  const { data, isLoading, isError, error, refetch } = useMyClass();
  const notEnrolled = (error as { statusCode?: number } | null)?.statusCode === 404;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My class" description="Your current organization class enrollment." />

      {isLoading ? (
        <LoadingState label="Loading your class…" />
      ) : notEnrolled ? (
        <EmptyState
          title="You are not enrolled in a class yet"
          description="Ask your organization to invite you, or accept an enrollment invitation when you receive one."
        />
      ) : isError || !data ? (
        <ErrorState
          message={error?.message ?? 'Unable to load your class.'}
          onRetry={() => void refetch()}
        />
      ) : (
        <Card className="space-y-3 p-6">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">{data.className}</h2>
            <p className="mt-1 text-sm text-muted">{data.organizationName}</p>
          </div>
          <dl className="border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Enrolled</dt>
              <dd className="font-medium text-card-foreground">
                {new Date(data.enrolledAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  );
}

export default StudentMyClassPage;
