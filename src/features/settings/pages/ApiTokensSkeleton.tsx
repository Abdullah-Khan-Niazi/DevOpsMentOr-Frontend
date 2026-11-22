import { PageSkeleton, Skeleton } from '@/shared/components';

/** API tokens skeleton: header and a card of token rows with a revoke action. */
export function ApiTokensSkeleton() {
  return (
    <PageSkeleton label="Loading API tokens">
      <Skeleton className="h-8 w-40 rounded-md" />
      <div className="space-y-5 rounded-md bg-card p-6">
        <Skeleton className="h-6 w-36 rounded-sm" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded-xs" />
              <Skeleton className="h-3 w-72 max-w-full rounded-xs" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </PageSkeleton>
  );
}
