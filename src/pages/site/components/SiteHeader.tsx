import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { SiteLogo } from './Logo';
import './SiteHeader.css';

// §3.1 — Floating, Compact, Shrinking Header
// Default (top):   transparent, 64px height, no border/shadow (compact)
// On scroll >80px: frosted glass (token bg + backdrop-filter), 64px height,
//                  bottom border --color-border-subtle. The ONE sanctioned glassmorphism use.
// Scroll direction: hides past 600px scrolled-down, reappears instantly on scroll-up.
// Nav: three-zone layout — logo left / nav true-center / actions right.
// Mobile (<768px): logo left, 3-line icon button right, slide-in panel (solid --color-bg-base,
//                  no blur, 48px min tap targets).

const platformItems = [
  {
    label: 'Student Labs',
    description: 'Browser-based container and Kubernetes labs',
    href: ROUTES.HOW_IT_WORKS,
  },
  {
    label: 'Instructor Tools',
    description: 'Cohort dashboards and assertion analytics',
    href: ROUTES.FOR_INSTITUTIONS,
  },
  {
    label: 'Institution & Admin',
    description: 'Multi-tenant namespace management',
    href: ROUTES.FOR_INSTITUTIONS,
  },
];

const navItems = [
  { label: 'Curriculum', href: ROUTES.CURRICULUM },
  { label: 'Pricing', href: ROUTES.PRICING },
  { label: 'About', href: ROUTES.ABOUT },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

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

  // Close dropdown on outside click
  useEffect(() => {
    if (!platformOpen) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Element;
      if (!target.closest('.site-header__dropdown-wrapper')) {
        setPlatformOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [platformOpen]);

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
          {/* Platform dropdown */}
          <div className="site-header__dropdown-wrapper">
            <button
              id="nav-platform"
              className="site-header__nav-item"
              aria-haspopup="true"
              aria-expanded={platformOpen}
              onClick={() => setPlatformOpen((v) => !v)}
            >
              Platform
              <span className="site-header__caret" aria-hidden="true">
                ▾
              </span>
            </button>
            {platformOpen && (
              <div className="site-header__dropdown" role="menu" aria-labelledby="nav-platform">
                {platformItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="site-header__dropdown-item"
                    role="menuitem"
                    onClick={() => setPlatformOpen(false)}
                  >
                    <span className="site-header__dropdown-label">{item.label}</span>
                    <span className="site-header__dropdown-desc">{item.description}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {navItems.map((item) => (
            <Link key={item.label} to={item.href} className="site-header__nav-item">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth CTAs */}
        <div className="site-header__actions">
          <Link to={ROUTES.LOGIN} className="site-header__login">
            Log in
          </Link>
          <Link to={ROUTES.SIGNUP} className="site-header__signup">
            Start free
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
              <p className="site-mobile-menu__group-label">Platform</p>
              {platformItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="site-mobile-menu__link"
                  onClick={closeMobile}
                >
                  {item.label}
                  <span className="site-mobile-menu__desc">{item.description}</span>
                </Link>
              ))}
            </div>
            <div className="site-mobile-menu__group">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="site-mobile-menu__link"
                  onClick={closeMobile}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to={ROUTES.HOW_IT_WORKS}
                className="site-mobile-menu__link"
                onClick={closeMobile}
              >
                How It Works
              </Link>
            </div>
          </nav>
          <div className="site-mobile-menu__footer">
            <Link to={ROUTES.LOGIN} className="site-mobile-menu__login" onClick={closeMobile}>
              Log in
            </Link>
            <Link to={ROUTES.SIGNUP} className="site-mobile-menu__signup" onClick={closeMobile}>
              Start free
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
