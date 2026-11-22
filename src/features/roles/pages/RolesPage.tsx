import { EmptyState, ErrorState, PageHeader } from '@/shared/components';
import { RolesPageSkeleton } from '../components/RolesPageSkeleton';
import { RolesList } from '../components';
import { useRoles } from '../hooks';

export default function RolesPage() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useRoles();
  const roles = data ?? [];

  if (isLoading) return <RolesPageSkeleton />;

  return (
    <div>
      <PageHeader title="Roles" />

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} retrying={isRefetching} />
      ) : null}

      {!isLoading && !isError && roles.length === 0 ? <EmptyState title="No roles found" /> : null}

      {!isLoading && !isError && roles.length > 0 ? <RolesList roles={roles} /> : null}
    </div>
  );
}
