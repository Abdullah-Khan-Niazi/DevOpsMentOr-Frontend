import { PageSkeleton, Skeleton } from '@/shared/components';

/** Members directory: header, search with role switcher, and member rows. */
export function OrgProfessorsPageSkeleton() {
  return (
    <PageSkeleton label="Loading members">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-56 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-sm" />
      </div>
      <div className="flex w-full flex-col gap-4 rounded-lg border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-9 w-full max-w-md rounded-md" />
          <Skeleton className="h-8 w-80 rounded-sm" />
        </div>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex w-1/3 flex-col gap-1.5">
              <Skeleton className="h-4 w-1/2 rounded-xs" />
              <Skeleton className="h-3 w-2/3 rounded-xs" />
            </div>
            <Skeleton className="h-4 w-20 rounded-xs" />
            <Skeleton className="h-4 w-1/4 rounded-xs" />
            <Skeleton className="ml-auto h-4 w-20 rounded-xs" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}

export default OrgProfessorsPageSkeleton;
