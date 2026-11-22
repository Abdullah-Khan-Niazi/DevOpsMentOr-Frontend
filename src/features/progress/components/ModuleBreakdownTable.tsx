import { useState, useMemo } from 'react';
import { EmptyState, Icon, Skeleton } from '@/shared/components';
import type { ModuleProgressSummary } from '../types';
import { ProgressBar } from '@/shared/components/ProgressBar';

type SortColumn = 'moduleTitle' | 'completed' | 'progressPercentage' | 'status';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span
      className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100 font-bold' : 'opacity-30'}`}
    >
      <Icon name={active ? (direction === 'asc' ? 'arrow-up' : 'arrow-down') : 'sort'} size={14} />
    </span>
  );
}

interface ModuleBreakdownTableProps {
  modules: ModuleProgressSummary[];
  isLoading: boolean;
}

/** SCR-F5-05: module-by-module completion breakdown with column sorting. */
export function ModuleBreakdownTable({ modules, isLoading }: ModuleBreakdownTableProps) {
  const [sortCol, setSortCol] = useState<SortColumn>('moduleTitle');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortedModules = useMemo(() => {
    const list = [...modules];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortCol) {
        case 'moduleTitle':
          valA = a.moduleTitle.toLowerCase();
          valB = b.moduleTitle.toLowerCase();
          break;
        case 'completed':
          valA = a.completedLessons;
          valB = b.completedLessons;
          break;
        case 'progressPercentage':
          valA = a.progressPercentage;
          valB = b.progressPercentage;
          break;
        case 'status':
          valA = a.isCompleted ? 1 : 0;
          valB = b.isCompleted ? 1 : 0;
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [modules, sortCol, sortDir]);

  if (isLoading) {
    return (
      <div
        className="w-full max-w-full overflow-x-auto"
        role="status"
        aria-label="Loading module breakdown"
      >
        <table className="w-full text-left text-sm" aria-hidden="true">
          <thead>
            <tr className="text-xs text-muted">
              <th className="px-3 py-2 font-medium">Module</th>
              <th className="px-3 py-2 font-medium">Completed</th>
              <th className="px-3 py-2 font-medium">Progress</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 3 }, (_, index) => (
              <tr key={index}>
                <td className="px-3 py-3">
                  <Skeleton className="h-3 w-1/2 rounded-xs" />
                </td>
                <td className="px-3 py-3">
                  <Skeleton className="h-3 w-10 rounded-xs" />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-2 w-32 rounded-full" />
                    <Skeleton className="h-3 w-8 rounded-xs" />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Skeleton className="h-3 w-14 rounded-xs" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (modules.length === 0) {
    return <EmptyState title="No progress recorded." icon="module" />;
  }

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="text-xs text-muted">
            <th
              className="px-3 py-2 font-medium"
              aria-sort={
                sortCol === 'moduleTitle'
                  ? sortDir === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('moduleTitle')}
                className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
              >
                Module <SortIcon active={sortCol === 'moduleTitle'} direction={sortDir} />
              </button>
            </th>
            <th
              className="px-3 py-2 font-medium"
              aria-sort={
                sortCol === 'completed' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('completed')}
                className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
              >
                Completed <SortIcon active={sortCol === 'completed'} direction={sortDir} />
              </button>
            </th>
            <th
              className="px-3 py-2 font-medium"
              aria-sort={
                sortCol === 'progressPercentage'
                  ? sortDir === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('progressPercentage')}
                className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
              >
                Progress <SortIcon active={sortCol === 'progressPercentage'} direction={sortDir} />
              </button>
            </th>
            <th
              className="px-3 py-2 font-medium"
              aria-sort={
                sortCol === 'status' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <button
                type="button"
                onClick={() => handleSort('status')}
                className="inline-flex cursor-pointer select-none items-center rounded-sm hover:text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
              >
                Status <SortIcon active={sortCol === 'status'} direction={sortDir} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedModules.map((module) => (
            <tr key={module.moduleId} className="hover:bg-surface/60 transition-colors">
              <td className="px-3 py-2.5 font-medium text-card-foreground">{module.moduleTitle}</td>
              <td className="px-3 py-2.5 tabular-nums text-muted font-mono">
                {module.completedLessons}/{module.totalLessons}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-32">
                    <ProgressBar
                      value={module.progressPercentage}
                      label={`${module.moduleTitle} progress`}
                      size="sm"
                    />
                  </div>
                  <span className="shrink-0 tabular-nums text-xs font-mono text-muted">
                    {module.progressPercentage}%
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-xs font-mono">
                <span className={module.isCompleted ? 'text-success' : 'text-muted'}>
                  {module.isCompleted ? 'Completed' : 'In progress'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ModuleBreakdownTable;
