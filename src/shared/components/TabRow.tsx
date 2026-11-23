import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon, type IconName } from '@/shared/components/Icon';
import { cn } from '@/shared/utils';

export interface TabItem {
  id: string;
  label: string;
}

interface TabRowProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

interface Indicator {
  left: number;
  width: number;
}

const TAB_CLASS =
  'shrink-0 whitespace-nowrap rounded-t-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-card-foreground';

function UnderlineIndicator({ indicator }: { indicator: Indicator | null }) {
  if (!indicator) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-0 h-0.5 bg-ink transition-[transform,width] duration-(--duration-spring-snappy) ease-(--spring-snappy)"
      style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
    />
  );
}

/**
 * @deprecated In-page switches use `TabSwitcher`; the top bar uses `TabRowNav`.
 * Kept until every owner migrates (F1b removes it from the barrel).
 */
export function TabRow({ items, activeId, onChange }: TabRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<Indicator | null>(null);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const active = row.querySelector<HTMLButtonElement>(`[data-tab-id="${CSS.escape(activeId)}"]`);
    if (!active) return;
    setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
  }, [activeId, items]);

  return (
    <div ref={rowRef} role="tablist" className="relative flex max-w-full overflow-x-auto">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          data-tab-id={item.id}
          onClick={() => onChange(item.id)}
          aria-selected={item.id === activeId}
          role="tab"
          className={cn(TAB_CLASS, item.id === activeId && 'text-ink font-semibold')}
        >
          {item.label}
        </button>
      ))}
      <UnderlineIndicator indicator={indicator} />
    </div>
  );
}

export interface TabRowNavItem {
  to: string;
  label: string;
  end?: boolean;
  /** Leading icon; rendered filled (`selected`) on the active route. */
  icon: IconName;
}

interface TabRowNavProps {
  items: TabRowNavItem[];
  ariaLabel: string;
  className?: string;
}

/** Route navigation with a sliding underline. Reserved for the top bar primary navigation. */
export function TabRowNav({ items, ariaLabel, className }: TabRowNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const [indicator, setIndicator] = useState<Indicator | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const active = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
      setIndicator(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [pathname, items]);

  return (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      className={cn('relative flex max-w-full overflow-x-auto', className)}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              TAB_CLASS,
              item.icon && 'inline-flex items-center gap-2',
              isActive && 'text-ink font-semibold',
            )
          }
        >
          {({ isActive }) => (
            <>
              {item.icon ? <Icon name={item.icon} size={18} selected={isActive} /> : null}
              {item.label}
            </>
          )}
        </NavLink>
      ))}
      <UnderlineIndicator indicator={indicator} />
    </nav>
  );
}

export default TabRow;
