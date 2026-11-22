import { forwardRef, type InputHTMLAttributes } from 'react';
import { FieldError } from '@/shared/components/Field/FieldError';
import { cn } from '@/shared/utils';
import './Input.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** @deprecated Helper text is being removed app-wide (F1b deletes this prop). */
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    const errorId = inputId ? `${inputId}-error` : undefined;
    const hintId = inputId ? `${inputId}-hint` : undefined;

    return (
      <div className="input-root">
        {label ? (
          <label htmlFor={inputId} className="input-label">
            {label}
            {props.required ? (
              <span className="text-signal ml-0.5" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn('input-field', error && 'input-field--error', className)}
          aria-invalid={Boolean(error) || undefined}
          aria-errormessage={error ? errorId : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
        />
        <FieldError id={errorId} message={error} />
        {!error && hint ? (
          <p id={hintId} className="input-hint">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
