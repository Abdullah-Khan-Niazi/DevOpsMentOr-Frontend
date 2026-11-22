import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scroll-to-top on route change. SPA navigation preserves the previous page's
// scroll position; entering a shorter page from a scrolled-down state clamps
// to the document bottom. Reset on every pathname change, instantly: `html`
// has `scroll-behavior: smooth`, so the behavior must be explicit or the reset
// animates (page transitions handle their own motion).
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
