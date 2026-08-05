import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import './SiteHeader.css';

// §3.1 — Floating, Compact, Shrinking Header
// Default (top):   transparent, 88px height, no border/shadow
// On scroll >80px: fixed, frosted glass (rgba bg + backdrop-filter), 64px height,
//                  bottom border --color-border-subtle. The ONE sanctioned glassmorphism use.
// Scroll direction: hides past 600px scrolled-down, reappears instantly on scroll-up.

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

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
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
          <span className="site-header__logo-mark" aria-hidden="true">
            ⬡
          </span>
          <span className="site-header__logo-text">DevOpsMentOr</span>
        </Link>

        {/* Desktop nav */}
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

          <Link to={ROUTES.HOW_IT_WORKS} className="site-header__nav-item">
            How It Works
          </Link>
          <Link to={ROUTES.FOR_INSTITUTIONS} className="site-header__nav-item">
            For Institutions
          </Link>
          <Link to={ROUTES.SECURITY_TRUST} className="site-header__nav-item">
            Security
          </Link>
        </nav>

        {/* Auth CTAs */}
        <div className="site-header__actions">
          <Link to={ROUTES.LOGIN} className="site-header__login">
            Log in
          </Link>
          <Link to={ROUTES.SIGNUP} className="site-header__signup">
            Start free →
          </Link>
        </div>
      </div>
    </header>
  );
}
