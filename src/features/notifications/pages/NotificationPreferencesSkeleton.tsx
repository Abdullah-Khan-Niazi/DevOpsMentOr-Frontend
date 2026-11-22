import { PageSkeleton, Skeleton } from '@/shared/components';

/** Preferences skeleton: header and one card per notification type with three channel toggles. */
export function NotificationPreferencesSkeleton() {
  return (
    <PageSkeleton label="Loading notification preferences">
      <Skeleton className="h-8 w-72 rounded-md" />
      <div className="grid gap-3">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-card p-5"
          >
            <Skeleton className="h-5 w-32 rounded-sm" />
            <div className="flex items-center gap-6">
              <Skeleton className="h-4 w-16 rounded-xs" />
              <Skeleton className="h-4 w-14 rounded-xs" />
              <Skeleton className="h-4 w-16 rounded-xs" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
