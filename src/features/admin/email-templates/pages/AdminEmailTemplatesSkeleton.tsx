import { PageSkeleton, Skeleton } from '@/shared/components';

/** Email template cards (the header above stays live). */
export function AdminEmailTemplatesSkeleton() {
  return (
    <PageSkeleton label="Loading email templates">
      <div className="email-templates-admin-page__list">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-md bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-48 rounded-sm" />
              <Skeleton className="h-4 w-32 rounded-xs" />
            </div>
            <Skeleton className="h-4 w-80 max-w-full rounded-xs" />
            <Skeleton className="h-3 w-64 max-w-full rounded-xs" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
