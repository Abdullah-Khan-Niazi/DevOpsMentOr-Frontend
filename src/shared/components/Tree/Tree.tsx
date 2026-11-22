import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/shared/utils';
import { getVisibleTreeItems } from './useTreeKeyboard';
import './Tree.css';

export interface TreeProps {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}

/**
 * Keeps exactly one tab stop in the tree (roving tabindex): the focused item,
 * else the last focused one if still visible, else the first visible item.
 */
function syncTabStop(tree: HTMLElement, preferred: HTMLElement | null) {
  const all = Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]'));
  if (all.length === 0) return;
  const visible = getVisibleTreeItems(tree);
  const target =
    (preferred && visible.includes(preferred) ? preferred : null) ??
    visible.find((item) => item.tabIndex === 0) ??
    visible[0] ??
    null;
  all.forEach((item) => {
    const next = item === target ? 0 : -1;
    if (item.tabIndex !== next) item.tabIndex = next;
  });
}

/** WAI-ARIA tree container (`role="tree"`); children are `TreeItem`s. */
export function Tree({ ariaLabel, children, className }: TreeProps) {
  const treeRef = useRef<HTMLUListElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const tree = treeRef.current;
    if (!tree) return;
    syncTabStop(tree, lastFocusedRef.current);

    function handleFocusIn(event: FocusEvent) {
      const item = (event.target as HTMLElement | null)?.closest<HTMLElement>('[role="treeitem"]');
      if (!item || !tree) return;
      lastFocusedRef.current = item;
      syncTabStop(tree, item);
    }

    // Lazy children mount and groups collapse without re-rendering the tree root.
    const observer = new MutationObserver(() => syncTabStop(tree, lastFocusedRef.current));
    observer.observe(tree, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['inert'],
    });
    tree.addEventListener('focusin', handleFocusIn);
    return () => {
      observer.disconnect();
      tree.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  return (
    <ul ref={treeRef} role="tree" aria-label={ariaLabel} className={cn('tree', className)}>
      {children}
    </ul>
  );
}
