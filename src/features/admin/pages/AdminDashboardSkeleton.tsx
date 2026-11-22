import { PageSkeleton, Skeleton } from '@/shared/components';

function ChartCardSkeleton({ height = 'h-56' }: { height?: string }) {
  return (
    <div className="min-w-0 space-y-4 rounded-md bg-card p-5 shadow-sm">
      <Skeleton className="h-4 w-48 rounded-xs" />
      <Skeleton className={`${height} w-full rounded-md`} />
    </div>
  );
}

/** Full-page skeleton for the platform dashboard: header actions, KPI strip, telemetry, charts, audit feed. */
export function AdminDashboardSkeleton() {
  return (
    <PageSkeleton label="Loading platform dashboard">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-60 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="hidden h-8 w-28 rounded-md sm:block" />
          <Skeleton className="hidden h-8 w-24 rounded-md md:block" />
        </div>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-md bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-28 rounded-xs" />
              <Skeleton className="h-6 w-10 rounded-xs" />
            </div>
            <Skeleton className="h-8 w-24 rounded-sm" />
            <Skeleton className="h-3 w-36 rounded-xs" />
          </div>
        ))}
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-md bg-card p-5 shadow-sm">
            <Skeleton className="h-4 w-36 rounded-xs" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ))}
      </div>

      <div className="grid w-full gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      <div className="grid w-full gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <ChartCardSkeleton height="h-60" />
          <ChartCardSkeleton height="h-44" />
        </div>
        <div className="min-w-0 space-y-4 rounded-md bg-card p-5 shadow-sm">
          <Skeleton className="h-4 w-52 rounded-xs" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-72 max-w-full rounded-md" />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-1.5 px-2 py-2">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-3.5 w-40 rounded-xs" />
                <Skeleton className="h-3 w-24 rounded-xs" />
              </div>
              <Skeleton className="h-3 w-56 rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}
