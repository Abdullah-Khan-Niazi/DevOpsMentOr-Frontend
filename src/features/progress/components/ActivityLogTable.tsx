import { useState, useMemo } from 'react';
import { ACTIVITY_LABELS, formatDateTime } from './activityFormat';
import type { ActivityLogDto } from '../types';

type SortColumn = 'event' | 'when';

interface ActivityLogTableProps {
  items: ActivityLogDto[];
  isLoading: boolean;
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5 text-muted/60 group-hover:text-muted transition-colors shrink-0"
        aria-hidden="true"
      >
        <path d="m5 10 3 3 3-3M5 6l3-3 3 3" />
      </svg>
    );
  }
  if (direction === 'asc') {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5 text-ink transition-transform shrink-0"
        aria-hidden="true"
      >
        <path d="M8 13V3M4 7l4-4 4 4" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5 text-ink transition-transform shrink-0"
      aria-hidden="true"
    >
      <path d="M8 3v10m-4-4 4 4 4-4" />
    </svg>
  );
}

/** SCR-F5-05: paginated activity history table with column sorting. */
export function ActivityLogTable({ items, isLoading }: ActivityLogTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('when');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedItems = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortColumn === 'event') {
        const labelA = ACTIVITY_LABELS[a.activityType] ?? a.activityType;
        const labelB = ACTIVITY_LABELS[b.activityType] ?? b.activityType;
        cmp = labelA.localeCompare(labelB);
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [items, sortColumn, sortDirection]);

  if (isLoading) {
    return (
      <div className="w-full max-w-full overflow-x-auto">
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
                  <div className="h-3 w-2/3 rounded-sm bg-border animate-pulse" />
                </td>
                <td className="px-3 py-3">
                  <div className="h-3 w-24 rounded-sm bg-border animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="py-6 text-sm text-muted">No activity recorded yet.</p>;
  }

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th
              aria-sort={sortColumn === 'event' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              className="px-3 py-2 font-medium"
            >
              <button
                type="button"
                onClick={() => handleSort('event')}
                className="group inline-flex items-center gap-1.5 transition-colors hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink rounded-sm"
              >
                <span>Event</span>
                <SortIcon active={sortColumn === 'event'} direction={sortDirection} />
              </button>
            </th>
            <th
              aria-sort={sortColumn === 'when' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              className="px-3 py-2 font-medium"
            >
              <button
                type="button"
                onClick={() => handleSort('when')}
                className="group inline-flex items-center gap-1.5 transition-colors hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink rounded-sm"
              >
                <span>When</span>
                <SortIcon active={sortColumn === 'when'} direction={sortDirection} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {sortedItems.map((item) => (
            <tr key={item.logId} className="hover:bg-surface/50 transition-colors">
              <td className="px-3 py-2.5 text-card-foreground">
                {ACTIVITY_LABELS[item.activityType] ?? item.activityType}
              </td>
              <td className="px-3 py-2.5 tabular-nums text-muted font-mono text-xs">
                {formatDateTime(item.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ActivityLogTable;
