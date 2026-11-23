import { forwardRef, type SelectHTMLAttributes } from 'react';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/utils';
import { FieldError } from './FieldError';
import { FieldLabel } from './FieldLabel';
import { fieldIds } from './fieldIds';

export interface SelectOptionItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  /** Options; `children` may be used instead for custom `<option>` markup. */
  options?: ReadonlyArray<SelectOptionItem>;
  /** Leading empty option (for example "Select a course"). */
  placeholder?: string;
  size?: 'sm' | 'md';
  /** Shrink-wraps the select control for horizontal filter bars instead of stretching 100% width. */
  inline?: boolean;
}

/** Native `<select>` (keyboard and mobile behavior kept) with a Material chevron. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, options, placeholder, size = 'md', inline = false, className, id, children, ...props },
    ref,
  ) => {
    const fieldId = id ?? props.name;
    const { errorId } = fieldIds(fieldId);

    return (
      <div className={cn('input-root', inline && 'input-root--inline')}>
        <FieldLabel htmlFor={fieldId} label={label} required={props.required} />
        <div className={cn('field-select', size === 'sm' && 'field-select--sm')}>
          <select
            ref={ref}
            id={fieldId}
            className={cn('input-field', error && 'input-field--error', className)}
            aria-invalid={Boolean(error) || undefined}
            aria-errormessage={error ? errorId : undefined}
            aria-describedby={error ? errorId : undefined}
            {...props}
          >
            {placeholder !== undefined ? (
              <option value="" disabled={props.required}>
                {placeholder}
              </option>
            ) : null}
            {options?.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
            {children}
          </select>
          <Icon name="chevron-down" size={18} className="field-select__chevron" />
        </div>
        <FieldError id={errorId} message={error} />
      </div>
    );
  },
);

Select.displayName = 'Select';
