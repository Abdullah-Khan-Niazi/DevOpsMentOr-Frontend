import { PageSkeleton, Skeleton } from '@/shared/components';

/** Organizations table rows (header, filters and card shell stay live). */
export function AdminOrganizationsSkeleton() {
  return (
    <PageSkeleton label="Loading organizations">
      <div className="w-full max-w-full overflow-x-auto">
        <div className="flex items-center justify-between px-3 py-2">
          <Skeleton className="h-3 w-24 rounded-xs" />
          <Skeleton className="h-3 w-12 rounded-xs" />
          <Skeleton className="h-3 w-16 rounded-xs" />
          <Skeleton className="h-3 w-16 rounded-xs" />
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-3">
            <div className="w-1/3 space-y-1.5">
              <Skeleton className="h-4 w-40 rounded-xs" />
              <Skeleton className="h-3 w-48 rounded-xs" />
            </div>
            <Skeleton className="h-4 w-28 rounded-xs" />
            <Skeleton className="h-4 w-24 rounded-xs" />
            <Skeleton className="h-4 w-20 rounded-xs" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
