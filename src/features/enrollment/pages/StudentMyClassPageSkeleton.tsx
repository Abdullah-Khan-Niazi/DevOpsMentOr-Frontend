import { PageSkeleton, Skeleton } from '@/shared/components';

/** My classes: header, enrollment list and class detail card. */
export function StudentMyClassPageSkeleton() {
  return (
    <PageSkeleton label="Loading your classes">
      <Skeleton className="h-8 w-40 rounded-md" />
      <div className="grid w-full gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4 md:col-span-1">
          <Skeleton className="h-4 w-28 rounded-xs" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex flex-col gap-4 rounded-lg border border-border p-6 md:col-span-2">
          <Skeleton className="h-6 w-1/2 rounded-xs" />
          <Skeleton className="h-4 w-1/3 rounded-xs" />
          <Skeleton className="h-4 w-full rounded-xs" />
        </div>
      </div>
    </PageSkeleton>
  );
}

export default StudentMyClassPageSkeleton;
