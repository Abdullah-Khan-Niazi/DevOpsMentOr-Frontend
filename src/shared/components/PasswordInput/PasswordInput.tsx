import { useState, type InputHTMLAttributes, forwardRef } from 'react';
import { FieldError } from '@/shared/components/Field/FieldError';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/utils';
import './PasswordInput.css';

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = props.id ?? props.name;

    return (
      <div className="input-root">
        {label ? (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        ) : null}
        <div className="pw-field">
          <input
            ref={ref}
            id={inputId}
            className={cn('input-field pw-field__input', error && 'input-field--error', className)}
            type={visible ? 'text' : 'password'}
            aria-invalid={Boolean(error) || undefined}
            aria-errormessage={error ? `${inputId}-error` : undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          <button
            type="button"
            className="pw-field__toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
          >
            <Icon name={visible ? 'visibility-off' : 'visibility'} size={18} />
          </button>
        </div>
        <FieldError id={inputId ? `${inputId}-error` : undefined} message={error} />
        {!error && hint ? (
          <p id={`${inputId}-hint`} className="input-hint">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
