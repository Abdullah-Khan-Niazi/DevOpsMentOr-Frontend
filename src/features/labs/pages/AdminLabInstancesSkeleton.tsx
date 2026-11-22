import { PageSkeleton, Skeleton } from '@/shared/components';

/** Lab instances skeleton: header, filter toolbar, instance table and pagination. */
export function AdminLabInstancesSkeleton() {
  return (
    <PageSkeleton label="Loading lab instances">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      <div className="space-y-4 rounded-md bg-card p-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 flex-1 rounded-sm" />
          <Skeleton className="h-8 w-36 rounded-sm" />
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-4 px-3">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-3 w-16 rounded-xs" />
            ))}
          </div>
          {Array.from({ length: 8 }, (_, r) => (
            <div key={r} className="grid grid-cols-7 gap-4 px-3">
              {Array.from({ length: 7 }, (_, c) => (
                <Skeleton key={c} className="h-4 w-full max-w-[8rem] rounded-xs" />
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-8 w-48 rounded-sm" />
        </div>
      </div>
    </PageSkeleton>
  );
}
