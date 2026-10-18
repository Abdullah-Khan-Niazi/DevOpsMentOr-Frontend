import { useState, useEffect } from 'react';
import { Button, Card, ErrorState, PageHeader, Pagination, Skeleton } from '@/shared/components';
import { useAdminAuditLogs, useAdminAuditMetadata } from '../hooks';

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

interface AppliedFilters {
  page: number;
  search: string;
  action: string;
  targetType: string;
  from: string;
  to: string;
}

export function AdminAuditLogsPage() {
  const [draftSearch, setDraftSearch] = useState('');
  const [filters, setFilters] = useState<AppliedFilters>({
    page: 1,
    search: '',
    action: '',
    targetType: '',
    from: '',
    to: '',
  });

  const { data: metadata } = useAdminAuditMetadata();

  // Debounced search input
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = draftSearch.trim();
      if (trimmed !== filters.search) {
        setFilters((prev) => ({ ...prev, search: trimmed, page: 1 }));
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [draftSearch, filters.search]);

  const { data, isLoading, isError, error, refetch } = useAdminAuditLogs({
    page: filters.page,
    pageSize: PAGE_SIZE,
    search: filters.search || undefined,
    action: filters.action || undefined,
    targetType: filters.targetType || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  });

  const updateFilter = (patch: Partial<AppliedFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  };

  const resetFilters = () => {
    setDraftSearch('');
    setFilters({
      page: 1,
      search: '',
      action: '',
      targetType: '',
      from: '',
      to: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.action ||
    filters.targetType ||
    filters.from ||
    filters.to
  );

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader title="Audit Logs" />

      <Card>
        {/* Single Responsive Filter Toolbar — No Apply Button */}
        <div className="mb-4 flex items-center gap-1.5 w-full">
          <input
            id="audit-search"
            className="filter-input flex-1 min-w-0 transition-colors focus:border-accent"
            placeholder="Search admin, action, IP…"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
          />

          <select
            id="audit-action"
            className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
            value={filters.action}
            onChange={(e) => updateFilter({ action: e.target.value })}
          >
            <option value="">All actions</option>
            {metadata?.actions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          <select
            id="audit-target-type"
            className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
            value={filters.targetType}
            onChange={(e) => updateFilter({ targetType: e.target.value })}
          >
            <option value="">All targets</option>
            {metadata?.targetTypes.map((tt) => (
              <option key={tt} value={tt}>
                {tt}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-muted uppercase shrink-0">From:</span>
            <input
              id="audit-from"
              type="date"
              className="filter-input w-24 transition-colors focus:border-accent"
              value={filters.from}
              onChange={(e) => updateFilter({ from: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-muted uppercase shrink-0">To:</span>
            <input
              id="audit-to"
              type="date"
              className="filter-input w-24 transition-colors focus:border-accent"
              value={filters.to}
              onChange={(e) => updateFilter({ to: e.target.value })}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 text-[11px] rounded-none px-2 shrink-0 transition-transform active:scale-[0.98]"
             
            >
              Reset
            </Button>
          )}
        </div>

        {isError ? (
          <ErrorState
            message={error?.message ?? 'Unable to load audit logs.'}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <div className="w-full max-w-full overflow-x-auto">
            <div className="divide-y divide-border/60">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-3">
                  <Skeleton className="h-4 w-28 rounded-xs" />
                  <div className="space-y-1.5 w-1/4">
                    <Skeleton className="h-4 w-32 rounded-xs" />
                    <Skeleton className="h-3 w-40 rounded-xs" />
                  </div>
                  <Skeleton className="h-4 w-24 rounded-xs" />
                  <Skeleton className="h-4 w-20 rounded-xs" />
                  <Skeleton className="h-4 w-28 rounded-xs" />
                  <Skeleton className="h-4 w-36 rounded-xs" />
                </div>
              ))}
            </div>
          </div>
        ) : data && data.data.length === 0 ? (
          <p className="py-6 text-sm text-muted font-mono">No audit logs found matching criteria.</p>
        ) : data ? (
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Timestamp</th>
                  <th className="px-3 py-2 font-medium">Actor</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 font-medium">Target</th>
                  <th className="px-3 py-2 font-medium">IP Address</th>
                  <th className="px-3 py-2 font-medium">Changes Payload</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((log) => (
                  <tr key={log.logId} className="border-b border-border/60 last:border-0 hover:bg-surface/50 active:bg-surface-hover/60 transition-colors">
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="font-semibold text-card-foreground">
                        {log.adminFullName ?? log.adminEmail}
                      </div>
                      {log.adminFullName && log.adminEmail && (
                        <div className="text-[10px] text-muted">{log.adminEmail}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-semibold text-card-foreground text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {log.targetType ? (
                        <span>
                          {log.targetType}
                          {log.targetId ? ` #${log.targetId}` : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted">
                      {log.ipAddress ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 max-w-xs truncate">
                      {log.changes ? (
                        <span className="text-xs text-muted-foreground truncate block max-w-sm font-mono">
                          {typeof log.changes === 'string' ? log.changes : JSON.stringify(log.changes)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {data && data.totalPages > 1 && (
          <div className="mt-4 pt-3 border-t border-border/60">
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              totalPages={data.totalPages}
              onPageChange={(next) => updateFilter({ page: next })}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

export default AdminAuditLogsPage;
