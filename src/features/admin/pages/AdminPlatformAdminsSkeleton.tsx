import { PageSkeleton, Skeleton } from '@/shared/components';

export function AdminPlatformAdminsSkeleton() {
  return (
    <PageSkeleton label="Loading platform administrators">
      <Skeleton className="h-8 w-72 rounded-md" />
      <div className="space-y-5 rounded-md bg-card p-6 shadow-sm">
        <Skeleton className="h-6 w-56 rounded-sm" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-10 w-full rounded-sm" />
          <Skeleton className="h-10 w-full rounded-sm" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <div className="space-y-4 rounded-md bg-card p-6 shadow-sm">
        <Skeleton className="h-6 w-48 rounded-sm" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2">
            <Skeleton className="h-4 w-32 rounded-xs" />
            <Skeleton className="h-4 w-44 rounded-xs" />
            <Skeleton className="hidden h-4 w-36 rounded-xs sm:block" />
            <Skeleton className="h-7 w-16 rounded-xs" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
