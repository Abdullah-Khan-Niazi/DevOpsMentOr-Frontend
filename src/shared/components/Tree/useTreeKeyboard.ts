import type { KeyboardEvent } from 'react';

const ITEM_SELECTOR = '[role="treeitem"]';

function treeOf(element: HTMLElement): HTMLElement | null {
  return element.closest<HTMLElement>('[role="tree"]');
}

/** Tree items currently visible (not inside a collapsed, inert group). */
export function getVisibleTreeItems(tree: HTMLElement): HTMLElement[] {
  return Array.from(tree.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
    (item) => !item.closest('[inert]'),
  );
}

/** Moves the roving tab stop to `item` and focuses it. */
export function focusTreeItem(item: HTMLElement | null | undefined): void {
  if (!item) return;
  const tree = treeOf(item);
  if (tree) {
    tree.querySelectorAll<HTMLElement>(ITEM_SELECTOR).forEach((node) => {
      node.tabIndex = node === item ? 0 : -1;
    });
  }
  item.focus();
}

function parentItem(item: HTMLElement): HTMLElement | null {
  return item.parentElement?.closest<HTMLElement>(ITEM_SELECTOR) ?? null;
}

function siblingItems(item: HTMLElement): HTMLElement[] {
  const group = item.parentElement;
  if (!group) return [];
  return Array.from(group.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement && node.matches(ITEM_SELECTOR),
  );
}

interface TreeKeyboardOptions {
  expandable: boolean;
  open: boolean;
  onToggle: () => void;
  onActivate?: () => void;
}

/**
 * WAI-ARIA treeview keys for one item: Up/Down (visible items), Right (expand,
 * then first child), Left (collapse, then parent), Home/End, Enter/Space
 * (activate), `*` (expand all siblings). Keys typed inside row controls are ignored.
 */
export function useTreeKeyboard({ expandable, open, onToggle, onActivate }: TreeKeyboardOptions) {
  return function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const item = event.currentTarget;
    if (event.target !== item || event.altKey || event.ctrlKey || event.metaKey) return;
    const tree = treeOf(item);
    if (!tree) return;
    const visible = getVisibleTreeItems(tree);
    const index = visible.indexOf(item);

    switch (event.key) {
      case 'ArrowDown':
        focusTreeItem(visible[index + 1]);
        break;
      case 'ArrowUp':
        focusTreeItem(visible[index - 1]);
        break;
      case 'Home':
        focusTreeItem(visible[0]);
        break;
      case 'End':
        focusTreeItem(visible[visible.length - 1]);
        break;
      case 'ArrowRight':
        if (expandable && !open) onToggle();
        else if (expandable && open) {
          const firstChild = item.querySelector<HTMLElement>(`:scope ${ITEM_SELECTOR}`);
          if (firstChild && !firstChild.closest('[inert]')) focusTreeItem(firstChild);
        }
        break;
      case 'ArrowLeft':
        if (expandable && open) onToggle();
        else focusTreeItem(parentItem(item));
        break;
      case 'Enter':
      case ' ':
        if (onActivate) onActivate();
        else if (expandable) onToggle();
        break;
      case '*':
        siblingItems(item).forEach((sibling) => {
          if (sibling.getAttribute('aria-expanded') === 'false') {
            sibling
              .querySelector<HTMLButtonElement>(':scope > .tree-row [data-tree-toggle]')
              ?.click();
          }
        });
        break;
      default:
        return;
    }
    event.preventDefault();
  };
}
