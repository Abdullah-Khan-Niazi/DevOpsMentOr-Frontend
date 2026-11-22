import { PageSkeleton, Skeleton, SkeletonCircle, SkeletonText } from '@/shared/components';

/** Placeholder rows; widths vary so the table reads as real content. */
const ROW_NAME_WIDTHS = [44, 36, 52, 40, 48, 34, 46, 38] as const;

/**
 * Full-width, full-height skeleton of the staff labs library: page header with the
 * import action, search row, then the table (name, difficulty, steps, readiness,
 * usage, active switch, actions).
 */
export function AdminLabsPageSkeleton() {
  return (
    <PageSkeleton label="Loading labs">
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-40 rounded-md" />
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-full max-w-sm rounded-md" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_4rem_3rem_6rem_4rem_6.5rem] items-center gap-4 px-3 py-2.5">
            <Skeleton className="h-3 w-24 rounded-xs" />
            <Skeleton className="h-3 w-20 rounded-xs" />
            <Skeleton className="h-3 w-12 rounded-xs" />
            <Skeleton className="h-3 w-12 rounded-xs" />
            <Skeleton className="h-3 w-16 rounded-xs" />
            <Skeleton className="h-3 w-12 rounded-xs" />
            <Skeleton className="ml-auto h-3 w-16 rounded-xs" />
          </div>

          {ROW_NAME_WIDTHS.map((width, index) => (
            <div
              key={index}
              className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_4rem_3rem_6rem_4rem_6.5rem] items-center gap-4 px-3 py-3"
            >
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-3.5 rounded-xs" width={`${width}%`} />
                <Skeleton className="h-3 w-24 rounded-xs" />
              </div>
              <SkeletonText lines={1} widths={['70%']} />
              <Skeleton className="h-3.5 w-8 rounded-xs" />
              <SkeletonCircle size={16} />
              <Skeleton className="h-3.5 w-16 rounded-xs" />
              <Skeleton className="h-5 w-9 rounded-full" />
              <div className="ml-auto flex items-center gap-1">
                <SkeletonCircle size={28} />
                <SkeletonCircle size={28} />
                <SkeletonCircle size={28} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}

export default AdminLabsPageSkeleton;
