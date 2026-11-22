import { PageSkeleton, Skeleton, SkeletonCircle } from '@/shared/components';

/** Report queue cards (header and status tabs above stay live). */
export function AdminReportsSkeleton() {
  return (
    <PageSkeleton label="Loading reports">
      <div className="moderation-admin-page__list">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-md bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-40 rounded-sm" />
              <SkeletonCircle size={18} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-3 w-20 rounded-xs" />
              <Skeleton className="h-3 w-28 rounded-xs" />
              <Skeleton className="h-3 w-32 rounded-xs" />
            </div>
            <Skeleton className="h-4 w-full max-w-xl rounded-xs" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
