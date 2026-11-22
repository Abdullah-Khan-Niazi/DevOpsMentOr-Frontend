import { PageSkeleton, Skeleton } from '@/shared/components';

export function RolesPageSkeleton() {
  return (
    <PageSkeleton label="Loading roles">
      <Skeleton className="h-8 w-48 rounded-md" />
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="space-y-2 rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-4 w-40 rounded-xs" />
              <Skeleton className="h-3.5 w-2/3 rounded-xs" />
              <Skeleton className="h-3 w-24 rounded-xs" />
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
