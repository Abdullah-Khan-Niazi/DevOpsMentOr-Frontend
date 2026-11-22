import { EmptyState, ErrorState, PageHeader } from '@/shared/components';
import { UsersPageSkeleton } from '../components/UsersPageSkeleton';
import { UsersTable } from '../components';
import { useUsers } from '../hooks';

export default function UsersPage() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useUsers();
  const users = data?.data ?? [];

  if (isLoading) return <UsersPageSkeleton />;

  return (
    <div>
      <PageHeader title="Users" />

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} retrying={isRefetching} />
      ) : null}

      {!isLoading && !isError && users.length === 0 ? <EmptyState title="No users found" /> : null}

      {!isLoading && !isError && users.length > 0 ? <UsersTable users={users} /> : null}
    </div>
  );
}
