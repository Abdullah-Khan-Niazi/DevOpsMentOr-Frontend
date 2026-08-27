import { useLayoutEffect, useRef, useState } from 'react';
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

/**
 * Global TabRow with sliding underline (§7.1 micro-interactions):
 * the indicator slides via `transform` + width, `--duration-base`,
 * `--ease-standard`. Plain text labels only — no status pills.
 */
export function TabRow({ items, activeId, onChange }: TabRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const active = row.querySelector<HTMLButtonElement>(`[data-tab-id="${CSS.escape(activeId)}"]`);
    if (!active) return;
    setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
  }, [activeId, items]);

  return (
    <div ref={rowRef} className="relative flex border-b border-border">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          data-tab-id={item.id}
          onClick={() => onChange(item.id)}
          aria-selected={item.id === activeId}
          role="tab"
          className={cn(
            'rounded-t-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-card-foreground',
            item.id === activeId && 'text-brand-700',
          )}
        >
          {item.label}
        </button>
      ))}
      {indicator ? (
        <span
          aria-hidden="true"
          className="absolute bottom-0 h-0.5 bg-brand-600 transition-[transform,width] duration-[280ms] ease-[var(--ease-standard)]"
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
        />
      ) : null}
    </div>
  );
}

export default TabRow;
