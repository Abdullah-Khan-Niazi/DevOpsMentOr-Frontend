import { Card, EmptyState, ErrorState, PageHeader } from '@/shared/components';
import { LoginHistorySkeleton } from './LoginHistorySkeleton';
import { useLoginHistory } from '@/features/auth/hooks';
import type { LoginHistoryEntry } from '@/features/auth/types';
import '@/shared/styles/app.css';
import './SettingsSecurity.css';

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function formatUserAgent(userAgent: string | null): string {
  if (!userAgent) return '-';
  return userAgent.length > 60 ? `${userAgent.slice(0, 60)}...` : userAgent;
}

export default function LoginHistoryPage() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useLoginHistory();

  if (isLoading) return <LoginHistorySkeleton />;

  return (
    <div>
      <PageHeader title="Login history" />

      <div className="settings-stack">
        <Card className="settings-card">
          <h2 className="settings-card__title">Recent activity</h2>

          {isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} retrying={isRefetching} />
          ) : null}

          {!isError && data && data.length === 0 ? (
            <EmptyState title="No login activity yet." icon="audit-logs" />
          ) : null}

          {!isError && data && data.length > 0 ? (
            <div className="admin-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Time</th>
                    <th scope="col">Method</th>
                    <th scope="col">Outcome</th>
                    <th scope="col">IP address</th>
                    <th scope="col">User agent</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((entry: LoginHistoryEntry) => (
                    <tr key={entry.loginId}>
                      <td className="admin-table__strong">{formatTime(entry.createdAt)}</td>
                      <td>{entry.loginType}</td>
                      <td>{entry.isSuccessful ? 'Success' : 'Failed'}</td>
                      <td>{entry.ipAddress ?? '-'}</td>
                      <td>{formatUserAgent(entry.userAgent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
