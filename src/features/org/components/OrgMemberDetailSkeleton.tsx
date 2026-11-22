import { Skeleton } from '@/shared/components';

/** Member drawer body: identity card, telemetry tiles and cohort rows. */
export function OrgMemberDetailSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6" role="status" aria-label="Loading member">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-md" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-1/2 rounded-xs" />
            <Skeleton className="h-3 w-2/3 rounded-xs" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-xs" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40 rounded-xs" />
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

export default OrgMemberDetailSkeleton;
