import { PageSkeleton, Skeleton } from '@/shared/components';

/** Row bones for the users table (also used while filters reload the list). */
export function AdminUserTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="w-full" role="status" aria-label="Loading users">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-3 py-3">
          <div className="w-1/3 space-y-1.5">
            <Skeleton className="h-4 w-36 rounded-xs" />
            <Skeleton className="h-3 w-48 rounded-xs" />
          </div>
          <Skeleton className="hidden h-4 w-28 rounded-xs md:block" />
          <Skeleton className="hidden h-4 w-32 rounded-xs lg:block" />
          <Skeleton className="h-4 w-20 rounded-xs" />
          <Skeleton className="h-4 w-24 rounded-xs" />
        </div>
      ))}
    </div>
  );
}

/** Full-page skeleton for the platform users screen: header, filter row, table. */
export function AdminUsersSkeleton() {
  return (
    <PageSkeleton label="Loading users">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <div className="w-full rounded-md bg-card p-4 shadow-sm">
        <div className="mb-4 flex w-full items-center gap-1.5">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-sm" />
          <Skeleton className="h-9 w-28 rounded-sm" />
          <Skeleton className="hidden h-9 w-28 rounded-sm sm:block" />
          <Skeleton className="hidden h-9 w-28 rounded-sm md:block" />
          <Skeleton className="h-9 w-28 rounded-sm" />
        </div>
        <AdminUserTableSkeleton />
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-4 w-36 rounded-xs" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-8 rounded-sm" />
            <Skeleton className="h-8 w-8 rounded-sm" />
            <Skeleton className="h-8 w-8 rounded-sm" />
          </div>
        </div>
      </div>
    </PageSkeleton>
  );
}
