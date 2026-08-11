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
          className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
        >
          <div>
            <h3 className="font-medium text-card-foreground">{report.title}</h3>
            <p className="text-xs text-muted">
              Updated {new Date(report.updatedAt).toLocaleString()}
            </p>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs capitalize text-muted-foreground">
            {report.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
