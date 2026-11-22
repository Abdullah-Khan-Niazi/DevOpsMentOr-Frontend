import { Skeleton, SkeletonText } from '@/shared/components';

/** Lesson page while the item loads: header, prose lines, completion row and pager. */
export function LessonPageSkeleton() {
  return (
    <div className="skeleton-page w-full min-w-0" aria-label="Loading lesson" role="status">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-sm" />
        <Skeleton className="h-7 w-72 max-w-full rounded-md" />
        <Skeleton className="ml-auto hidden h-8 w-32 rounded-md sm:block" />
      </div>
      <div className="prose-measure space-y-4">
        <SkeletonText lines={4} widths={['95%', '100%', '88%', '60%']} />
        <SkeletonText lines={5} widths={['100%', '92%', '100%', '84%', '45%']} />
        <SkeletonText lines={3} widths={['98%', '90%', '52%']} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-40 max-w-full rounded-md" />
        <Skeleton className="ml-auto h-10 w-40 max-w-full rounded-md" />
      </div>
    </div>
  );
}
