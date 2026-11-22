import { useState, useMemo } from 'react';
import { ACTIVITY_LABELS, formatDateTime } from './activityFormat';
import type { ActivityLogDto } from '../types';
import { Button, EmptyState, Icon, Skeleton } from '@/shared/components';

type SortColumn = 'event' | 'when';

interface ActivityLogTableProps {
  items: ActivityLogDto[];
  isLoading: boolean;
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) {
    return (
      <Icon
        name="sort"
        size={14}
        className="w-3.5 h-3.5 text-muted/60 group-hover:text-muted transition-colors shrink-0"
      />
    );
  }
  if (direction === 'asc') {
    return (
      <Icon
        name="arrow-up"
        size={14}
        className="w-3.5 h-3.5 text-ink transition-transform shrink-0"
      />
    );
  }
  return (
    <Icon
      name="arrow-down"
      size={14}
      className="w-3.5 h-3.5 text-ink transition-transform shrink-0"
    />
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
      <div
        className="w-full max-w-full overflow-x-auto"
        role="status"
        aria-label="Loading activity log"
      >
        <table className="w-full text-left text-sm" aria-hidden="true">
          <thead>
            <tr className="text-xs text-muted">
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="px-3 py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 3 }, (_, index) => (
              <tr key={index}>
                <td className="px-3 py-3">
                  <Skeleton className="h-3 w-2/3 rounded-xs" />
                </td>
                <td className="px-3 py-3">
                  <Skeleton className="h-3 w-24 rounded-xs" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState title="No activity recorded yet." icon="history" />;
  }

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th
              aria-sort={
                sortColumn === 'event'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
              className="px-3 py-2 font-medium"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('event')}
                className="group"
              >
                <span>Event</span>
                <SortIcon active={sortColumn === 'event'} direction={sortDirection} />
              </Button>
            </th>
            <th
              aria-sort={
                sortColumn === 'when'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
              className="px-3 py-2 font-medium"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('when')}
                className="group"
              >
                <span>When</span>
                <SortIcon active={sortColumn === 'when'} direction={sortDirection} />
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>
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
