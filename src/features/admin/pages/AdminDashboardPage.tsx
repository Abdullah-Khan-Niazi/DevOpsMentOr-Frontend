import { Card, ErrorState, PageHeader } from '@/shared/components';
import { useAdminDashboard } from '../hooks';

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useAdminDashboard();

  return (
    <div>
      <PageHeader
        title="Platform dashboard"
        description="High-level platform KPIs and recent administrative activity."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          message={error?.message ?? 'Unable to load the dashboard.'}
          onRetry={() => void refetch()}
        />
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Individual learners" value={data.kpis.totalIndividualLearners} />
            <KpiCard label="Organizations" value={data.kpis.totalOrganizations} />
            <KpiCard label="Active learners" value={data.kpis.activeLearners} />
            <KpiCard
              label="Labs completed"
              value={data.kpis.labsCompleted === null ? '—' : String(data.kpis.labsCompleted)}
              muted={data.kpis.labsCompleted === null}
            />
          </div>

          <Card className="mt-6">
            <h2 className="mb-3 text-base font-semibold text-card-foreground">
              Recent admin activity
            </h2>
            {data.recentAuditLogs.length === 0 ? (
              <p className="text-sm text-muted">No administrative actions recorded yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Admin</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                    <th className="px-3 py-2 font-medium">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAuditLogs.map((log) => (
                    <tr key={log.logId} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2">{formatDate(log.createdAt)}</td>
                      <td className="px-3 py-2">{log.adminFullName ?? log.adminEmail}</td>
                      <td className="px-3 py-2 text-muted-foreground">{log.action}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {log.targetType ?? '—'}
                        {log.targetId ? ` #${log.targetId}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string | number;
  muted?: boolean;
}) {
  return (
    <Card className="flex flex-col justify-between p-4">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`mt-1 text-3xl font-semibold ${muted ? 'text-muted-foreground' : 'text-card-foreground'}`}
      >
        {value}
      </p>
    </Card>
  );
}

export default AdminDashboardPage;
