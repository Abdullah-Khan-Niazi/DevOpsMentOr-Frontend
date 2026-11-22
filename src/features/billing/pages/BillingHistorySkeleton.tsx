import { PageSkeleton, Skeleton } from '@/shared/components';

/** Billing history skeleton: header and an order table with header and rows. */
export function BillingHistorySkeleton() {
  return (
    <PageSkeleton label="Loading billing history">
      <Skeleton className="h-8 w-52 rounded-md" />
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-4 px-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-3.5 w-16 rounded-xs" />
          ))}
        </div>
        {Array.from({ length: 8 }, (_, r) => (
          <div key={r} className="grid grid-cols-5 gap-4 px-4">
            {Array.from({ length: 5 }, (_, c) => (
              <Skeleton key={c} className="h-4 w-full max-w-[9rem] rounded-xs" />
            ))}
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
