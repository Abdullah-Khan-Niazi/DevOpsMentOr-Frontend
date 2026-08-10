import { useState } from 'react';
import { Card, ErrorState, PageHeader, Pagination, toast } from '@/shared/components';
import { useAdminAuditLogs } from '../hooks';

const PAGE_SIZE = 25;

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ACTION_OPTIONS = ['ban_user', 'unban_user', 'delete_user', 'update_setting'] as const;

interface AppliedFilters {
  page: number;
  action: string;
  from: string;
  to: string;
}

export function AdminAuditLogsPage() {
  const [draft, setDraft] = useState<AppliedFilters>({ page: 1, action: '', from: '', to: '' });
  const [filters, setFilters] = useState<AppliedFilters>({ page: 1, action: '', from: '', to: '' });

  const { data, isLoading, isError, error, refetch } = useAdminAuditLogs({
    page: filters.page,
    pageSize: PAGE_SIZE,
    action: filters.action || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  });

  const applyFilters = (next: Partial<AppliedFilters>) => {
    const candidate = { ...draft, ...next };
    if (candidate.from && candidate.to && new Date(candidate.from) > new Date(candidate.to)) {
      toast.error('"From" must be before "To" (max 90-day range).');
      return;
    }
    if (candidate.from && candidate.to) {
      const rangeDays =
        (new Date(candidate.to).getTime() - new Date(candidate.from).getTime()) / 86_400_000;
      if (rangeDays > 90) {
        toast.error('Date range is limited to 90 days.');
        return;
      }
    }
    setFilters(candidate);
    void refetch();
  };

  const applySearch = () => applyFilters({ page: 1 });

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Every administrative action on the platform, with before/after changes."
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="audit-action" className="input-label">
              Action
            </label>
            <select
              id="audit-action"
              className="input-field"
              value={draft.action}
              onChange={(e) => setDraft((prev) => ({ ...prev, action: e.target.value }))}
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="audit-from" className="input-label">
              From
            </label>
            <input
              id="audit-from"
              type="date"
              className="input-field"
              value={draft.from}
              onChange={(e) => setDraft((prev) => ({ ...prev, from: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="audit-to" className="input-label">
              To
            </label>
            <input
              id="audit-to"
              type="date"
              className="input-field"
              value={draft.to}
              onChange={(e) => setDraft((prev) => ({ ...prev, to: e.target.value }))}
            />
          </div>

          <button
            type="button"
            onClick={applySearch}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Apply
          </button>
        </div>

        {isError ? (
          <ErrorState
            message={error?.message ?? 'Unable to load audit logs.'}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <div className="space-y-2 py-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-slate-200" />
            ))}
          </div>
        ) : data && data.data.length === 0 ? (
          <p className="py-6 text-sm text-slate-500">No audit logs found.</p>
        ) : data ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Admin</th>
                <th className="px-3 py-2 font-medium">Action</th>
                <th className="px-3 py-2 font-medium">Target</th>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">Changes</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((log) => (
                <tr key={log.logId} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">{formatDate(log.createdAt)}</td>
                  <td className="px-3 py-2">{log.adminFullName ?? log.adminEmail}</td>
                  <td className="px-3 py-2 text-slate-700">{log.action}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {log.targetType ?? '—'}
                    {log.targetId ? ` #${log.targetId}` : ''}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{log.ipAddress ?? '—'}</td>
                  <td className="px-3 py-2">
                    {log.changes ? (
                      <code className="text-xs text-slate-600">{JSON.stringify(log.changes)}</code>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {data ? (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            totalPages={data.totalPages}
            onPageChange={(next) => applyFilters({ page: next })}
          />
        ) : null}
      </Card>
    </div>
  );
}

export default AdminAuditLogsPage;
