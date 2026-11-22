import '../styles/moderation-admin.css';
import {
  Button,
  Card,
  ErrorState,
  EmptyState,
  Icon,
  type IconName,
  PageHeader,
  TabSwitcher,
  type TabSwitcherItem,
  toast,
} from '@/shared/components';
import { useUrlState } from '@/shared/hooks';
import { AdminReportsSkeleton } from './AdminReportsSkeleton';
import { useAdminReports } from '../hooks/useAdminModeration';
import type { ReportStatus } from '../types';

// SCR-F8-12: report queue. Resolve and dismiss per row; both are destructive
// status changes. The queue is read-only for everyone without
// `platform.content.moderate` (route guard and backend 403).

const REPORT_TAB_IDS = ['pending', 'reviewing', 'resolved', 'dismissed'] as const;
type ReportTab = (typeof REPORT_TAB_IDS)[number];

const REPORT_TABS: ReadonlyArray<TabSwitcherItem<ReportTab>> = [
  { id: 'pending', label: 'Pending' },
  { id: 'reviewing', label: 'Reviewing' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'dismissed', label: 'Dismissed' },
];

const REPORT_STATUS_ICON: Record<ReportStatus, IconName> = {
  pending: 'pending',
  reviewing: 'visibility',
  resolved: 'check-circle',
  dismissed: 'x-circle',
};

export function AdminReportsPage() {
  const [tab, setTab] = useUrlState<ReportTab>('tab', REPORT_TAB_IDS, 'pending');
  const { query, resolve: resolveReport, dismiss: dismissReport } = useAdminReports(tab, 1);

  return (
    <div className="moderation-admin-page">
      <PageHeader title="Report queue" />

      <TabSwitcher items={REPORT_TABS} value={tab} onChange={setTab} ariaLabel="Report status" />

      {query.isError ? (
        <ErrorState
          title="Could not load reports"
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isRefetching}
        />
      ) : query.isLoading ? (
        <AdminReportsSkeleton />
      ) : query.data && query.data.data.length > 0 ? (
        <div className="moderation-admin-page__list">
          {query.data.data.map((report) => (
            <Card key={report.reportId} className="moderation-item">
              <div className="moderation-item__head">
                <span className="moderation-item__author">
                  {report.reporter.fullName ?? `User ${report.reporter.userId}`}
                </span>
                <Icon
                  name={REPORT_STATUS_ICON[report.status]}
                  size={18}
                  title={report.status}
                  className="shrink-0 text-muted-foreground"
                />
              </div>
              <p className="moderation-item__meta flex flex-wrap items-center gap-3">
                <span>
                  {report.targetType} #{report.targetId}
                </span>
                <span>{report.reportReason}</span>
                <span>{new Date(report.createdAt).toLocaleString()}</span>
              </p>
              {report.description ? (
                <p className="moderation-item__content">{report.description}</p>
              ) : null}
              <div className="moderation-item__actions">
                {report.status !== 'resolved' && report.status !== 'dismissed' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        resolveReport.mutate(report.reportId, {
                          onSuccess: () => toast.success('Report resolved.'),
                          onError: () => toast.error('Could not resolve the report.'),
                        })
                      }
                      isLoading={
                        resolveReport.isPending && resolveReport.variables === report.reportId
                      }
                      disabled={resolveReport.isPending || dismissReport.isPending}
                    >
                      Resolve
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        dismissReport.mutate(report.reportId, {
                          onSuccess: () => toast.success('Report dismissed.'),
                          onError: () => toast.error('Could not dismiss the report.'),
                        })
                      }
                      isLoading={
                        dismissReport.isPending && dismissReport.variables === report.reportId
                      }
                      disabled={resolveReport.isPending || dismissReport.isPending}
                    >
                      Dismiss
                    </Button>
                  </>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon="flag" title="No reports in this view" />
      )}
    </div>
  );
}

export default AdminReportsPage;
