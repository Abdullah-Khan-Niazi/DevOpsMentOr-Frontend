import { PageSkeleton, Skeleton } from '@/shared/components';

/** Organization settings: title, details card with fields, and domain card. */
export function OrgSettingsPageSkeleton() {
  return (
    <PageSkeleton label="Loading organization settings">
      <Skeleton className="h-8 w-64 rounded-md" />
      <div className="flex w-full flex-col gap-4 rounded-lg border border-border p-6">
        <Skeleton className="h-5 w-48 rounded-xs" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full rounded-sm" />
          <Skeleton className="h-10 w-full rounded-sm" />
        </div>
        <Skeleton className="h-20 w-full rounded-sm" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full rounded-sm" />
          <Skeleton className="h-10 w-full rounded-sm" />
        </div>
        <Skeleton className="ml-auto h-9 w-28 rounded-sm" />
      </div>
      <div className="flex w-full flex-col gap-4 rounded-lg border border-border p-6">
        <Skeleton className="h-5 w-56 rounded-xs" />
        <Skeleton className="h-10 w-full rounded-sm" />
        <Skeleton className="ml-auto h-9 w-28 rounded-sm" />
      </div>
    </PageSkeleton>
  );
}

export default OrgSettingsPageSkeleton;
