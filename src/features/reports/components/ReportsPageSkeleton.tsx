import { PageSkeleton, Skeleton } from '@/shared/components';

export function ReportsPageSkeleton() {
  return (
    <PageSkeleton label="Loading reports">
      <Skeleton className="h-8 w-48 rounded-md" />
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48 rounded-xs" />
                <Skeleton className="h-3 w-32 rounded-xs" />
              </div>
              <Skeleton className="h-4 w-16 rounded-xs" />
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
