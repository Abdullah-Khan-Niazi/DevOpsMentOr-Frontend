import { useState } from 'react';
import { Card, ErrorState, PageHeader, Pagination, toast } from '@/shared/components';
import { useAdminUsers } from '../hooks';
import { AdminUserTable } from '../components/AdminUserTable';

const PAGE_SIZE = 25;

interface AppliedFilters {
  page: number;
  search: string;
  role: string;
  isBanned: '' | 'true' | 'false';
}

export function AdminUsersPage() {
  const [draft, setDraft] = useState('');
  const [filters, setFilters] = useState<AppliedFilters>({
    page: 1,
    search: '',
    role: '',
    isBanned: '',
  });

  const { data, isLoading, isError, error, refetch } = useAdminUsers({
    page: filters.page,
    pageSize: PAGE_SIZE,
    search: filters.search || undefined,
    role: filters.role || undefined,
    isBanned: filters.isBanned === '' ? undefined : filters.isBanned,
  });

  const applyFilters = (next: Partial<AppliedFilters> & { page?: number }) => {
    const candidate = { ...filters, ...next };
    if (candidate.search.length === 1) {
      toast.info('Search needs at least 2 characters.');
      return;
    }
    setFilters(candidate);
    void refetch();
  };

  return (
    <div>
      <PageHeader
        title="Users"
        description="All platform users — learner pool, organizations and administrators. Governance actions live on the user detail page."
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="admin-search" className="input-label">
              Search
            </label>
            <input
              id="admin-search"
              className="input-field w-64"
              placeholder="Name, username or email…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters({ search: draft.trim() });
              }}
            />
          </div>

          <div>
            <label htmlFor="admin-role" className="input-label">
              Role
            </label>
            <select
              id="admin-role"
              className="input-field"
              value={filters.role}
              onChange={(e) => applyFilters({ role: e.target.value })}
            >
              <option value="">All roles</option>
              <option value="individual_learner">Individual learner</option>
              <option value="org_admin">Organization admin</option>
              <option value="professor">Professor</option>
              <option value="org_student">Organization student</option>
              <option value="platform_admin">Platform admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="admin-banned" className="input-label">
              Ban status
            </label>
            <select
              id="admin-banned"
              className="input-field"
              value={filters.isBanned}
              onChange={(e) =>
                applyFilters({ isBanned: e.target.value as AppliedFilters['isBanned'] })
              }
            >
              <option value="">Any</option>
              <option value="true">Banned</option>
              <option value="false">Not banned</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => applyFilters({ search: draft.trim() })}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-brand-700"
          >
            Apply
          </button>
        </div>

        {isError ? (
          <ErrorState
            message={error?.message ?? 'Unable to load users.'}
            onRetry={() => void refetch()}
          />
        ) : (
          <>
            <AdminUserTable users={data?.data ?? []} isLoading={isLoading} />
            {data ? (
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                totalPages={data.totalPages}
                onPageChange={(next) => applyFilters({ page: next })}
              />
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}

export default AdminUsersPage;
