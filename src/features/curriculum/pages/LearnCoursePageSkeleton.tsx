import { Skeleton, SkeletonText } from '@/shared/components';

/** Course page placeholder: header with action, meta line, description, objectives and module rows. */
export function LearnCoursePageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading course" aria-busy="true">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Skeleton className="h-4 w-24 rounded-xs" />
        <Skeleton className="h-4 w-20 rounded-xs" />
        <Skeleton className="h-4 w-28 rounded-xs" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <SkeletonText lines={3} widths={['100%', '92%', '60%']} />

      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40 rounded-xs" />
        <div className="flex flex-col gap-1">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-56 rounded-xs" />
                <Skeleton className="h-3 w-24 rounded-xs" />
              </div>
              <Skeleton className="h-4 w-4 rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LearnCoursePageSkeleton;
