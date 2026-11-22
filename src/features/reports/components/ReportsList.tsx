import type { Report } from '../types';

interface ReportsListProps {
  reports: Report[];
}

export function ReportsList({ reports }: ReportsListProps) {
  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li
          key={report.id}
          className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3"
        >
          <div>
            <h3 className="font-medium text-card-foreground">{report.title}</h3>
            <p className="text-xs text-muted">
              Updated {new Date(report.updatedAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`text-sm font-medium capitalize ${
              report.status === 'published'
                ? 'text-success'
                : report.status === 'archived'
                  ? 'text-muted-foreground'
                  : 'text-warning'
            }`}
          >
            {report.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
