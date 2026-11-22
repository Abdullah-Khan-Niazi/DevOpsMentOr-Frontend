import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '@/shared/components/Icon';
import { cn } from '@/shared/utils';
import './IconButton.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** Accessible name; also shown as the hover/focus tooltip. */
  label: string;
  size?: 'sm' | 'md';
  tone?: 'default' | 'danger';
  isLoading?: boolean;
  /** Toggle state (`aria-pressed`); omit for plain actions. */
  pressed?: boolean;
  filled?: boolean;
  /** Set false where a visible label already sits next to the button. */
  showTooltip?: boolean;
  tooltipSide?: 'top' | 'bottom';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      size = 'md',
      tone = 'default',
      isLoading = false,
      pressed,
      filled = false,
      showTooltip = true,
      tooltipSide = 'bottom',
      disabled,
      className,
      type = 'button',
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      aria-busy={isLoading || undefined}
      data-tooltip={showTooltip ? label : undefined}
      data-tooltip-side={showTooltip && tooltipSide === 'top' ? 'top' : undefined}
      disabled={disabled || isLoading}
      className={cn(
        'icon-btn',
        `icon-btn--${size}`,
        tone === 'danger' && 'icon-btn--danger',
        showTooltip && 'has-tooltip',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <span className="spin-ring icon-btn__spinner" aria-hidden="true" />
      ) : (
        <Icon name={icon} size={size === 'sm' ? 18 : 20} filled={filled} selected={pressed} />
      )}
    </button>
  ),
);

IconButton.displayName = 'IconButton';
