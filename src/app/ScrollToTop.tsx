import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scroll-to-top on route change. SPA navigation preserves the previous page's
// scroll position; entering a shorter page from a scrolled-down state clamps
// to the document bottom. Reset on every pathname change — instant, no
// animated scroll (page transitions handle their own motion).
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
