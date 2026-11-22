import { PageSkeleton, Skeleton } from '@/shared/components';

/** Cohorts list: header with actions, search field and table rows. */
export function OrgClassesPageSkeleton() {
  return (
    <PageSkeleton label="Loading cohorts">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-40 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-sm" />
          <Skeleton className="h-8 w-28 rounded-sm" />
        </div>
      </div>
      <div className="flex w-full flex-col gap-4 rounded-lg border border-border p-6">
        <Skeleton className="h-10 w-full max-w-md rounded-sm" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex w-1/3 flex-col gap-1.5">
              <Skeleton className="h-4 w-2/3 rounded-xs" />
              <Skeleton className="h-3 w-1/3 rounded-xs" />
            </div>
            <Skeleton className="h-4 w-1/6 rounded-xs" />
            <Skeleton className="h-2 w-28 rounded-xs" />
            <Skeleton className="ml-auto h-3 w-20 rounded-xs" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}

export default OrgClassesPageSkeleton;
