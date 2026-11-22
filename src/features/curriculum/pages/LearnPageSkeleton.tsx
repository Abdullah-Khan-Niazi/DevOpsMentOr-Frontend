import { Skeleton } from '@/shared/components';

/** Learn hub placeholder at full page size: header, search and tab toolbar, then six course cards. */
export function LearnPageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading learn" aria-busy="true">
      <Skeleton className="h-8 w-28 rounded-md" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-10 w-full rounded-sm sm:w-72" />
        <Skeleton className="h-10 w-64 rounded-md" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <Skeleton className="aspect-video w-full rounded-md" />
            <Skeleton className="h-5 w-3/4 rounded-xs" />
            <Skeleton className="h-4 w-1/2 rounded-xs" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LearnPageSkeleton;
