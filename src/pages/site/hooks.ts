import { useEffect, useRef, useState } from 'react';

// ─── useScrollReveal ─────────────────────────────────────────────────────────
// §6.2: IntersectionObserver-driven reveal. Fires once, does not replay.
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '-8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

// ─── useInViewOnce ───────────────────────────────────────────────────────────
// Reports true once the element enters the viewport (and stays true). Used for
// scroll-into-view resets (Product Showcase default tab) and one-shot triggers.
export function useInViewOnce<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '-8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ─── useInView ───────────────────────────────────────────────────────────────
// Continuous viewport membership — true while the element intersects, false
// when it leaves. Used for tab resets that must re-trigger per scroll-into-view.
export function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ─── useMediaQuery ───────────────────────────────────────────────────────────
// Desktop-first default (true) — SSR-safe.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ─── useReducedMotion ────────────────────────────────────────────────────────
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

// ─── useParallaxPlane ────────────────────────────────────────────────────────
// §6.1 three z-planes (homepage): background plane 0.4×, content 1×, foreground
// 1.15×, max ~24px offset over a full section. translateY via rAF. Disabled
// below 768px (handled by caller via useMediaQuery).
export function useParallaxPlane<T extends HTMLElement = HTMLDivElement>(
  speed: number,
  enabled = true,
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const MAX_OFFSET = 24;
    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress of the element's center through the viewport: -1 (above) → 1 (below)
      const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - vh / 2) / (vh / 2)));
      el.style.transform = `translateY(${progress * speed * MAX_OFFSET}px)`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed, enabled]);

  return ref;
}
