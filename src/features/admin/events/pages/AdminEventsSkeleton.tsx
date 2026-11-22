import { PageSkeleton, Skeleton } from '@/shared/components';

/** Attendee roster table (the form and lookup above stay live). */
export function AdminEventsSkeleton() {
  return (
    <PageSkeleton label="Loading attendees">
      <div className="events-admin-page__roster-skeleton">
        <div className="flex items-center justify-between gap-4 py-2">
          <Skeleton className="h-3 w-16 rounded-xs" />
          <Skeleton className="h-3 w-16 rounded-xs" />
          <Skeleton className="h-3 w-16 rounded-xs" />
          <Skeleton className="h-3 w-24 rounded-xs" />
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2">
            <Skeleton className="h-4 w-28 rounded-xs" />
            <Skeleton className="h-4 w-40 rounded-xs" />
            <Skeleton className="h-4 w-20 rounded-xs" />
            <Skeleton className="h-4 w-24 rounded-xs" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
