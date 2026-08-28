import '../styles/labs.css';
import { useState } from 'react';
import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageHeader,
  Pagination,
  toast,
} from '@/shared/components';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminLabInstances } from '../hooks';
import { labsService } from '../services';

const PAGE_SIZE = 20;

/** LAB-22: instance fleet — filter by status/search and force-terminate. */
export function AdminLabInstancesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useAdminLabInstances(
    page,
    PAGE_SIZE,
    status || undefined,
    search || undefined,
  );

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'lab-instances'] });
  };

  const terminate = (instanceId: number): void => {
    if (!window.confirm(`Terminate instance ${instanceId}? This cannot be undone.`)) {
      return;
    }
    labsService
      .adminTerminateInstance(instanceId)
      .then(() => {
        toast.success(`Instance ${instanceId} terminated.`);
        invalidate();
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string }).message ?? 'Could not terminate instance.');
      });
  };

  const instances = data?.instances ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Lab instances"
        description="Every provisioned environment across the platform."
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="input-label" htmlFor="instance-status">
              Status
            </label>
            <select
              id="instance-status"
              className="input-field"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="pending">pending</option>
              <option value="running">running</option>
              <option value="stopped">stopped</option>
              <option value="terminated">terminated</option>
              <option value="error">error</option>
            </select>
          </div>
          <div>
            <label className="input-label" htmlFor="instance-search">
              Search
            </label>
            <input
              id="instance-search"
              className="input-field w-64"
              placeholder="Lab name or username…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button variant="secondary" onClick={() => void refetch()}>
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState
            title="Could not load instances"
            message={error.message}
            onRetry={() => void refetch()}
          />
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Instance</th>
                  <th>User</th>
                  <th>Lab</th>
                  <th>Status</th>
                  <th>IP</th>
                  <th>Expires</th>
                  <th aria-label="actions" />
                </tr>
              </thead>
              <tbody>
                {instances.map((instance) => (
                  <tr key={instance.instanceId}>
                    <td>#{instance.instanceId}</td>
                    <td>{instance.username ?? `user#${instance.userId}`}</td>
                    <td>{instance.labName ?? `lab#${instance.labId ?? '?'}`}</td>
                    <td>{instance.status}</td>
                    <td>{instance.assignedIp ?? '—'}</td>
                    <td>
                      {instance.expiresAt ? new Date(instance.expiresAt).toLocaleString() : '—'}
                    </td>
                    <td>
                      {instance.status !== 'terminated' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => terminate(instance.instanceId)}
                        >
                          Terminate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}

export default AdminLabInstancesPage;
