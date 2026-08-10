import type { HTMLAttributes, ReactNode } from 'react';
import './Card.css';

// Global Card primitive.
// Surface: --color-bg-raised; Border: 1px solid --color-border-default;
// Radius: --radius-md (10px); Padding: --space-6/--space-8.
// Interactive hover: translateY(-2px), border brightens, --shadow-md.

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  highlighted?: boolean;
  children: ReactNode;
}

export function Card({
  interactive = false,
  highlighted = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const classes = [
    'card',
    interactive ? 'card--interactive' : '',
    highlighted ? 'card--highlighted' : '',
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
