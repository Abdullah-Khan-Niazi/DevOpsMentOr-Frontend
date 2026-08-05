import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import '../styles/site.css';

interface SiteLayoutProps {
  children: ReactNode;
  /** Atmosphere variant — `sober` for §5.8 Security & Trust (--gradient-atmosphere-sober) */
  atmosphere?: 'default' | 'sober';
}

// SiteLayout wraps every public platform page.
// It resets the app-shell's overflow:hidden without touching globals.css body/html rules,
// forces --color-bg-void as the page canvas, and renders SiteHeader + SiteFooter around the page content.

export function SiteLayout({ children, atmosphere = 'default' }: SiteLayoutProps) {
  return (
    // .site-root: overrides #root overflow:hidden, sets bg-void, sets font-body
    <div className="site-root">
      {/* Fixed atmosphere gradient — does not scroll */}
      <div
        className={`site-atmosphere ${atmosphere === 'sober' ? 'site-atmosphere--sober' : ''}`.trim()}
        aria-hidden="true"
      />

      <SiteHeader />

      {/* Main content — padded below the 64px fixed header */}
      <main style={{ paddingTop: '64px', position: 'relative', zIndex: 1 }}>{children}</main>

      <SiteFooter />
    </div>
  );
}
