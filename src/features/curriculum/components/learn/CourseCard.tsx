import { Link } from 'react-router-dom';
import { Icon, ProgressBar } from '@/shared/components';
import { formatDuration, formatNumber, safeHttpUrl } from '@/shared/utils';
import type { LearnerCourseDto } from '@/features/curriculum/types';
import type { CourseProgressDto } from '@/features/progress/types';

interface CourseCardProps {
  course: LearnerCourseDto;
  /** Present once the learner has started the course. */
  progress?: CourseProgressDto | null;
  to: string;
}

/** Learner course tile: cover, title, difficulty, duration, counts and progress. The whole card is the link. */
export function CourseCard({ course, progress, to }: CourseCardProps) {
  const cover = safeHttpUrl(course.coverImageUrl);
  const duration = formatDuration({ hours: course.estimatedHours });

  return (
    <Link
      to={to}
      className="motion-lift block h-full rounded-md focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-md border border-paper-line bg-pearl-100">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="aspect-video w-full object-cover"
          />
        ) : null}

        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="line-clamp-2 font-semibold text-card-foreground">{course.title}</h3>

          {course.difficultyName || duration ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {course.difficultyName ? <span>{course.difficultyName}</span> : null}
              {duration ? (
                <span className="inline-flex items-center gap-1">
                  <Icon name="clock" size={14} />
                  {duration}
                </span>
              ) : null}
            </p>
          ) : null}

          <div className="mt-auto flex flex-col gap-3">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <li className="inline-flex items-center gap-1">
                <Icon name="module" size={14} title="Modules" />
                {formatNumber(course.moduleCount)}
              </li>
              <li className="inline-flex items-center gap-1">
                <Icon name="checklist" size={14} title="Items" />
                {formatNumber(course.itemCount)}
              </li>
            </ul>

            {progress ? (
              <ProgressBar
                value={progress.progressPercentage}
                label={`${course.title} progress`}
                size="sm"
              />
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
