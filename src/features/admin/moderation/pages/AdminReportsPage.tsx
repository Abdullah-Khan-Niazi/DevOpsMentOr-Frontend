import '../styles/moderation-admin.css';
import { useState } from 'react';
import {
  Button,
  Card,
  ErrorState,
  EmptyState,
  LoadingState,
  PageHeader,
  TabRow,
  toast,
} from '@/shared/components';
import { useAdminReports } from '../hooks/useAdminModeration';

// SCR-F8-12: report queue — resolve/dismiss per row. Both actions are
// destructive status changes; the queue is read-only for everyone without
// `platform.content.moderate` (route guard + backend 403).

const REPORT_TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'reviewing', label: 'Reviewing' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'dismissed', label: 'Dismissed' },
] as const;

type ReportTab = (typeof REPORT_TABS)[number]['id'];

export function AdminReportsPage() {
  const [tab, setTab] = useState<ReportTab>('pending');
  const { query, resolve: resolveReport, dismiss: dismissReport } = useAdminReports(tab, 1);

  return (
    <div className="moderation-admin-page">
      <PageHeader
        title="Report queue"
        description="Review learner reports and resolve or dismiss each item."
      />

      <TabRow items={[...REPORT_TABS]} activeId={tab} onChange={(id) => setTab(id as ReportTab)} />

      {query.isError ? (
        <ErrorState title="Could not load reports" message="Please try again later." />
      ) : query.isLoading ? (
        <LoadingState />
      ) : query.data && query.data.data.length > 0 ? (
        <div className="moderation-admin-page__list">
          {query.data.data.map((report) => (
            <Card key={report.reportId} className="moderation-item">
              <div className="moderation-item__head">
                <span className="moderation-item__author">
                  {report.reporter.fullName ?? `User ${report.reporter.userId}`}
                </span>
                <span className="moderation-item__badge" data-pending={report.status === 'pending'}>
                  {report.status}
                </span>
              </div>
              <p className="moderation-item__meta">
                {report.targetType} #{report.targetId} · {report.reportReason} ·{' '}
                {new Date(report.createdAt).toLocaleString()}
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
        <EmptyState title="No reports in this view." />
      )}
    </div>
  );
}

export default AdminReportsPage;
