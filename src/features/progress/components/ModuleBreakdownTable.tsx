import type { ModuleProgressSummary } from '../types';
import { ProgressBar } from './ProgressBar';

interface ModuleBreakdownTableProps {
  modules: ModuleProgressSummary[];
  isLoading: boolean;
}

/** SCR-F5-05: module-by-module completion breakdown. */
export function ModuleBreakdownTable({ modules, isLoading }: ModuleBreakdownTableProps) {
  if (isLoading) {
    return (
      <table className="w-full text-left text-sm" aria-label="Module breakdown">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
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
                  <div className="h-2 w-32 rounded-full bg-border" />
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
    );
  }

  if (modules.length === 0) {
    return <p className="py-6 text-sm text-muted">No progress recorded.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
          <th className="px-3 py-2 font-medium">Module</th>
          <th className="px-3 py-2 font-medium">Completed</th>
          <th className="px-3 py-2 font-medium">Progress</th>
          <th className="px-3 py-2 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {modules.map((module) => (
          <tr key={module.moduleId} className="border-b border-border/60 last:border-0">
            <td className="px-3 py-2.5 font-medium text-card-foreground">{module.moduleTitle}</td>
            <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
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
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {module.progressPercentage}%
                </span>
              </div>
            </td>
            <td className="px-3 py-2.5 text-muted-foreground">
              {module.isCompleted ? 'Completed' : 'In progress'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ModuleBreakdownTable;
