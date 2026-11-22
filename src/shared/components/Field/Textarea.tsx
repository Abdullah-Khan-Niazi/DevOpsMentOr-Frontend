import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/utils';
import { FieldError } from './FieldError';
import { FieldLabel } from './FieldLabel';
import { fieldIds } from './fieldIds';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  /** Monospace (commands, code, markdown source). */
  mono?: boolean;
  /** Shows `length / maxLength` next to the label when `maxLength` is set. */
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, mono = false, showCount = false, className, id, ...props }, ref) => {
    const fieldId = id ?? props.name;
    const { errorId } = fieldIds(fieldId);
    const length = typeof props.value === 'string' ? props.value.length : null;
    const counter =
      showCount && props.maxLength !== undefined && length !== null ? (
        <span
          className={cn('field-counter', length > props.maxLength && 'field-counter--over')}
          aria-live="polite"
        >
          {length} / {props.maxLength}
        </span>
      ) : null;

    return (
      <div className="input-root">
        <FieldLabel htmlFor={fieldId} label={label} required={props.required} aside={counter} />
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            'input-field field-textarea',
            mono && 'field-textarea--mono',
            error && 'input-field--error',
            className,
          )}
          aria-invalid={Boolean(error) || undefined}
          aria-errormessage={error ? errorId : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        <FieldError id={errorId} message={error} />
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
