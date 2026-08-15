import { ACTIVITY_LABELS, formatActivityTime } from './activityFormat';
import type { ActivityLogDto } from '../types';

interface RecentActivityFeedProps {
  items: ActivityLogDto[];
  isLoading: boolean;
}

/** SCR-F5-01 widget: the last 5 learning activity entries. */
export function RecentActivityFeed({ items, isLoading }: RecentActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <div className="h-4 w-1/3 rounded bg-border" />
        <div className="h-3 w-full rounded bg-border" />
        <div className="h-3 w-5/6 rounded bg-border" />
        <div className="h-3 w-2/3 rounded bg-border" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Recent activity</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No activity yet. Start a lesson to begin tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-card-foreground">Recent activity</h2>
      <ul className="mt-4 space-y-3">
        {items.slice(0, 5).map((item) => (
          <li key={item.logId} className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-card-foreground">
              {ACTIVITY_LABELS[item.activityType] ?? item.activityType}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted">
              {formatActivityTime(item.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RecentActivityFeed;
