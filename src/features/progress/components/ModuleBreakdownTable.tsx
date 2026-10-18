import { useState, useMemo } from 'react';
import type { ModuleProgressSummary } from '../types';
import { ProgressBar } from './ProgressBar';

type SortColumn = 'moduleTitle' | 'completed' | 'progressPercentage' | 'status';
type SortDirection = 'asc' | 'desc';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100 font-bold' : 'opacity-30'}`}>
      {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
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
      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label="Module breakdown">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted font-mono">
              <th className="px-3 py-2 font-medium">Module</th>
              <th className="px-3 py-2 font-medium">Completed</th>
              <th className="px-3 py-2 font-medium">Progress</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 3 }, (_, index) => (
              <tr key={index} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-3">
                  <div className="h-3 w-1/2 rounded bg-border" />
                </td>
                <td className="px-3 py-3">
                  <div className="h-3 w-10 rounded bg-border" />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 rounded-sm bg-border" />
                    <div className="h-3 w-8 rounded bg-border" />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="h-3 w-14 rounded bg-border" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (modules.length === 0) {
    return <p className="py-6 text-sm text-muted font-mono">No progress recorded.</p>;
  }

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted font-mono">
            <th
              className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('moduleTitle')}
            >
              Module <SortIcon active={sortCol === 'moduleTitle'} direction={sortDir} />
            </th>
            <th
              className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('completed')}
            >
              Completed <SortIcon active={sortCol === 'completed'} direction={sortDir} />
            </th>
            <th
              className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('progressPercentage')}
            >
              Progress <SortIcon active={sortCol === 'progressPercentage'} direction={sortDir} />
            </th>
            <th
              className="px-3 py-2 font-medium cursor-pointer select-none hover:text-card-foreground"
              onClick={() => handleSort('status')}
            >
              Status <SortIcon active={sortCol === 'status'} direction={sortDir} />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
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
                      percentage={module.progressPercentage}
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
                <span
                  className={`px-2 py-0.5 rounded-sm ${
                    module.isCompleted
                      ? 'border border-border/80 text-card-foreground bg-pearl-200'
                      : 'border border-border/50 text-muted'
                  }`}
                >
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
