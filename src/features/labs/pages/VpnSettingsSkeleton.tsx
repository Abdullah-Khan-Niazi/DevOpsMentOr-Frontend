import { PageSkeleton, Skeleton } from '@/shared/components';

/** VPN settings skeleton: header, assignment details card and actions. */
export function VpnSettingsSkeleton() {
  return (
    <PageSkeleton label="Loading VPN settings">
      <Skeleton className="h-8 w-24 rounded-md" />
      <div className="space-y-6 rounded-md bg-card p-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-16 rounded-xs" />
              <Skeleton className="h-4 w-28 rounded-xs" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24 rounded-xs" />
              <Skeleton className="h-10 w-40 rounded-sm" />
            </div>
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
          <Skeleton className="h-10 w-52 rounded-md" />
        </div>
      </div>
    </PageSkeleton>
  );
}
