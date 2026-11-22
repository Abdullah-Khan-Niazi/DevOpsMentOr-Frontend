import { Skeleton } from '@/shared/components';

/** Assignments tab: assign-course form card and assignment cards. */
export function ClassAssignmentsPanelSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6" role="status" aria-label="Loading assignments">
      <div className="flex flex-col gap-4 rounded-lg border border-border p-6">
        <Skeleton className="h-5 w-40 rounded-xs" />
        <div className="grid gap-4 lg:grid-cols-[2fr_1.4fr_auto_auto]">
          <Skeleton className="h-10 w-full rounded-sm" />
          <Skeleton className="h-10 w-full rounded-sm" />
          <Skeleton className="h-10 w-24 rounded-sm" />
          <Skeleton className="h-10 w-32 rounded-sm" />
        </div>
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-1/3 rounded-xs" />
              <Skeleton className="h-3 w-1/4 rounded-xs" />
            </div>
            <Skeleton className="h-4 w-16 rounded-xs" />
          </div>
          <Skeleton className="h-3 w-40 rounded-xs" />
        </div>
      ))}
    </div>
  );
}

export default ClassAssignmentsPanelSkeleton;
