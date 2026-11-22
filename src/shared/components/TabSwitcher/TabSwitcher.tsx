import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Icon, type IconName } from '@/shared/components/Icon';
import { cn } from '@/shared/utils';
import './TabSwitcher.css';

export interface TabSwitcherItem<T extends string> {
  id: T;
  label: string;
  icon?: IconName;
  disabled?: boolean;
}

export interface TabSwitcherProps<T extends string> {
  items: ReadonlyArray<TabSwitcherItem<T>>;
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  /** When set, tabs reference `${idPrefix}-panel-${id}` panels (see `TabPanel`). */
  idPrefix?: string;
  className?: string;
}

function tabId(idPrefix: string, id: string) {
  return `${idPrefix}-tab-${id}`;
}

function panelId(idPrefix: string, id: string) {
  return `${idPrefix}-panel-${id}`;
}

/**
 * Segmented in-page switcher (WAI-ARIA tabs, automatic activation).
 * Arrow keys, Home and End move focus and activate; the active fill is a
 * thumb that slides between tabs with the snappy spring.
 */
export function TabSwitcher<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  size = 'sm',
  idPrefix,
  className,
}: TabSwitcherProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLButtonElement>(`[data-tab-id="${CSS.escape(value)}"]`);
    if (!active) {
      setThumb(null);
      return;
    }
    setThumb({ left: active.offsetLeft, width: active.offsetWidth });
  }, [value]);

  useLayoutEffect(() => {
    measure();
  }, [measure, items]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(list);
    list.querySelectorAll('[data-tab-id]').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [measure, items]);

  // Enable the slide transition only after the first placement (no slide-in from 0).
  useLayoutEffect(() => {
    if (thumb && !ready) {
      const frame = window.requestAnimationFrame(() => setReady(true));
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, [thumb, ready]);

  const enabled = items.filter((item) => !item.disabled);

  function focusAndSelect(next: TabSwitcherItem<T> | undefined) {
    if (!next) return;
    const button = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-tab-id="${CSS.escape(next.id)}"]`,
    );
    button?.focus();
    if (next.id !== value) onChange(next.id);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (enabled.length === 0) return;
    const currentIndex = enabled.findIndex((item) => item.id === value);
    let next: TabSwitcherItem<T> | undefined;
    switch (event.key) {
      case 'ArrowRight':
        next = enabled[(currentIndex + 1 + enabled.length) % enabled.length];
        break;
      case 'ArrowLeft':
        next = enabled[(currentIndex - 1 + enabled.length) % enabled.length];
        break;
      case 'Home':
        next = enabled[0];
        break;
      case 'End':
        next = enabled[enabled.length - 1];
        break;
      default:
        return;
    }
    event.preventDefault();
    focusAndSelect(next);
  }

  // Roving tabindex: the active tab is focusable; if it is missing or disabled, the first enabled one.
  const focusableId = enabled.some((item) => item.id === value) ? value : enabled[0]?.id;

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn('tab-switcher tab-switcher--thumb', `tab-switcher--${size}`, className)}
      onKeyDown={handleKeyDown}
    >
      {thumb ? (
        <span
          aria-hidden="true"
          className="tab-switcher__thumb"
          data-ready={ready ? 'true' : 'false'}
          style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }}
        />
      ) : null}
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            data-tab-id={item.id}
            id={idPrefix ? tabId(idPrefix, item.id) : undefined}
            aria-selected={active}
            aria-controls={idPrefix ? panelId(idPrefix, item.id) : undefined}
            tabIndex={item.id === focusableId ? 0 : -1}
            disabled={item.disabled}
            className={cn('tab-switcher__tab', active && 'tab-switcher__tab--active')}
            onClick={() => {
              if (!active) onChange(item.id);
            }}
          >
            {item.icon ? <Icon name={item.icon} size={size === 'md' ? 18 : 16} /> : null}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps {
  idPrefix: string;
  id: string;
  active: boolean;
  children: ReactNode;
  className?: string;
  /** Keep inactive panels mounted (hidden) to preserve their state. */
  keepMounted?: boolean;
}

export function TabPanel({
  idPrefix,
  id,
  active,
  children,
  className,
  keepMounted = false,
}: TabPanelProps) {
  if (!active && !keepMounted) return null;
  return (
    <div
      role="tabpanel"
      id={panelId(idPrefix, id)}
      aria-labelledby={tabId(idPrefix, id)}
      hidden={!active}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}
