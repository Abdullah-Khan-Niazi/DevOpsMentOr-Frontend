import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { SettingsForm } from '../components';
import { useSettings } from '../hooks';

export default function SettingsPage() {
  const { data, isLoading, isError, error, refetch } = useSettings();

  return (
    <div>
      <PageHeader title="Settings" description="Configure organization preferences." />

      {isLoading ? <LoadingState label="Loading settings…" /> : null}

      {isError ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && !data ? (
        <EmptyState title="Settings unavailable" description="Unable to load settings right now." />
      ) : null}

      {!isLoading && !isError && data ? <SettingsForm settings={data} /> : null}
    </div>
  );
}
