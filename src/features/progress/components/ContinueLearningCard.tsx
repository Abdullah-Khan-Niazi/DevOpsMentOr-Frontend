import { Link } from 'react-router-dom';
import { Button } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import type { ContinueLearningPointerDto } from '../types';
import { ProgressBar } from './ProgressBar';

interface ContinueLearningCardProps {
  pointer: ContinueLearningPointerDto | null;
  isLoading: boolean;
}

/**
 * SCR-F5-01 widget: resume the journey at the last-accessed lesson. Renders
 * the empty state ("Start your journey") when no progress exists yet.
 */
export function ContinueLearningCard({ pointer, isLoading }: ContinueLearningCardProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <div className="h-4 w-1/3 rounded bg-border" />
        <div className="h-8 rounded-md bg-border" />
        <div className="h-2 w-full rounded-full bg-border" />
      </div>
    );
  }

  if (!pointer) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Continue learning</h2>
        <p className="mt-2 text-sm text-muted-foreground">Start your journey: open Module 1.</p>
        <Link
          to={ROUTES.LEARN}
          className="mt-4 inline-block rounded-md px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          Browse curriculum
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-card-foreground">Continue learning</h2>
      <p className="mt-2 text-xs uppercase tracking-wide text-muted">{pointer.moduleTitle}</p>
      <p className="mt-1 text-base font-medium text-card-foreground">{pointer.lessonTitle}</p>
      <div className="mt-3">
        <ProgressBar percentage={pointer.progressPct} label="Course progress" size="sm" />
      </div>
      <Link
        to={ROUTES.LEARN_LESSON.replace(':lessonId', String(pointer.lessonId))}
        className="mt-4 inline-block"
      >
        <Button size="sm">Resume lesson</Button>
      </Link>
    </div>
  );
}

export default ContinueLearningCard;
