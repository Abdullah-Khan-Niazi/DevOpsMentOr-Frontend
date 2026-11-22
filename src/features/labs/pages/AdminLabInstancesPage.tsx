import '../styles/labs.css';
import { useState, useMemo } from 'react';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  toast,
  Icon,
} from '@/shared/components';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminLabInstances } from '../hooks';
import { labsService } from '../services';
import { AdminLabInstancesSkeleton } from './AdminLabInstancesSkeleton';

const PAGE_SIZE = 20;

type SortColumn = 'instanceId' | 'username' | 'labName' | 'status' | 'assignedIp' | 'expiresAt';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span
      className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100 font-bold' : 'opacity-30'}`}
    >
      <Icon name={active ? (direction === 'asc' ? 'arrow-up' : 'arrow-down') : 'sort'} size={14} />
    </span>
  );
}

/** LAB-22: instance fleet - filter by status/search and force-terminate. */
export function AdminLabInstancesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const [terminatingId, setTerminatingId] = useState<number | null>(null);
  const [pendingTerminateId, setPendingTerminateId] = useState<number | null>(null);

  const [sortCol, setSortCol] = useState<SortColumn>('instanceId');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminLabInstances(
    page,
    PAGE_SIZE,
    status || undefined,
    search || undefined,
  );

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'lab-instances'] });
  };

  const terminate = (instanceId: number): void => {
    setTerminatingId(instanceId);
    labsService
      .adminTerminateInstance(instanceId)
      .then(() => {
        toast.success(`Instance ${instanceId} terminated.`);
        invalidate();
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string }).message ?? 'Could not terminate instance.');
      })
      .finally(() => {
        setTerminatingId(null);
        setPendingTerminateId(null);
      });
  };

  const instances = data?.instances ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const sortedInstances = useMemo(() => {
    const list = [...instances];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortCol) {
        case 'instanceId':
          valA = a.instanceId;
          valB = b.instanceId;
          break;
        case 'username':
          valA = (a.username ?? `user#${a.userId}`).toLowerCase();
          valB = (b.username ?? `user#${b.userId}`).toLowerCase();
          break;
        case 'labName':
          valA = (a.labName ?? `lab#${a.labId}`).toLowerCase();
          valB = (b.labName ?? `lab#${b.labId}`).toLowerCase();
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'assignedIp':
          valA = a.assignedIp ?? '';
          valB = b.assignedIp ?? '';
          break;
        case 'expiresAt':
          valA = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
          valB = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [instances, sortCol, sortDir]);

  if (isLoading) {
    return <AdminLabInstancesSkeleton />;
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title="Lab Instances"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            isLoading={isRefetching}
          >
            Refresh Fleet
          </Button>
        }
      />

      <Card>
        {/* Single-line responsive filter toolbar */}
        <div className="mb-4 flex items-center gap-1.5 w-full">
          <input
            id="instance-search"
            className="filter-input flex-1 min-w-0 transition-colors focus:border-accent"
            placeholder="Search lab name or username…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            id="instance-status"
            className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="running">running</option>
            <option value="pending">pending</option>
            <option value="stopped">stopped</option>
            <option value="terminated">terminated</option>
            <option value="error">error</option>
          </select>

          {(search || status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatus('');
                setPage(1);
              }}
              className="h-7 text-[0.6875rem] rounded-none px-2 shrink-0 transition-transform active:scale-[0.98]"
            >
              Reset
            </Button>
          )}
        </div>

        {isError ? (
          <ErrorState
            title="Could not load instances"
            message={error.message}
            onRetry={() => void refetch()}
            retrying={isRefetching}
          />
        ) : sortedInstances.length === 0 ? (
          <EmptyState title="No lab instances found" icon="server" />
        ) : (
          <>
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="text-[0.6875rem] text-muted">
                    <th
                      className="px-3 py-2 font-medium"
                      aria-sort={
                        sortCol === 'instanceId'
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleSort('instanceId')}
                        className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                      >
                        Instance ID{' '}
                        <SortIcon active={sortCol === 'instanceId'} direction={sortDir} />
                      </button>
                    </th>
                    <th
                      className="px-3 py-2 font-medium"
                      aria-sort={
                        sortCol === 'username'
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleSort('username')}
                        className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                      >
                        Learner <SortIcon active={sortCol === 'username'} direction={sortDir} />
                      </button>
                    </th>
                    <th
                      className="px-3 py-2 font-medium"
                      aria-sort={
                        sortCol === 'labName'
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleSort('labName')}
                        className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                      >
                        Lab <SortIcon active={sortCol === 'labName'} direction={sortDir} />
                      </button>
                    </th>
                    <th
                      className="px-3 py-2 font-medium"
                      aria-sort={
                        sortCol === 'status'
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleSort('status')}
                        className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                      >
                        Status <SortIcon active={sortCol === 'status'} direction={sortDir} />
                      </button>
                    </th>
                    <th
                      className="px-3 py-2 font-medium"
                      aria-sort={
                        sortCol === 'assignedIp'
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleSort('assignedIp')}
                        className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                      >
                        Assigned IP{' '}
                        <SortIcon active={sortCol === 'assignedIp'} direction={sortDir} />
                      </button>
                    </th>
                    <th
                      className="px-3 py-2 font-medium"
                      aria-sort={
                        sortCol === 'expiresAt'
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleSort('expiresAt')}
                        className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                      >
                        Expires <SortIcon active={sortCol === 'expiresAt'} direction={sortDir} />
                      </button>
                    </th>
                    <th className="px-3 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInstances.map((instance) => (
                    <tr
                      key={instance.instanceId}
                      className="hover:bg-surface/50 active:bg-surface-hover/60 transition-colors"
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                        #{instance.instanceId}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-semibold text-card-foreground">
                        {instance.username ?? `user#${instance.userId}`}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                        {instance.labName ?? `lab#${instance.labId ?? '?'}`}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs">
                        <span
                          className={
                            instance.status === 'running'
                              ? 'font-semibold text-success'
                              : 'text-muted'
                          }
                        >
                          {instance.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted">
                        {instance.assignedIp ?? '-'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted">
                        {instance.expiresAt ? new Date(instance.expiresAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-right">
                        {instance.status !== 'terminated' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setPendingTerminateId(instance.instanceId)}
                            isLoading={terminatingId === instance.instanceId}
                            disabled={terminatingId !== null}
                          >
                            Terminate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={pendingTerminateId !== null}
        title="Terminate instance?"
        message={`Instance ${pendingTerminateId ?? ''} will be terminated. This cannot be undone.`}
        confirmLabel="Terminate"
        isLoading={terminatingId !== null}
        onCancel={() => setPendingTerminateId(null)}
        onConfirm={() => {
          if (pendingTerminateId !== null) terminate(pendingTerminateId);
        }}
      />
    </div>
  );
}

export default AdminLabInstancesPage;
