import { PageSkeleton, Skeleton } from '@/shared/components';

/** Settings hub skeleton: header, link card grid and the organization form. */
export function SettingsSkeleton() {
  return (
    <PageSkeleton label="Loading settings">
      <Skeleton className="h-8 w-40 rounded-md" />
      <div className="space-y-4">
        <Skeleton className="h-5 w-40 rounded-sm" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-md bg-card p-6">
              <Skeleton className="h-5 rounded-sm" width={`${[40, 50, 60][i % 3]}%`} />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-32 rounded-sm" />
        <div className="space-y-5 rounded-md bg-card p-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-28 rounded-xs" />
              <Skeleton className="h-10 w-full rounded-sm" />
            </div>
          ))}
          <Skeleton className="h-4 w-48 rounded-xs" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </PageSkeleton>
  );
}
