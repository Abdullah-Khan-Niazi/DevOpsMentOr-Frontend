import { Skeleton } from '@/shared/components/Skeleton';

/** Module page placeholder: header with outline action, progress bar, description and item rows. */
export function LearnModulePageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading module" aria-busy="true">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full rounded-xs" />
        <Skeleton className="h-4 w-2/3 rounded-xs" />
      </div>

      <div className="flex flex-col gap-1">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-5 w-5 rounded-xs" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-64 rounded-xs" />
              <Skeleton className="h-3 w-32 rounded-xs" />
            </div>
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LearnModulePageSkeleton;
