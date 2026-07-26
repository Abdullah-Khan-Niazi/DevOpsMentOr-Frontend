import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { RolesList } from '../components';
import { useRoles } from '../hooks';

export default function RolesPage() {
  const { data, isLoading, isError, error, refetch } = useRoles();
  const roles = data ?? [];

  return (
    <div>
      <PageHeader title="Roles" description="Define roles and permission sets." />

      {isLoading ? <LoadingState label="Loading roles…" /> : null}

      {isError ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && roles.length === 0 ? (
        <EmptyState title="No roles found" description="Create a role to manage permissions." />
      ) : null}

      {!isLoading && !isError && roles.length > 0 ? <RolesList roles={roles} /> : null}
    </div>
  );
}
