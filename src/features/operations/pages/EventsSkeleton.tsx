import { PageSkeleton, Skeleton } from '@/shared/components';

/** Events skeleton: header, filter bar and a grid of event cards. */
export function EventsSkeleton() {
  return (
    <PageSkeleton label="Loading events">
      <Skeleton className="h-8 w-32 rounded-md" />
      <div className="flex flex-wrap items-center gap-6">
        <Skeleton className="h-9 w-40 rounded-sm" />
        <Skeleton className="h-5 w-36 rounded-xs" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(18.75rem,1fr))] gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-md bg-card">
            <Skeleton className="h-36 w-full rounded-none" />
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 rounded-xs" />
                <Skeleton className="h-4 w-12 rounded-xs" />
              </div>
              <Skeleton className="h-5 w-3/4 rounded-sm" />
              <Skeleton className="h-4 w-full rounded-xs" />
              <Skeleton className="h-3.5 w-2/3 rounded-xs" />
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
