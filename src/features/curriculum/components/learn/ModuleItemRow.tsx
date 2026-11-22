import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/shared/components';
import { cn, formatDuration, pluralize } from '@/shared/utils';
import type { ModuleItemDto } from '@/features/curriculum/types';
import type { ModuleItemProgressDto } from '@/features/progress/types';
import { ItemKindIcon } from './ItemKindIcon';

interface ModuleItemRowProps {
  item: ModuleItemDto;
  progress?: ModuleItemProgressDto;
  /** Course access denied: the row is shown muted and cannot be opened. */
  locked: boolean;
  /** Route for the item, or null when the item has no destination. */
  to: string | null;
}

/** One ordered item of a module outline: kind icon, title, meta and completion or lock state. */
export function ModuleItemRow({ item, progress, locked, to }: ModuleItemRowProps) {
  const isUnavailableLab = item.kind === 'lab' && (item.lab?.stepCount ?? 0) === 0;
  const inactive = locked || to === null || isUnavailableLab;
  const lockTitle = locked ? 'Locked' : 'Not available yet';

  const meta: string[] = [];
  if (item.kind === 'lesson') {
    const duration = formatDuration({ seconds: item.videoDurationSeconds ?? 0 });
    if (duration) meta.push(duration);
  }
  if (item.kind === 'lab' && item.lab) {
    meta.push(pluralize(item.lab.stepCount, 'step', 'steps'));
    if (progress?.lab) meta.push(`${progress.lab.passedSteps} / ${progress.lab.totalSteps} passed`);
  }
  if (item.kind === 'quiz' && item.quiz) {
    meta.push(pluralize(item.quiz.questionCount, 'question', 'questions'));
    const bestScore = progress?.quiz?.bestScore;
    if (typeof bestScore === 'number') meta.push(`Best ${bestScore}%`);
  }

  let status: ReactNode = null;
  if (inactive) {
    status = (
      <Icon name="lock" size={18} title={lockTitle} className="shrink-0 text-muted-foreground" />
    );
  } else if (progress?.isCompleted) {
    status = (
      <Icon
        name="check-circle"
        filled
        size={18}
        title="Completed"
        className="shrink-0 text-success"
      />
    );
  }

  const content = (
    <>
      <span className={cn('flex shrink-0', inactive ? 'text-muted' : 'text-muted-foreground')}>
        <ItemKindIcon kind={item.kind} contentType={item.contentType} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn('truncate font-medium', inactive ? 'text-muted' : 'text-card-foreground')}
        >
          {item.title}
        </span>
        {meta.length > 0 ? (
          <span className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
            {meta.map((entry, entryIndex) => (
              <span key={entryIndex}>{entry}</span>
            ))}
          </span>
        ) : null}
      </span>
      {status}
    </>
  );

  const base = 'flex items-center gap-4 rounded-md px-4 py-3';

  if (!to || inactive) {
    return (
      <div aria-disabled="true" className={cn(base, 'opacity-70')}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        base,
        'transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]',
      )}
    >
      {content}
    </Link>
  );
}
