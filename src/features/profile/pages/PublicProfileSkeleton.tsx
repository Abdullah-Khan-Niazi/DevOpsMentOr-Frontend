import { PageSkeleton, Skeleton } from '@/shared/components';

/** Public profile skeleton: header, cover, avatar, identity lines, counts and skills card. */
export function PublicProfileSkeleton() {
  return (
    <PageSkeleton label="Loading profile">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="overflow-hidden rounded-lg bg-card">
        <Skeleton className="h-28 w-full rounded-none sm:h-36" />
        <div className="space-y-3 px-5 pb-5">
          <Skeleton variant="circular" className="-mt-10 h-20 w-20 sm:-mt-12 sm:h-24 sm:w-24" />
          <Skeleton className="h-6 w-56 rounded-sm" />
          <Skeleton className="h-4 w-44 rounded-xs" />
          <Skeleton className="h-4 w-full max-w-2xl rounded-xs" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20 rounded-xs" />
            <Skeleton className="h-4 w-20 rounded-xs" />
          </div>
        </div>
      </div>
      <div className="space-y-4 rounded-md bg-card p-6">
        <Skeleton className="h-5 w-20 rounded-sm" />
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-4 rounded-xs"
              width={`${[96, 120, 80, 104, 88, 112][i]}px`}
            />
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}
