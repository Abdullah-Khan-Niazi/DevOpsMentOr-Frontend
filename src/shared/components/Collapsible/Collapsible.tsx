import type { ReactNode } from 'react';
import { cn } from '@/shared/utils';

export interface CollapsibleProps {
  open: boolean;
  children: ReactNode;
  id?: string;
  className?: string;
}

/**
 * Animated expand/collapse without measuring (grid rows 0fr -> 1fr). Closed
 * content is `inert`, so it is neither focusable nor read by assistive tech.
 */
export function Collapsible({ open, children, id, className }: CollapsibleProps) {
  return (
    <div id={id} className={cn('collapsible', className)} data-open={open ? 'true' : 'false'}>
      <div inert={!open} aria-hidden={open ? undefined : true}>
        {children}
      </div>
    </div>
  );
}
