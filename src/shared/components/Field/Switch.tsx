import { forwardRef, useId, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/utils';
import { FieldError } from './FieldError';
import './Field.css';

export interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'children' | 'value'
> {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  /** Visible label; when omitted, pass `aria-label`. */
  label?: string;
  /** Hide the visible label but keep it as the accessible name. */
  hideLabel?: boolean;
  isLoading?: boolean;
  error?: string;
  size?: 'sm' | 'md';
}

/** `role="switch"` toggle with a spring thumb (replaces bespoke publish toggles). */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      label,
      hideLabel = false,
      isLoading = false,
      error,
      size = 'md',
      disabled,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const switchId = id ?? generatedId;
    const labelId = `${switchId}-label`;
    const errorId = `${switchId}-error`;
    const inactive = disabled || isLoading;

    return (
      <div className={cn('inline-flex flex-col gap-1', className)}>
        <span
          className={cn(
            'field-switch',
            size === 'sm' && 'field-switch--sm',
            inactive && 'field-switch--disabled',
          )}
        >
          <button
            ref={ref}
            id={switchId}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-labelledby={label ? labelId : undefined}
            aria-busy={isLoading || undefined}
            aria-invalid={Boolean(error) || undefined}
            aria-errormessage={error ? errorId : undefined}
            disabled={inactive}
            className="field-switch__track"
            onClick={() => onCheckedChange(!checked)}
            {...props}
          >
            <span className="field-switch__thumb" aria-hidden="true">
              {isLoading ? <span className="spin-ring" /> : null}
            </span>
          </button>
          {label ? (
            <span
              id={labelId}
              className={cn('field-switch__label', hideLabel && 'sr-only')}
              onClick={() => {
                if (!inactive) onCheckedChange(!checked);
              }}
            >
              {label}
            </span>
          ) : null}
        </span>
        <FieldError id={errorId} message={error} />
      </div>
    );
  },
);

Switch.displayName = 'Switch';
