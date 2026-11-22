import { PageSkeleton, Skeleton } from '@/shared/components';

/** Preferences skeleton: header and a card with theme, timezone and email fields. */
export function PreferencesSkeleton() {
  return (
    <PageSkeleton label="Loading preferences">
      <Skeleton className="h-8 w-40 rounded-md" />
      <div className="space-y-6 rounded-md bg-card p-6">
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-16 rounded-xs" />
          <div className="flex gap-4">
            <Skeleton className="h-5 w-20 rounded-xs" />
            <Skeleton className="h-5 w-20 rounded-xs" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-20 rounded-xs" />
          <Skeleton className="h-10 w-full rounded-sm" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-36 rounded-xs" />
          <Skeleton className="h-5 w-24 rounded-xs" />
          <Skeleton className="h-5 w-24 rounded-xs" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
    </PageSkeleton>
  );
}
