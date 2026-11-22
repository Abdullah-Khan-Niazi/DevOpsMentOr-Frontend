import { useId, type ReactNode } from 'react';
import { cn } from '@/shared/utils';
import { FieldError } from './FieldError';
import './Field.css';

export interface RadioOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string> {
  name?: string;
  label: string;
  /** Visually hide the legend (keeps it as the group name). */
  hideLabel?: boolean;
  options: ReadonlyArray<RadioOption<T>>;
  value: T | null;
  onChange: (next: T) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  direction?: 'column' | 'row';
  className?: string;
}

/** Native radio inputs in a fieldset (arrow keys move the selection natively). */
export function RadioGroup<T extends string>({
  name,
  label,
  hideLabel = false,
  options,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  direction = 'column',
  className,
}: RadioGroupProps<T>) {
  const generatedId = useId();
  const groupName = name ?? generatedId;
  const errorId = `${groupName}-error`;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <fieldset
        className={cn('field-radio-group', direction === 'row' && 'field-radio-group--row')}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        aria-errormessage={error ? errorId : undefined}
      >
        <legend className={cn('input-label', hideLabel && 'sr-only')}>
          {label}
          {required ? (
            <span className="text-signal ml-0.5" aria-hidden="true">
              *
            </span>
          ) : null}
        </legend>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn('field-check', (disabled || option.disabled) && 'field-check--disabled')}
          >
            <input
              type="radio"
              className="field-check__input"
              name={groupName}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              required={required}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
