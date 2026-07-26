import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { ReportsList } from '../components';
import { useReports } from '../hooks';

export default function ReportsPage() {
  const { data, isLoading, isError, error, refetch } = useReports();
  const reports = data ?? [];

  return (
    <div>
      <PageHeader title="Reports" description="Browse generated and scheduled reports." />

      {isLoading ? <LoadingState label="Loading reports…" /> : null}

      {isError ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && reports.length === 0 ? (
        <EmptyState title="No reports yet" description="Reports will show up here once created." />
      ) : null}

      {!isLoading && !isError && reports.length > 0 ? <ReportsList reports={reports} /> : null}
    </div>
  );
}
