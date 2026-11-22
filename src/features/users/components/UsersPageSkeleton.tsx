import { PageSkeleton, Skeleton } from '@/shared/components';

export function UsersPageSkeleton() {
  return (
    <PageSkeleton label="Loading users">
      <Skeleton className="h-8 w-48 rounded-md" />
      <div className="overflow-hidden rounded-md border border-border bg-card">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-1/4 rounded-xs" />
              <Skeleton className="h-4 w-1/3 rounded-xs" />
              <Skeleton className="h-4 w-20 rounded-xs" />
              <Skeleton className="h-4 w-16 rounded-xs" />
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
