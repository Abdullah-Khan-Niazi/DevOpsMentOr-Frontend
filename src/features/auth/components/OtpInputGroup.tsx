import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

// 6-cell controlled numeric OTP input (§10: six numeric digits, auto-advance,
// backspace recede, paste support, SMS autofill, focus-visible per §8).

interface OtpInputGroupProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
}

const DIGITS_ONLY = /^\d*$/;

export function OtpInputGroup({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  'aria-label': ariaLabel = 'One-time code',
}: OtpInputGroupProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Always render exactly `length` cells regardless of whether `value` is empty or partially filled.
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const focusIndex = (index: number) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      // Select the cell so typing immediately overwrites the digit.
      el.select();
    }
  };

  const updateDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    // Join and trim trailing spaces so the value string stays clean.
    onChange(next.join('').trimEnd().slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    // Strip non-digits; take only the last character typed (handles browsers
    // that fire onChange with the full composited value).
    const digit = raw.replace(/\D/g, '');
    if (!digit) {
      // Clear the cell but don't move focus — user may be backspacing.
      updateDigit(index, '');
      return;
    }

    updateDigit(index, digit[digit.length - 1]);

    // Auto-advance to the next empty cell, or the cell right after this one.
    if (index < length - 1) {
      focusIndex(index + 1);
    } else {
      inputsRef.current[index]?.blur();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      if (digits[index]) {
        // Clear the current cell first.
        updateDigit(index, '');
      } else if (index > 0) {
        // Cell is already empty: move back and clear.
        event.preventDefault();
        updateDigit(index - 1, '');
        focusIndex(index - 1);
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted.padEnd(length, '').slice(0, length).trimEnd());
    // Move focus to just after the last pasted digit (or last cell).
    focusIndex(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="otp-input-group" role="group" aria-label={ariaLabel}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          className="otp-input"
          type="text"
          inputMode="numeric"
          // maxLength=1 ensures browsers don't accept multi-char input and
          // allows SMS autofill (autocomplete="one-time-code" only on cell 0).
          maxLength={1}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && index === 0}
          value={DIGITS_ONLY.test(digit) ? digit : ''}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          aria-invalid="false"
        />
      ))}
    </div>
  );
}
