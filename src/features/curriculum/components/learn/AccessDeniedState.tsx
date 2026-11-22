import { Link } from 'react-router-dom';
import { Button, EmptyState, Icon } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import type { CourseAccessDto } from '@/features/curriculum/types';

interface AccessDeniedStateProps {
  reason: CourseAccessDto['reason'] | null;
  onBack: () => void;
}

/** Shown in place of course content when the learner cannot access the course. */
export function AccessDeniedState({ reason, onBack }: AccessDeniedStateProps) {
  if (reason === 'not_entitled') {
    return (
      <EmptyState
        icon="lock"
        title="This course needs a plan"
        action={
          <Link to={ROUTES.BILLING} className="btn btn--primary btn--md motion-press">
            <span className="btn__content">
              <span className="btn__icon" aria-hidden="true">
                <Icon name="rocket" size={18} />
              </span>
              <span className="btn__label">Upgrade</span>
            </span>
          </Link>
        }
      />
    );
  }

  return (
    <EmptyState
      icon="lock"
      title="You do not have access to this course"
      action={
        <Button variant="secondary" onClick={onBack}>
          Go back
        </Button>
      }
    />
  );
}
