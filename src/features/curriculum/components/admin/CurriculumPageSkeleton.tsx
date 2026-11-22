import { PageSkeleton, Skeleton } from '@/shared/components';

/** Tree depth of each placeholder row (8 rows, indented like the real tree). */
const ROW_DEPTHS = [0, 1, 2, 3, 1, 2, 0, 1] as const;
const ROW_WIDTHS = [46, 38, 42, 30, 50, 34, 44, 36] as const;

/**
 * Full-width, full-height skeleton of the staff curriculum control panel:
 * page header, search and tab switcher row, then the tree rows.
 */
export function CurriculumPageSkeleton() {
  return (
    <PageSkeleton label="Loading curriculum">
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-48 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Skeleton className="h-9 w-full max-w-sm rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <Skeleton className="h-9 w-72 max-w-full rounded-md" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
          {ROW_DEPTHS.map((depth, index) => (
            <div
              key={index}
              className="flex h-10 items-center gap-2 py-1"
              style={{ paddingInlineStart: `${depth * 1.25 + 0.25}rem` }}
            >
              <Skeleton className="h-4 w-4 rounded-xs" />
              <Skeleton className="h-4 w-4 rounded-xs" />
              <Skeleton className="h-4 rounded-xs" width={`${ROW_WIDTHS[index]}%`} />
              <Skeleton className="ml-auto h-3 w-16 rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}

export default CurriculumPageSkeleton;
