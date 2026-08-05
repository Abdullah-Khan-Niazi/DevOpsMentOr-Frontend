import type { HTMLAttributes, ReactNode } from 'react';
import './SiteCard.css';

// §3.4 — SiteCard component (public site card primitive)
// Surface: --color-bg-raised (#16191D)
// Border:  1px solid --color-border-default (#292E34)
// Radius:  --radius-md (10px)
// Padding: --space-6 (1.5rem) / --space-8 (2rem)
// Interactive hover: translateY(-2px), border brightens, --shadow-md

export interface SiteCardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  highlighted?: boolean; // For query param highlight (?inquiry=institution)
  children: ReactNode;
}

export function SiteCard({
  interactive = false,
  highlighted = false,
  className = '',
  children,
  ...props
}: SiteCardProps) {
  const classes = [
    'site-card',
    interactive ? 'site-card--interactive' : '',
    highlighted ? 'site-card--highlighted' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
