import { PageSkeleton, Skeleton } from '@/shared/components';

/** Login history skeleton: header and a table card with header and rows. */
export function LoginHistorySkeleton() {
  return (
    <PageSkeleton label="Loading login history">
      <Skeleton className="h-8 w-48 rounded-md" />
      <div className="space-y-4 rounded-md bg-card p-6">
        <Skeleton className="h-6 w-44 rounded-sm" />
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-3.5 w-16 rounded-xs" />
            ))}
          </div>
          {Array.from({ length: 8 }, (_, r) => (
            <div key={r} className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }, (_, c) => (
                <Skeleton key={c} className="h-4 w-full max-w-[10rem] rounded-xs" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}
