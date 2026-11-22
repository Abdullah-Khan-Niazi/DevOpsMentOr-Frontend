import { PageSkeleton, Skeleton } from '@/shared/components';

/** Inbox skeleton: header with action, notification rows with icon, text lines and time. */
export function NotificationInboxSkeleton() {
  return (
    <PageSkeleton label="Loading notifications">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-md bg-card p-4">
            <Skeleton className="h-9 w-9 shrink-0 rounded-sm" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 rounded-xs" width={`${[40, 55, 35][i % 3]}%`} />
              <Skeleton className="h-3.5 w-full max-w-xl rounded-xs" />
              <Skeleton className="h-3 w-20 rounded-xs" />
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
