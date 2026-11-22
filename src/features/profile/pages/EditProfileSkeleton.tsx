import { PageSkeleton, Skeleton } from '@/shared/components';

/** Edit profile skeleton: header, photo upload cards, details form and skills card. */
export function EditProfileSkeleton() {
  return (
    <PageSkeleton label="Loading profile">
      <Skeleton className="h-8 w-44 rounded-md" />
      <div className="space-y-4 rounded-md bg-card p-6">
        <Skeleton className="h-5 w-24 rounded-sm" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 rounded-xs" />
            <Skeleton variant="circular" className="h-24 w-24" />
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded-xs" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
        </div>
      </div>
      <div className="space-y-4 rounded-md bg-card p-6">
        <Skeleton className="h-5 w-36 rounded-sm" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-24 rounded-xs" />
              <Skeleton className="h-10 w-full rounded-sm" />
            </div>
          ))}
        </div>
        <Skeleton className="h-24 w-full rounded-sm" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
      <div className="space-y-4 rounded-md bg-card p-6">
        <Skeleton className="h-5 w-20 rounded-sm" />
        <Skeleton className="h-10 w-full rounded-sm" />
      </div>
    </PageSkeleton>
  );
}
