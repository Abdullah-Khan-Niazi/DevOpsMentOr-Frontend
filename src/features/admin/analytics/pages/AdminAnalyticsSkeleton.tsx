import { PageSkeleton, Skeleton } from '@/shared/components';

function ChartCardSkeleton({ height = 'h-56' }: { height?: string }) {
  return (
    <div className="min-w-0 space-y-4 rounded-md bg-card p-5 shadow-sm">
      <Skeleton className="h-4 w-48 rounded-xs" />
      <Skeleton className={`${height} w-full rounded-md`} />
    </div>
  );
}

/** Full-page skeleton for platform analytics: header, KPI grid, telemetry, charts, map. */
export function AdminAnalyticsSkeleton() {
  return (
    <PageSkeleton label="Loading platform analytics">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-8 w-40 rounded-md" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-md bg-card p-3.5 shadow-sm">
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-24 rounded-xs" />
              <Skeleton className="h-5 w-10 rounded-xs" />
            </div>
            <Skeleton className="h-7 w-20 rounded-sm" />
          </div>
        ))}
      </div>

      <Skeleton className="h-14 w-full rounded-md" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-md bg-card p-5 shadow-sm">
            <Skeleton className="h-4 w-36 rounded-xs" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ))}
      </div>

      <ChartCardSkeleton height="h-72" />
      <ChartCardSkeleton height="h-40" />

      <div className="grid w-full gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      <ChartCardSkeleton height="h-80" />

      <div className="grid w-full gap-6 lg:grid-cols-2">
        <ChartCardSkeleton height="h-48" />
        <div className="min-w-0 space-y-4 rounded-md bg-card p-5 shadow-sm">
          <Skeleton className="h-4 w-56 rounded-xs" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </PageSkeleton>
  );
}
