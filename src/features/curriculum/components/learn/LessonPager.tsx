import { Link } from 'react-router-dom';
import { Icon, type IconName } from '@/shared/components';

interface PagerTarget {
  title: string;
  to: string;
}

interface LessonPagerProps {
  prev: PagerTarget | null;
  next: PagerTarget | null;
}

/**
 * A router link styled as a secondary button (`.btn` classes), so no button is nested inside an
 * anchor. Long item titles truncate.
 */
function PagerLink({
  target,
  icon,
  iconPosition,
  className,
}: {
  target: PagerTarget;
  icon: IconName;
  iconPosition: 'left' | 'right';
  className?: string;
}) {
  const iconNode = (
    <span className="btn__icon" aria-hidden="true">
      <Icon name={icon} size={18} />
    </span>
  );
  return (
    <Link
      to={target.to}
      className={`btn btn--secondary btn--md motion-press min-w-0 max-w-full ${className ?? ''}`.trim()}
    >
      <span className="btn__content min-w-0">
        {iconPosition === 'left' ? iconNode : null}
        <span className="btn__label min-w-0">
          <span className="truncate">{target.title}</span>
        </span>
        {iconPosition === 'right' ? iconNode : null}
      </span>
    </Link>
  );
}

/** Previous and next item buttons for a module. Renders nothing when neither exists. */
export function LessonPager({ prev, next }: LessonPagerProps) {
  if (!prev && !next) return null;

  return (
    <nav aria-label="Module items" className="flex flex-wrap items-center gap-3">
      {prev ? <PagerLink target={prev} icon="arrow-left" iconPosition="left" /> : null}
      {next ? (
        <PagerLink target={next} icon="arrow-right" iconPosition="right" className="ml-auto" />
      ) : null}
    </nav>
  );
}
