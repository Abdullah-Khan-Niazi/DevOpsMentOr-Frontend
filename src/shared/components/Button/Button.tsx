import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/utils';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  withArrow?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  withArrow = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn('btn', `btn--${variant}`, `btn--${size}`, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading…' : children}
      {!isLoading && withArrow && (
        <span className="btn__arrow" aria-hidden="true">
          →
        </span>
      )}
    </button>
  );
}
