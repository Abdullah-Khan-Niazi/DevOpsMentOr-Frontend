import { PageSkeleton, Skeleton } from '@/shared/components';

const CARD_CLASS = 'rounded-md border border-border bg-card p-5 shadow-2xs';

/** Four stat tiles (points, rank, badges, streak) matching the achievements stats bar. */
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={`${CARD_CLASS} space-y-3`}>
          <Skeleton className="h-3 w-24 rounded-xs" />
          <Skeleton className="h-6 w-16 rounded-xs" />
        </div>
      ))}
    </div>
  );
}

/** Badge artwork grid (tile per badge: artwork, name, description, earned line). */
export function BadgeGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={`${CARD_CLASS} flex flex-col items-center gap-3 text-center`}>
          <Skeleton variant="circular" className="h-14 w-14 rounded-full" />
          <Skeleton className="h-4 w-3/4 rounded-xs" />
          <Skeleton className="h-3 w-full rounded-xs" />
          <Skeleton className="h-3 w-20 rounded-xs" />
        </div>
      ))}
    </div>
  );
}

/** Achievement rows: icon, name and points on the first line, description and unlock date below. */
export function AchievementListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={`${CARD_CLASS} flex items-start gap-4`}>
          <Skeleton variant="circular" className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-2/5 rounded-xs" />
              <Skeleton className="h-3 w-16 rounded-xs" />
            </div>
            <Skeleton className="h-3 w-4/5 rounded-xs" />
            <Skeleton className="h-3 w-28 rounded-xs" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** XP history table: date, event, XP and balance columns. */
export function XpHistorySkeleton() {
  return (
    <div className={`${CARD_CLASS} overflow-x-auto`} aria-hidden="true">
      <div className="flex min-w-[28rem] flex-col gap-4">
        <div className="grid grid-cols-[6rem_1fr_5rem_5rem] gap-4">
          <Skeleton className="h-3 w-12 rounded-xs" />
          <Skeleton className="h-3 w-16 rounded-xs" />
          <Skeleton className="ml-auto h-3 w-8 rounded-xs" />
          <Skeleton className="ml-auto h-3 w-12 rounded-xs" />
        </div>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="grid grid-cols-[6rem_1fr_5rem_5rem] items-center gap-4">
            <Skeleton className="h-3.5 w-20 rounded-xs" />
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" className="h-4 w-4 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 w-3/5 rounded-xs" />
            </div>
            <Skeleton className="ml-auto h-3.5 w-12 rounded-xs" />
            <Skeleton className="ml-auto h-3.5 w-14 rounded-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full achievements layout while the gamification profile loads: title, the five-tab
 * switcher, then the Overview content (stats strip and recent achievements).
 * Mirrors AchievementsPage at full width.
 */
export function AchievementsPageSkeleton() {
  return (
    <PageSkeleton label="Loading achievements">
      <Skeleton className="h-8 w-40 rounded-md" />
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1">
        {[72, 96, 104, 80, 112].map((width, index) => (
          <Skeleton key={index} className="h-8 rounded-sm" width={width} />
        ))}
      </div>
      <StatsSkeleton />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40 rounded-xs" />
        <AchievementListSkeleton />
      </div>
    </PageSkeleton>
  );
}

export default AchievementsPageSkeleton;
