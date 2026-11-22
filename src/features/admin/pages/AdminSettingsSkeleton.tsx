import { PageSkeleton, Skeleton } from '@/shared/components';

/** Full-page skeleton for the system settings screen: header, filter toolbar, settings table. */
export function AdminSettingsSkeleton() {
  return (
    <PageSkeleton label="Loading system settings">
      <Skeleton className="h-8 w-52 rounded-md" />
      <div className="w-full rounded-md bg-card p-4 shadow-sm">
        <div className="mb-4 flex w-full items-center gap-1.5">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-sm" />
          <Skeleton className="h-9 w-32 rounded-sm" />
        </div>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-3 py-3">
            <Skeleton className="h-4 w-1/4 rounded-xs" />
            <Skeleton className="h-4 w-1/5 rounded-xs" />
            <Skeleton className="hidden h-4 w-24 rounded-xs md:block" />
            <Skeleton className="hidden h-4 w-24 rounded-xs md:block" />
            <Skeleton className="h-7 w-14 rounded-xs" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
