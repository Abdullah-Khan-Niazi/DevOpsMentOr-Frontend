import type { CourseProgressDto } from '../types';
import { ProgressBar } from './ProgressBar';

interface CourseProgressCardProps {
  course: CourseProgressDto | null;
  isLoading: boolean;
}

/**
 * SCR-F5-01 widget: course-level completion ring + counts. The ring is a
 * real SVG arc driven by the percentage (stroke-dashoffset), not a static
 * circle, and the same value is repeated via aria-valuenow on the bar.
 */
export function CourseProgressCard({ course, isLoading }: CourseProgressCardProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <div className="h-4 w-1/2 rounded bg-border" />
        <div className="mx-auto h-20 w-20 rounded-full bg-border" />
        <div className="h-2 w-full rounded-full bg-border" />
      </div>
    );
  }

  const percentage = course?.progressPercentage ?? 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percentage / 100);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-card-foreground">Course progress</h2>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 88 88" className="h-20 w-20 -rotate-90" aria-hidden="true">
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              strokeWidth="6"
              className="stroke-border"
            />
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className="stroke-brand-600 transition-[stroke-dashoffset] duration-500"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-card-foreground">
            {percentage}%
          </span>
        </div>
        <div className="min-w-0 grow">
          <p className="truncate text-sm font-medium text-card-foreground">
            {course?.courseTitle ?? 'DevOps Mentor'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {course?.completedLessonCount ?? 0} of {course?.totalLessons ?? 0} lessons completed
          </p>
          <div className="mt-3">
            <ProgressBar percentage={percentage} label="Course progress" size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseProgressCard;
