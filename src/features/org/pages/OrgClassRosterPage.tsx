import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  PageHeader,
  Pagination,
  toast,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useClassDetail, useClassRoster, useWithdrawStudent } from '../hooks';
import { ClassRosterTable } from '../components';

const PAGE_SIZE = 20;

/** F3 contract §09 SCR-F3-09: class roster (CLS-06) + withdraw (CLS-09). */
export function OrgClassRosterPage() {
  const { classId = '' } = useParams<{ classId: string }>();
  const canInvite = useAuthStore((state) =>
    (state.user?.permissions ?? []).some((permission) =>
      ['class:students:invite', 'org:students:invite'].includes(permission),
    ),
  );

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [withdrawTarget, setWithdrawTarget] = useState<number | null>(null);

  const detail = useClassDetail(classId);
  const roster = useClassRoster(
    classId,
    { search: search || undefined, page, pageSize: PAGE_SIZE },
    true,
  );
  const withdraw = useWithdrawStudent(classId);

  const applySearch = () => {
    setPage(1);
    setSearch(draft.trim());
  };

  const handleWithdraw = (userId: number) => {
    withdraw.mutate(userId, {
      onSuccess: () => {
        toast.success('Student withdrawn.');
        setWithdrawTarget(null);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div>
      <PageHeader
        title="Class roster"
        description={
          detail.query.data
            ? `Students enrolled in ${detail.query.data.className}`
            : 'Class students'
        }
        actions={
          <Link
            to={ROUTES.ORG_CLASS_DETAIL.replace(':classId', classId)}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            ← Back to class
          </Link>
        }
      />

      <Card className="p-5">
        <div className="mb-4 flex items-end gap-3">
          <div className="grow">
            <label htmlFor="roster-search" className="input-label">
              Search
            </label>
            <input
              id="roster-search"
              className="input-field w-full"
              placeholder="Name or email…"
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

        {roster.isError ? (
          <ErrorState
            message={roster.error?.message ?? 'Unable to load roster.'}
            onRetry={() => void roster.refetch()}
          />
        ) : (
          <>
            <ClassRosterTable
              students={roster.data?.data ?? []}
              isLoading={roster.isLoading}
              canManage={canInvite}
              onWithdraw={(userId) => setWithdrawTarget(userId)}
            />
            {roster.data ? (
              <Pagination
                page={roster.data.page}
                pageSize={roster.data.pageSize}
                total={roster.data.total}
                totalPages={roster.data.totalPages}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </Card>

      {withdrawTarget !== null && (
        <ConfirmDialog
          open
          title="Withdraw student"
          onCancel={() => setWithdrawTarget(null)}
          onConfirm={() => handleWithdraw(withdrawTarget)}
          confirmLabel="Withdraw"
          isLoading={withdraw.isPending}
          message="Remove this student from the class? Their historical enrollment record is preserved."
        />
      )}
    </div>
  );
}

export default OrgClassRosterPage;
