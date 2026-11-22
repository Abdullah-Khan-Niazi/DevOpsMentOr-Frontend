import type { CSSProperties } from 'react';
import { Skeleton } from '@/shared/components';

/** Step segments in the header, mirroring the StepIndicator of a typical lab. */
const SEGMENT_COUNT = 5;

/** Default split of the real page (`lab-split` is only a per-user convenience). */
const SPLIT_STYLE = { '--lab-split': '42%' } as CSSProperties;

/**
 * Full-height two-pane skeleton of the lab workspace: the steps pane (header with step
 * segments, scenario, step title, instructions, check button) and the environment pane
 * (tab row, terminal frame). Stacked below 1024 px like the real page.
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
      <div className="shrink-0 px-5 pt-3 lg:hidden">
        <Skeleton className="h-9 w-full max-w-xs rounded-md" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div
          className="flex min-h-0 min-w-0 flex-col max-lg:flex-1 lg:w-(--lab-split) lg:shrink-0"
          style={SPLIT_STYLE}
        >
          <div className="flex shrink-0 flex-col gap-4 px-5 pt-5 pb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-6 w-48 max-w-full rounded-xs" />
            </div>
            <div className="flex w-full items-center gap-1">
              {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
                <div key={index} className="flex min-w-0 flex-1 items-center py-2.5">
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-4 w-40 rounded-xs" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-5 pt-1 pb-8">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-24 rounded-xs" />
              <Skeleton className="h-3.5 w-full rounded-xs" />
              <Skeleton className="h-3.5 w-11/12 rounded-xs" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-7 w-2/3 rounded-xs" />
              <Skeleton className="h-3.5 w-full rounded-xs" />
              <Skeleton className="h-3.5 w-10/12 rounded-xs" />
              <Skeleton className="h-28 w-full rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col max-lg:hidden">
          <div className="shrink-0 px-4 pt-4 pb-3">
            <Skeleton className="h-9 w-72 max-w-full rounded-md" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <Skeleton className="min-h-0 flex-1 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LabWorkspacePageSkeleton;
