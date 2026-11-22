import type { ReactNode } from 'react';
import { Collapsible } from '@/shared/components/Collapsible';
import { ErrorState } from '@/shared/components/ErrorState';
import { Icon, type IconName } from '@/shared/components/Icon';
import { TreeSkeleton } from '@/shared/components/Skeleton';
import { cn } from '@/shared/utils';
import { useTreeKeyboard } from './useTreeKeyboard';

export interface TreeItemProps {
  id: string;
  /** 1-based depth. */
  level: number;
  label: ReactNode;
  meta?: ReactNode;
  icon?: IconName;
  expandable: boolean;
  open: boolean;
  onToggle: () => void;
  /** Enter/Space and row click (for example "open the edit drawer"). */
  onActivate?: () => void;
  selected?: boolean;
  muted?: boolean;
  /** Revealed on hover/focus-within while collapsed, or on leaves. */
  actions?: ReactNode;
  /** Always visible while expanded. */
  headerActions?: ReactNode;
  /** Centered last row while expanded (for example "Add module"). */
  footerActions?: ReactNode;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Extra class on the row (for example `flash-new` after create). */
  rowClassName?: string;
  children?: ReactNode;
}

const INDENT_REM = 1.25;

export function TreeItem({
  id,
  level,
  label,
  meta,
  icon,
  expandable,
  open,
  onToggle,
  onActivate,
  selected = false,
  muted = false,
  actions,
  headerActions,
  footerActions,
  loading = false,
  error,
  onRetry,
  rowClassName,
  children,
}: TreeItemProps) {
  const handleKeyDown = useTreeKeyboard({ expandable, open, onToggle, onActivate });
  const expanded = expandable && open;
  const rowActions = expanded ? (headerActions ?? null) : (actions ?? null);
  const childIndent = `${level * INDENT_REM + 0.5}rem`;

  return (
    <li
      role="treeitem"
      aria-level={level}
      aria-expanded={expandable ? open : undefined}
      aria-selected={selected}
      aria-busy={loading || undefined}
      data-tree-id={id}
      tabIndex={-1}
      className="tree-item"
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          'tree-row',
          selected && 'tree-row--selected',
          muted && 'tree-row--muted',
          rowClassName,
        )}
        style={{ paddingInlineStart: `${(level - 1) * INDENT_REM + 0.25}rem` }}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('.tree-row__actions')) return;
          if (onActivate) onActivate();
          else if (expandable) onToggle();
        }}
      >
        {expandable ? (
          <button
            type="button"
            className="tree-row__toggle"
            tabIndex={-1}
            aria-hidden="true"
            data-tree-toggle=""
            data-open={open ? 'true' : 'false'}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
          >
            <Icon name="chevron-right" size={18} />
          </button>
        ) : (
          <span className="tree-row__spacer" aria-hidden="true" />
        )}
        {icon ? (
          <Icon name={icon} size={18} selected={selected} className="tree-row__icon" />
        ) : null}
        <span className="tree-row__label">{label}</span>
        {meta ? <span className="tree-row__meta">{meta}</span> : null}
        {rowActions ? (
          <span className={cn('tree-row__actions', !expanded && 'tree-row__actions--reveal')}>
            {rowActions}
          </span>
        ) : null}
      </div>
      {expandable ? (
        <Collapsible open={open}>
          <ul role="group" className="tree-group">
            {loading ? (
              <li role="none" className="tree-status" style={{ paddingInlineStart: childIndent }}>
                <TreeSkeleton rows={2} depth={0} />
              </li>
            ) : error ? (
              <li role="none" className="tree-status" style={{ paddingInlineStart: childIndent }}>
                <ErrorState compact error={error} onRetry={onRetry} />
              </li>
            ) : (
              children
            )}
            {footerActions && !loading && !error ? (
              <li role="none" className="tree-footer">
                {footerActions}
              </li>
            ) : null}
          </ul>
        </Collapsible>
      ) : null}
    </li>
  );
}
