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
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  withArrow = false,
  icon,
  iconPosition = 'left',
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn('btn', `btn--${variant}`, `btn--${size}`, isLoading && 'btn--loading', className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="btn__spinner-wrap" aria-hidden="true">
          <svg className="btn__spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </span>
      ) : icon && iconPosition === 'left' ? (
        <span className="btn__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}

      <span className="btn__label">{children}</span>

      {!isLoading && icon && iconPosition === 'right' ? (
        <span className="btn__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}

      {!isLoading && withArrow && (
        <span className="btn__arrow" aria-hidden="true">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="btn__arrow-svg"
          >
            <path d="M3.5 8h9M8.5 4l4 4-4 4" />
          </svg>
        </span>
      )}
    </button>
  );
}
