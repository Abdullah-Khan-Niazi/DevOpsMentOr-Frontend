import { EmptyState, ErrorState, PageHeader } from '@/shared/components';
import { ReportsPageSkeleton } from '../components/ReportsPageSkeleton';
import { ReportsList } from '../components';
import { useReports } from '../hooks';

export default function ReportsPage() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useReports();
  const reports = data ?? [];

  if (isLoading) return <ReportsPageSkeleton />;

  return (
    <div>
      <PageHeader title="Reports" />

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} retrying={isRefetching} />
      ) : null}

      {!isLoading && !isError && reports.length === 0 ? (
        <EmptyState title="No reports yet" />
      ) : null}

      {!isLoading && !isError && reports.length > 0 ? <ReportsList reports={reports} /> : null}
    </div>
  );
}
