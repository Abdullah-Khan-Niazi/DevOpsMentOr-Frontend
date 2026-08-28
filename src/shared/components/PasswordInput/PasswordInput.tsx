import { useState, type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/utils';
import './PasswordInput.css';

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1.91 1.91 0 0 1 0 1.698 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1.91 1.91 0 0 1 0-1.698 10.75 10.75 0 0 1 4.446-5.253" />
      <path d="m2 2 20 20" />
    </svg>
  );
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
            aria-invalid={Boolean(error)}
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
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="input-error">
            {error}
          </p>
        ) : null}
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
