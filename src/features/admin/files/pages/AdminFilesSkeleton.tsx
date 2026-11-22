import { PageSkeleton, Skeleton } from '@/shared/components';

/** File library cards (header and upload card above stay live). */
export function AdminFilesSkeleton() {
  return (
    <PageSkeleton label="Loading files">
      <div className="files-admin-page__list">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-md bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-64 max-w-full rounded-sm" />
              <Skeleton className="h-4 w-14 rounded-xs" />
            </div>
            <Skeleton className="h-3 w-80 max-w-full rounded-xs" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
