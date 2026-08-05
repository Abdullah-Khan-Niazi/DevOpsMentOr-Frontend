import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './SiteButton.css';

// §3.3 — Public site button variants
// Hard rules: --radius-sm on all buttons, max one primary per viewport section.
// Arrow (→) only on the single highest-priority CTA per page.
// Sizes: sm=36px / md=44px (default) / lg=52px (hero only)

type SiteButtonVariant = 'primary' | 'secondary' | 'ghost';
type SiteButtonSize = 'sm' | 'md' | 'lg';

export interface SiteButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SiteButtonVariant;
  size?: SiteButtonSize;
  withArrow?: boolean;
  children: ReactNode;
}

export function SiteButton({
  variant = 'primary',
  size = 'md',
  withArrow = false,
  className = '',
  children,
  ...props
}: SiteButtonProps) {
  return (
    <button
      type="button"
      className={`site-btn site-btn--${variant} site-btn--${size} ${className}`.trim()}
      {...props}
    >
      {children}
      {withArrow && (
        <span className="site-btn__arrow" aria-hidden="true">
          →
        </span>
      )}
    </button>
  );
}
