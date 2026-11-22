import { Skeleton, SkeletonText } from '@/shared/components';

/** Comment list skeleton: comment rows with author line, text and action row. */
export function CommentThreadSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-4" role="status" aria-label="Loading comments">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-3 rounded-md bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-32 rounded-xs" />
            <Skeleton className="h-3 w-16 rounded-xs" />
          </div>
          <SkeletonText lines={2} />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-10 rounded-xs" />
            <Skeleton className="h-4 w-12 rounded-xs" />
            <Skeleton className="h-4 w-14 rounded-xs" />
          </div>
        </div>
      ))}
    </div>
  );
}
