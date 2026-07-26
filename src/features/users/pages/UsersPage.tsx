import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { UsersTable } from '../components';
import { useUsers } from '../hooks';

export default function UsersPage() {
  const { data, isLoading, isError, error, refetch } = useUsers();
  const users = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Users" description="Manage application users and their access." />

      {isLoading ? <LoadingState label="Loading users…" /> : null}

      {isError ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && users.length === 0 ? (
        <EmptyState title="No users found" description="Create a user to get started." />
      ) : null}

      {!isLoading && !isError && users.length > 0 ? <UsersTable users={users} /> : null}
    </div>
  );
}
