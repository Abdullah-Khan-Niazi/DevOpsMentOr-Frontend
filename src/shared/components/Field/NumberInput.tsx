import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/utils';
import { FieldError } from './FieldError';
import { FieldLabel } from './FieldLabel';
import { fieldIds } from './fieldIds';
import './Field.css';

export interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'inputMode'
> {
  label?: string;
  error?: string;
  /** `null` renders an empty field. */
  value: number | null;
  /** Receives the parsed number, or `null` when the text is empty or not a number. */
  onValueChange: (next: number | null) => void;
  /** Allow decimals (default integers only). */
  allowDecimal?: boolean;
}

const INTEGER_RE = /^-?\d+$/;
const DECIMAL_RE = /^-?(\d+\.?\d*|\.\d+)$/;

function parseNumber(raw: string, allowDecimal: boolean): number | null {
  const text = raw.trim();
  if (text === '') return null;
  if (!(allowDecimal ? DECIMAL_RE : INTEGER_RE).test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function display(value: number | null): string {
  return value === null || Number.isNaN(value) ? '' : String(value);
}

/**
 * Numeric field that reports `number | null`, never `NaN`. It keeps the typed
 * text (so partial input such as `1.` is not wiped) and leaves range checks
 * (`min`/`max`) to the caller's validation.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, error, value, onValueChange, allowDecimal = false, className, id, ...props }, ref) => {
    const fieldId = id ?? props.name;
    const { errorId } = fieldIds(fieldId);
    const [draft, setDraft] = useState(() => display(value));
    const [previousValue, setPreviousValue] = useState(value);

    // External value changes (form reset, server data) replace the draft.
    if (value !== previousValue) {
      setPreviousValue(value);
      if (parseNumber(draft, allowDecimal) !== value) setDraft(display(value));
    }

    return (
      <div className="input-root field-number">
        <FieldLabel htmlFor={fieldId} label={label} required={props.required} />
        <input
          ref={ref}
          id={fieldId}
          type="text"
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          autoComplete="off"
          className={cn('input-field', error && 'input-field--error', className)}
          aria-invalid={Boolean(error) || undefined}
          aria-errormessage={error ? errorId : undefined}
          aria-describedby={error ? errorId : undefined}
          value={draft}
          onChange={(event) => {
            const raw = event.target.value;
            setDraft(raw);
            const parsed = parseNumber(raw, allowDecimal);
            setPreviousValue(parsed);
            onValueChange(parsed);
          }}
          {...props}
        />
        <FieldError id={errorId} message={error} />
      </div>
    );
  },
);

NumberInput.displayName = 'NumberInput';
