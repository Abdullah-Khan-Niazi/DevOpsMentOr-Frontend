import { PageSkeleton, Skeleton } from '@/shared/components';

/** Row bones for the audit log table (also used while filters reload the list). */
export function AdminAuditLogRowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="w-full" role="status" aria-label="Loading audit logs">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-3 py-3">
          <Skeleton className="h-4 w-28 rounded-xs" />
          <div className="w-1/4 space-y-1.5">
            <Skeleton className="h-4 w-32 rounded-xs" />
            <Skeleton className="h-3 w-40 rounded-xs" />
          </div>
          <Skeleton className="h-4 w-24 rounded-xs" />
          <Skeleton className="hidden h-4 w-20 rounded-xs md:block" />
          <Skeleton className="hidden h-4 w-28 rounded-xs lg:block" />
          <Skeleton className="hidden h-4 w-36 rounded-xs lg:block" />
        </div>
      ))}
    </div>
  );
}

/** Full-page skeleton for the audit log screen: header, filter toolbar, table. */
export function AdminAuditLogsSkeleton() {
  return (
    <PageSkeleton label="Loading audit logs">
      <Skeleton className="h-8 w-44 rounded-md" />
      <div className="w-full rounded-md bg-card p-4 shadow-sm">
        <div className="mb-4 flex w-full items-center gap-1.5">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-sm" />
          <Skeleton className="h-9 w-28 rounded-sm" />
          <Skeleton className="hidden h-9 w-28 rounded-sm sm:block" />
          <Skeleton className="hidden h-9 w-24 rounded-sm md:block" />
          <Skeleton className="hidden h-9 w-24 rounded-sm md:block" />
        </div>
        <AdminAuditLogRowsSkeleton />
      </div>
    </PageSkeleton>
  );
}
