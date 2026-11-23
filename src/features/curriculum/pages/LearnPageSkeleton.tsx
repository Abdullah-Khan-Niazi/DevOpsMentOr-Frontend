import { Skeleton } from '@/shared/components/Skeleton';

/** Learn hub placeholder: header, search + filter row, active hero and 4 course accordion items. */
export function LearnPageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading learn" aria-busy="true">
      <Skeleton className="h-8 w-28 rounded-md" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-10 w-full rounded-sm sm:w-80" />
        <Skeleton className="h-10 w-72 rounded-md" />
      </div>
      <div className="flex flex-col justify-between gap-6 rounded-xl border border-paper-line bg-pearl-100 p-6 sm:flex-row sm:items-center sm:p-7">
        <div className="flex flex-1 items-center gap-4">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-36 rounded-xs" />
            <Skeleton className="h-7 w-72 max-w-full rounded-sm" />
            <Skeleton className="h-2 w-64 max-w-full rounded-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-36 shrink-0 rounded-md" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 rounded-lg border border-paper-line bg-pearl-100 px-6 py-5"
          >
            <div className="flex flex-1 items-center gap-3.5">
              <Skeleton className="size-5 rounded-xs" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-64 max-w-full rounded-xs" />
                <Skeleton className="h-3.5 w-44 rounded-xs" />
              </div>
            </div>
            <Skeleton className="h-8 w-28 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LearnPageSkeleton;
