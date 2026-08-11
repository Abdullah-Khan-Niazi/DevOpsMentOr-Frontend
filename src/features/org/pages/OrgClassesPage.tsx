import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  toast,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOrgClasses } from '../hooks';
import { ClassCard } from '../components';

const PAGE_SIZE = 12;

/** F3 contract §09 SCR-F3-05: class list (CLS-02) + create entry point (CLS-01). */
export function OrgClassesPage() {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [page, setPage] = useState(1);

  const canManage = useAuthStore((state) =>
    state.user?.permissions?.some((permission) =>
      ['org:classes:manage', 'class:manage'].includes(permission),
    ),
  );

  const { data, isLoading, isError, error, refetch } = useOrgClasses({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const applySearch = () => {
    const term = draft.trim();
    if (term.length === 1) {
      toast.info('Search needs at least 2 characters.');
      return;
    }
    setSearch(term);
    setPage(1);
    void refetch();
  };

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Classes owned by your organization."
        actions={
          canManage ? (
            <Link to={ROUTES.ORG_CLASS_NEW}>
              <Button>New class</Button>
            </Link>
          ) : undefined
        }
      />

      <Card className="p-5">
        <div className="mb-4 flex items-end gap-3">
          <div className="grow">
            <label htmlFor="class-search" className="input-label">
              Search
            </label>
            <input
              id="class-search"
              className="input-field w-full"
              placeholder="Class name…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
            />
          </div>
          <Button variant="secondary" onClick={applySearch}>
            Search
          </Button>
        </div>

        {isError ? (
          <ErrorState
            message={error?.message ?? 'Unable to load classes.'}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <p className="py-6 text-sm text-slate-500">Loading classes…</p>
        ) : data && data.data.length === 0 ? (
          <EmptyState
            title={search ? 'No matching classes' : 'No classes yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Create your first class to start building your academic workspace.'
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data?.data.map((klass) => (
                <ClassCard key={klass.classId} klass={klass} />
              ))}
            </div>
            {data ? (
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}

export default OrgClassesPage;
