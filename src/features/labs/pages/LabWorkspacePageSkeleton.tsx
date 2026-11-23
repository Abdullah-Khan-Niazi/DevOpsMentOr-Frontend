import type { CSSProperties } from 'react';
import { Skeleton } from '@/shared/components/Skeleton';

const SPLIT_STYLE = { '--lab-split': '34%' } as CSSProperties;

/**
 * Full-height DataCamp-style skeleton of the lab workspace: studio top bar
 * (exit + title left, outline pill center, XP badge right), light Scenario & Tasks
 * panel left, and dark terminal studio frame right.
 */
export function LabWorkspacePageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading lab workspace"
      aria-busy="true"
      data-testid="unified-lab-workspace"
      className="fixed inset-0 z-(--z-workspace) flex min-h-0 flex-col bg-paper"
    >
      <div className="relative flex h-12 shrink-0 items-center justify-between border-b border-border bg-pearl-100 px-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-7 rounded-sm" />
          <Skeleton className="h-4 w-44 max-w-full rounded-xs" />
        </div>
        <Skeleton className="hidden h-7 w-40 rounded-xs sm:block" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 rounded-xs" />
          <Skeleton className="h-4 w-12 rounded-xs" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div
          className="flex min-h-0 min-w-0 flex-col border-r border-border bg-card lg:w-(--lab-split) lg:shrink-0"
          style={SPLIT_STYLE}
        >
          <div className="flex h-11 shrink-0 items-center justify-between bg-paper/70 px-4">
            <Skeleton className="h-4 w-36 rounded-xs" />
            <Skeleton className="h-4 w-12 rounded-xs" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden p-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-full rounded-xs" />
              <Skeleton className="h-3.5 w-11/12 rounded-xs" />
              <Skeleton className="h-3.5 w-4/5 rounded-xs" />
            </div>
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-ink-deep max-lg:hidden">
          <div className="flex h-11 shrink-0 items-center justify-between px-3">
            <Skeleton className="h-7 w-64 rounded-sm opacity-20" />
            <Skeleton className="h-2 w-32 rounded-full opacity-20" />
            <Skeleton className="h-6 w-24 rounded-xs opacity-20" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-6">
            <Skeleton className="min-h-0 flex-1 rounded-sm opacity-15" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LabWorkspacePageSkeleton;
