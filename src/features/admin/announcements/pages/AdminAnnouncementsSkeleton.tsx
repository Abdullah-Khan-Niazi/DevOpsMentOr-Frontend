import { PageSkeleton, Skeleton, SkeletonText } from '@/shared/components';

/** Announcement list cards (the header and form above stay live). */
export function AdminAnnouncementsSkeleton() {
  return (
    <PageSkeleton label="Loading announcements">
      <div className="announcements-admin-page">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-md bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-56 rounded-sm" />
              <Skeleton className="h-4 w-16 rounded-xs" />
            </div>
            <SkeletonText lines={2} />
            <Skeleton className="h-3 w-72 rounded-xs" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
