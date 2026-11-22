import { PageSkeleton, Skeleton } from '@/shared/components';

/** Badges page: header with action, then the catalog table. */
export function AdminBadgesSkeleton() {
  return (
    <PageSkeleton label="Loading badges">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <div className="rounded-md bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-4 py-2">
          <Skeleton className="h-3 w-40 rounded-xs" />
          <Skeleton className="h-3 w-20 rounded-xs" />
          <Skeleton className="h-3 w-16 rounded-xs" />
          <Skeleton className="h-3 w-24 rounded-xs" />
          <Skeleton className="h-3 w-24 rounded-xs" />
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2">
            <Skeleton className="h-4 w-40 rounded-xs" />
            <Skeleton className="h-4 w-20 rounded-xs" />
            <Skeleton className="h-4 w-16 rounded-xs" />
            <Skeleton className="h-4 w-24 rounded-xs" />
            <Skeleton className="h-4 w-24 rounded-xs" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
