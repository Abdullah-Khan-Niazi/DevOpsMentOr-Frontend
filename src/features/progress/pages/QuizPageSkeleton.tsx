import { PageSkeleton, Skeleton, SkeletonCircle, SkeletonText } from '@/shared/components/Skeleton';

export interface QuizPageSkeletonProps {
  /** `intro` mirrors the quiz landing view; `runner` mirrors the question view with its rail. */
  variant?: 'intro' | 'runner';
}

/** Quiz landing: title, description, the meta grid, the reward lines and the primary action. */
function IntroSkeletonBody() {
  return (
    <section className="flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-2/3 rounded-md" />
        <SkeletonText lines={2} widths={['100%', '80%']} />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-20 rounded-xs" />
            <Skeleton className="h-5 w-14 rounded-xs" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48 rounded-xs" />
        <Skeleton className="h-4 w-56 rounded-xs" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </section>
  );
}

/** Runner: header with count and timer, progress bar, question rail and the question body. */
function RunnerSkeletonBody() {
  return (
    <section className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-40 rounded-xs" />
        <Skeleton className="h-5 w-16 rounded-xs" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full max-w-[10rem] rounded-sm" />
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3.5 w-20 rounded-xs" />
            <SkeletonText lines={2} widths={['90%', '60%']} />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <SkeletonCircle size={18} />
                <Skeleton className="h-4 rounded-xs" width={`${[55, 40, 62, 35][i]}%`} />
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-center justify-between gap-3">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Dedicated quiz skeleton: mirrors the intro or the runner layout, full width and height. */
export function QuizPageSkeleton({ variant = 'intro' }: QuizPageSkeletonProps) {
  return (
    <PageSkeleton label={variant === 'intro' ? 'Loading quiz' : 'Loading quiz questions'}>
      {variant === 'intro' ? <IntroSkeletonBody /> : <RunnerSkeletonBody />}
    </PageSkeleton>
  );
}

export default QuizPageSkeleton;
