import { PageSkeleton, Skeleton } from '@/shared/components';

/** Billing hub skeleton: header, current plan card and payment method cards. */
export function BillingSkeleton() {
  return (
    <PageSkeleton label="Loading billing">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      <div className="space-y-4 rounded-md bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded-sm" />
            <Skeleton className="h-4 w-24 rounded-xs" />
          </div>
          <Skeleton className="h-4 w-44 rounded-xs" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(8.75rem,1fr))] gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-16 rounded-xs" />
              <Skeleton className="h-4 w-24 rounded-xs" />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-40 rounded-sm" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] gap-4">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 rounded-md bg-card p-5">
              <Skeleton className="h-5 w-36 rounded-xs" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}
