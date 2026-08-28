import { ACTIVITY_LABELS, formatDateTime } from './activityFormat';
import type { ActivityLogDto } from '../types';

interface ActivityLogTableProps {
  items: ActivityLogDto[];
  isLoading: boolean;
}

/** SCR-F5-05: paginated activity history table (no inner scroll). */
export function ActivityLogTable({ items, isLoading }: ActivityLogTableProps) {
  if (isLoading) {
    return (
      <table className="w-full text-left text-sm" aria-label="Activity log">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2 font-medium">Event</th>
            <th className="px-3 py-2 font-medium">When</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 3 }, (_, index) => (
            <tr key={index} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-3">
                <div className="h-3 w-2/3 rounded bg-border" />
              </td>
              <td className="px-3 py-3">
                <div className="h-3 w-24 rounded bg-border" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (items.length === 0) {
    return <p className="py-6 text-sm text-muted">No activity recorded yet.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
          <th className="px-3 py-2 font-medium">Event</th>
          <th className="px-3 py-2 font-medium">When</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.logId} className="border-b border-border/60 last:border-0">
            <td className="px-3 py-2.5 text-card-foreground">
              {ACTIVITY_LABELS[item.activityType] ?? item.activityType}
            </td>
            <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
              {formatDateTime(item.createdAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ActivityLogTable;
