import { PageSkeleton, Skeleton, SkeletonText } from '@/shared/components';

/** Announcements archive skeleton: header and announcement cards. */
export function AnnouncementsSkeleton() {
  return (
    <PageSkeleton label="Loading announcements">
      <Skeleton className="h-8 w-52 rounded-md" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-md bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-64 max-w-full rounded-sm" />
              <Skeleton className="h-4 w-16 rounded-xs" />
            </div>
            <SkeletonText lines={3} />
            <Skeleton className="h-3 w-24 rounded-xs" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
