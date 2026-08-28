import type { ModuleProgressSummary } from '../types';
import { ProgressBar } from './ProgressBar';

interface ModuleProgressListProps {
  modules: ModuleProgressSummary[];
  isLoading: boolean;
}

/** SCR-F5-01 widget: one mini progress bar per module (ordered). */
export function ModuleProgressList({ modules, isLoading }: ModuleProgressListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="h-4 w-1/3 rounded bg-border" />
        <div className="h-2 w-full rounded-full bg-border" />
        <div className="h-2 w-3/4 rounded-full bg-border" />
        <div className="h-2 w-1/2 rounded-full bg-border" />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Module progress</h2>
        <p className="mt-2 text-sm text-muted-foreground">No modules published yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-card-foreground">Module progress</h2>
      <ul className="mt-4 space-y-4">
        {modules.map((module) => (
          <li key={module.moduleId}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-card-foreground">
                {module.moduleTitle}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {module.completedLessons}/{module.totalLessons}
              </span>
            </div>
            <ProgressBar
              percentage={module.progressPercentage}
              label={`${module.moduleTitle} progress`}
              size="sm"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ModuleProgressList;
