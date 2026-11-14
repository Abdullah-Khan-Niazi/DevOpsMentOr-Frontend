import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { SiteLogo } from '@/shared/components/Logo';
import './SiteHeader.css';

// §3.1 — Floating, Compact, Shrinking Header
// Default (top):   transparent, 64px height, no border/shadow (compact)
// On scroll >80px: frosted glass (token bg + backdrop-filter), 64px height,
//                  bottom border --color-border-subtle. The ONE sanctioned glassmorphism use.
// Scroll direction: hides past 600px scrolled-down, reappears instantly on scroll-up.
// Nav: three-zone layout — logo left / nav true-center / actions right.
// Mobile (<768px): logo left, 3-line icon button right, slide-in panel (solid --color-bg-base,
//                  no blur, 48px min tap targets).

const navItems = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Curriculum', href: ROUTES.CURRICULUM },
  { label: 'Pricing', href: ROUTES.PRICING },
  { label: 'About', href: ROUTES.ABOUT },
];

export function SiteHeader() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const isActiveItem = (href: string) =>
    href === ROUTES.HOME
      ? location.pathname === ROUTES.HOME
      : location.pathname === href || location.pathname.startsWith(`${href}/`);

  useEffect(() => {
    function handleScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 80);
        // Hide on scroll-down past 600px, show immediately on scroll-up
        if (y > 600 && y > lastScrollY.current) {
          setHidden(true);
        } else {
          setHidden(false);
        }
        lastScrollY.current = y;
        ticking.current = false;
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll while the mobile panel is open
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={[
        'site-header',
        scrolled ? 'site-header--scrolled' : '',
        hidden ? 'site-header--hidden' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="banner"
    >
      <div className="site-header__inner site-container site-container--wide">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="site-header__logo" aria-label="DevOpsMentOr home">
          <SiteLogo />
        </Link>

        {/* Desktop nav — true horizontal center */}
        <nav className="site-header__nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = isActiveItem(item.href);
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`site-header__nav-item ${active ? 'site-header__nav-item--active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth CTAs */}
        <div className="site-header__actions">
          <Link to={ROUTES.LOGIN} tabIndex={-1}>
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link to={ROUTES.SIGNUP} tabIndex={-1}>
            <Button variant="primary" size="sm">
              Start free
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="site-header__menu-toggle"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="site-mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="site-header__menu-bar" />
          <span className="site-header__menu-bar" />
          <span className="site-header__menu-bar" />
        </button>
      </div>

      {/* Mobile slide-in panel */}
      <div
        id="site-mobile-menu"
        className={`site-mobile-menu ${mobileOpen ? 'site-mobile-menu--open' : ''}`}
        aria-hidden={!mobileOpen}
      >
        <div className="site-mobile-menu__inner">
          <div className="site-mobile-menu__header">
            <SiteLogo />
            <button
              type="button"
              className="site-mobile-menu__close"
              aria-label="Close menu"
              onClick={closeMobile}
            >
              ✕
            </button>
          </div>
          <nav className="site-mobile-menu__nav" aria-label="Mobile navigation">
            <div className="site-mobile-menu__group">
              {navItems.map((item) => {
                const active = isActiveItem(item.href);
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`site-mobile-menu__link ${active ? 'site-mobile-menu__link--active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={closeMobile}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="site-mobile-menu__footer flex flex-col gap-2">
            <Link to={ROUTES.LOGIN} onClick={closeMobile} tabIndex={-1} className="w-full">
              <Button variant="ghost" className="w-full justify-center" size="md">
                Log in
              </Button>
            </Link>
            <Link to={ROUTES.SIGNUP} onClick={closeMobile} tabIndex={-1} className="w-full">
              <Button variant="primary" className="w-full justify-center" size="md">
                Start free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
