import { PageSkeleton, Skeleton } from '@/shared/components';

/** Ranked table body: rank, learner, points and country columns (mirrors LeaderboardTable). */
export function LeaderboardTableSkeleton() {
  return (
    <div className="leaderboard-table-wrap" aria-hidden="true">
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-[3rem_1fr_4rem] items-center gap-4 sm:grid-cols-[4.5rem_1fr_5rem_3rem]"
          >
            <Skeleton className="h-3.5 w-8 rounded-xs" />
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" className="h-8 w-8 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 w-2/5 rounded-xs" />
            </div>
            <Skeleton className="ml-auto h-3.5 w-12 rounded-xs" />
            <Skeleton className="ml-auto hidden h-3.5 w-6 rounded-xs sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full leaderboard layout while standings load: title, tab switcher + filter,
 * viewer standing strip, top-3 podium and ranked table.
 */
export function LeaderboardPageSkeleton() {
  return (
    <PageSkeleton label="Loading leaderboard">
      <Skeleton className="h-8 w-40 rounded-md" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1">
          {[72, 84, 76, 64, 96].map((width, index) => (
            <Skeleton key={index} className="h-8 rounded-sm" width={width} />
          ))}
        </div>
        <Skeleton className="h-9 w-48 rounded-md" />
      </div>
      <Skeleton className="h-12 w-full rounded-md" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
        {['8rem', '9.5rem', '8rem'].map((height, index) => (
          <Skeleton key={index} className="w-full rounded-lg" height={height} />
        ))}
      </div>
      <LeaderboardTableSkeleton />
    </PageSkeleton>
  );
}

export default LeaderboardPageSkeleton;
