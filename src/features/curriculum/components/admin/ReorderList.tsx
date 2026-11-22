import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { Icon } from '@/shared/components';
import { cn } from '@/shared/utils';

// Ordered list reordered by dragging the handle or with Alt+ArrowUp / Alt+ArrowDown
// on a focused row. The component is controlled: it reports the next id order through
// `onReorder` and renders whatever `items` the caller passes back.

export interface ReorderListProps<T> {
  items: T[];
  getId(item: T): number | string;
  renderItem(item: T): ReactNode;
  onReorder(nextIds: Array<number | string>): void;
  disabled?: boolean;
  /** Accessible name of the list. */
  ariaLabel?: string;
}

const ROW_TRANSITION = 'transform var(--duration-base) var(--ease-apple)';

interface DragState {
  id: number | string;
  from: number;
  /** Index the row would land on if released now. */
  over: number;
  dy: number;
  /** Vertical distance between neighbouring rows (gap included). */
  stride: number;
}

interface DragStart {
  startY: number;
  centers: number[];
  tops: number[];
}

export function ReorderList<T>({
  items,
  getId,
  renderItem,
  onReorder,
  disabled = false,
  ariaLabel = 'List',
}: ReorderListProps<T>) {
  const rowRefs = useRef(new Map<number | string, HTMLLIElement>());
  const pendingFocus = useRef<number | string | null>(null);
  const dragStart = useRef<DragStart | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const id = pendingFocus.current;
    if (id === null) return;
    pendingFocus.current = null;
    rowRefs.current.get(id)?.focus();
  });

  // Escape cancels a pointer drag; preventDefault keeps an enclosing drawer open.
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dragStart.current = null;
      dragRef.current = null;
      setDrag(null);
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [dragging]);

  function announce(position: number, total: number) {
    setAnnouncement(`Moved to position ${position} of ${total}`);
  }

  function commitMove(from: number, to: number) {
    const ids = items.map(getId);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    pendingFocus.current = moved;
    announce(to + 1, items.length);
    onReorder(ids);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLLIElement>, index: number) {
    // Only the row itself; Alt+arrows typed inside a nested field keep their normal meaning.
    if (disabled || event.target !== event.currentTarget || !event.altKey) return;
    const target = event.key === 'ArrowUp' ? index - 1 : event.key === 'ArrowDown' ? index + 1 : -1;
    if (target < 0 || target >= items.length) return;
    event.preventDefault();
    commitMove(index, target);
  }

  function handleHandlePointerDown(event: PointerEvent<HTMLSpanElement>, index: number) {
    if (disabled || event.button !== 0) return;
    const ids = items.map(getId);
    const rects = ids.map((id) => rowRefs.current.get(id)?.getBoundingClientRect());
    if (rects.some((rect) => rect === undefined)) return;
    const measured = rects as DOMRect[];
    dragStart.current = {
      startY: event.clientY,
      centers: measured.map((rect) => rect.top + rect.height / 2),
      tops: measured.map((rect) => rect.top),
    };
    const from = index;
    const neighbour = from + 1 < measured.length ? from + 1 : from - 1;
    const stride = neighbour < 0 ? 0 : Math.abs(measured[neighbour].top - measured[from].top);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    const next: DragState = { id: ids[from], from, over: from, dy: 0, stride };
    dragRef.current = next;
    setDrag(next);
  }

  function handleHandlePointerMove(event: PointerEvent<HTMLSpanElement>) {
    const start = dragStart.current;
    const current = dragRef.current;
    if (!start || !current) return;
    const dy = event.clientY - start.startY;
    const draggedCenter = start.centers[current.from] + dy;
    let over = 0;
    start.centers.forEach((center, index) => {
      if (index !== current.from && center < draggedCenter) over += 1;
    });
    const next = { ...current, dy, over };
    dragRef.current = next;
    setDrag(next);
  }

  function endDrag(commit: boolean) {
    const current = dragRef.current;
    dragStart.current = null;
    dragRef.current = null;
    setDrag(null);
    if (!commit || !current || current.over === current.from) return;
    commitMove(current.from, current.over);
  }

  function offsetFor(index: number): number {
    if (!drag) return 0;
    const { from, over, stride } = drag;
    if (index === from) return 0;
    if (from < over && index > from && index <= over) return -stride;
    if (over < from && index >= over && index < from) return stride;
    return 0;
  }

  return (
    <>
      <ul aria-label={ariaLabel} className="flex flex-col gap-2">
        {items.map((item, index) => {
          const id = getId(item);
          const isDragged = drag?.id === id;
          const offset = offsetFor(index);
          return (
            <li
              key={id}
              ref={(element) => {
                if (element) rowRefs.current.set(id, element);
                else rowRefs.current.delete(id);
              }}
              tabIndex={disabled ? -1 : 0}
              aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
              onKeyDown={(event) => handleRowKeyDown(event, index)}
              style={{
                transform:
                  isDragged && drag
                    ? `translateY(${drag.dy}px)`
                    : offset !== 0
                      ? `translateY(${offset}px)`
                      : undefined,
                // The dragged row follows the pointer 1:1; its neighbours glide aside.
                transition: isDragged ? 'none' : ROW_TRANSITION,
              }}
              className={cn(
                'flex items-start gap-2 rounded-md',
                isDragged && 'relative z-10 bg-pearl-200 shadow-md',
              )}
            >
              <span
                aria-hidden="true"
                onPointerDown={(event) => handleHandlePointerDown(event, index)}
                onPointerMove={handleHandlePointerMove}
                onPointerUp={() => endDrag(true)}
                onPointerCancel={() => endDrag(false)}
                onLostPointerCapture={() => endDrag(false)}
                className={cn(
                  'mt-2 flex shrink-0 touch-none select-none text-muted',
                  disabled ? 'opacity-40' : 'cursor-grab active:cursor-grabbing',
                )}
              >
                <Icon name="drag" size={20} />
              </span>
              <div className="min-w-0 flex-1">{renderItem(item)}</div>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </>
  );
}
