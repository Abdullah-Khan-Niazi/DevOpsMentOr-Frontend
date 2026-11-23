import { PageSkeleton, Skeleton } from '@/shared/components';

const CARD_CLASS = 'rounded-md border border-border bg-card p-6 shadow-2xs';

/** Four metric cards (XP balance, total earned, global rank, streak) from the gamification summary. */
export function DashboardMetricsSkeleton() {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex min-w-[7.5rem] items-center gap-3 rounded-md border border-border bg-card px-4 py-3"
        >
          <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-14 rounded-xs" />
            <Skeleton className="h-3 w-20 rounded-xs" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Continue learning card: topic icon, module line, lesson title, progress bar and primary action. */
export function DashboardContinueSkeleton() {
  return (
    <section className="space-y-3" aria-hidden="true">
      <Skeleton className="h-5 w-40 rounded-xs" />
      <div className="flex flex-col justify-between gap-6 rounded-lg border border-border bg-card p-6 shadow-2xs sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
          <Skeleton className="size-9 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32 rounded-xs" />
            <Skeleton className="h-6 w-3/4 rounded-sm" />
            <div className="max-w-md space-y-1.5 pt-1">
              <Skeleton className="h-3 w-20 rounded-xs" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        </div>
        <Skeleton className="h-10 w-36 shrink-0 rounded-md" />
      </div>
    </section>
  );
}

/** Courses grid: header with filter switcher and four course cards with progress bars. */
export function DashboardCoursesSkeleton() {
  return (
    <section className="space-y-4" aria-hidden="true">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-5 w-24 rounded-xs" />
        <Skeleton className="h-9 w-56 rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="space-y-4 rounded-md border border-border bg-card p-5 shadow-2xs"
          >
            <Skeleton className="h-5 w-3/4 rounded-sm" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-28 rounded-xs" />
              <Skeleton className="h-3 w-10 rounded-xs" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
    </section>
  );
}

/** Recent activity list: icon, action label and relative time per row. */
export function DashboardActivitySkeleton() {
  return (
    <section className="space-y-3" aria-hidden="true">
      <Skeleton className="h-5 w-36 rounded-xs" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 py-2">
            <Skeleton className="h-4 w-4 shrink-0 rounded-xs" />
            <Skeleton
              className="h-4 min-w-0 flex-1 rounded-xs"
              width={`${[60, 48, 66, 52][index]}%`}
            />
            <Skeleton className="h-3 w-16 shrink-0 rounded-xs" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Labs grid: two columns of lab cards (name, difficulty, hours). */
export function DashboardLabsSkeleton() {
  return (
    <section className="space-y-3" aria-hidden="true">
      <Skeleton className="h-5 w-16 rounded-xs" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-md border border-border bg-card p-5 shadow-2xs"
          >
            <Skeleton className="h-5 w-4/5 rounded-sm" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-20 rounded-xs" />
              <Skeleton className="h-3 w-10 rounded-xs" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Streak card: streak count header, 7-day tracker row, course progress bars and link. */
export function DashboardStreakSkeleton() {
  return (
    <div className={`${CARD_CLASS} space-y-6`} aria-hidden="true">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-xs" />
          <Skeleton className="h-6 w-20 rounded-xs" />
        </div>
        <Skeleton className="h-8 w-14 rounded-md" />
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <Skeleton variant="circular" className="h-9 w-9" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-32 rounded-xs" />
              <Skeleton className="h-3 w-8 rounded-xs" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-3.5 w-28 rounded-xs" />
    </div>
  );
}

/** AI mentor card: icon, title and primary action. */
export function DashboardMentorSkeleton() {
  return (
    <div className={`${CARD_CLASS} space-y-4`} aria-hidden="true">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-5 rounded-xs" />
        <Skeleton className="h-5 w-40 rounded-sm" />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

/** Learner dashboard: greeting and metrics row, then the two-column grid the page renders. */
export function DashboardPageSkeleton() {
  return (
    <PageSkeleton label="Loading dashboard">
      <div className="flex flex-col justify-between gap-6 pb-2 lg:flex-row lg:items-center">
        <Skeleton className="h-9 w-72 max-w-full rounded-md" />
        <DashboardMetricsSkeleton />
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="min-w-0 space-y-8 lg:col-span-8">
          <DashboardContinueSkeleton />
          <DashboardCoursesSkeleton />
          <DashboardActivitySkeleton />
          <DashboardLabsSkeleton />
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-4">
          <DashboardStreakSkeleton />
          <DashboardMentorSkeleton />
        </div>
      </div>
    </PageSkeleton>
  );
}

/** Platform stats dashboard (users without progress access): four stat cards. */
export function DashboardStatsSkeleton() {
  return (
    <PageSkeleton label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-3 rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-4 w-24 rounded-xs" />
            <Skeleton className="h-8 w-16 rounded-sm" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
