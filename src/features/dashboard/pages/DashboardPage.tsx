import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { StatsGrid } from '../components';
import { useDashboardStats } from '../hooks';

export default function DashboardPage() {
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
