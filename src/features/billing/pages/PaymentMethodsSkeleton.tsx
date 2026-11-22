import { PageSkeleton, Skeleton } from '@/shared/components';

/** Payment methods skeleton: header with add action and payment method cards. */
export function PaymentMethodsSkeleton() {
  return (
    <PageSkeleton label="Loading payment methods">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-52 rounded-md" />
        <Skeleton className="h-8 w-44 rounded-md" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 rounded-md bg-card p-5">
            <Skeleton className="h-5 w-36 rounded-xs" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
