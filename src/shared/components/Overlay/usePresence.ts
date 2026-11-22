import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';

/**
 * Keeps an overlay mounted while its exit animation plays.
 * `closing` is true between `open` turning false and the unmount.
 */
export function usePresence(open: boolean, exitMs: number): { mounted: boolean; closing: boolean } {
  const reducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(open);

  if (open && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (open || !mounted) return;
    const timer = window.setTimeout(() => setMounted(false), reducedMotion ? 0 : exitMs);
    return () => window.clearTimeout(timer);
  }, [open, mounted, exitMs, reducedMotion]);

  return { mounted, closing: mounted && !open };
}
