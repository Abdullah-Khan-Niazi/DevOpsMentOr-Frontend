import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/shared/components/Icon';
import { cn } from '@/shared/utils';

interface EmptyStateProps {
  title: string;
  icon?: IconName;
  action?: ReactNode;
  className?: string;
}

/** Empty collection state: icon, short title and an optional action. Transparent, no border. */
export function EmptyState({ title, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'motion-fade-in flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? <Icon name={icon} size={28} className="mb-1 text-muted-foreground" /> : null}
      <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
