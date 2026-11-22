import { Skeleton, SkeletonText } from '@/shared/components';

/** Review list skeleton: rating histogram and review cards. */
export function ReviewSectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading reviews">
      <div className="grid gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-3">
            <Skeleton className="h-3.5 w-8 rounded-xs" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-5 rounded-xs" />
          </div>
        ))}
      </div>
      <div className="grid gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="space-y-3 rounded-md bg-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-28 rounded-xs" />
              <Skeleton className="h-4 w-20 rounded-xs" />
              <Skeleton className="ml-auto h-3 w-16 rounded-xs" />
            </div>
            <Skeleton className="h-4 w-2/5 rounded-xs" />
            <SkeletonText lines={2} />
          </div>
        ))}
      </div>
    </div>
  );
}
