import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

// 6-cell controlled numeric OTP input (§10: six numeric digits, auto-advance,
// backspace recede, paste support, focus-visible per §8).

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

  const setDigit = (index: number, digit: string) => {
    const next = value.split('');
    next[index] = digit;
    onChange(next.join('').slice(0, length));
  };

  const focusIndex = (index: number) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '');
    if (!digit) {
      setDigit(index, '');
      return;
    }

    setDigit(index, digit[digit.length - 1]);

    if (index < length - 1) {
      focusIndex(index + 1);
    } else {
      inputsRef.current[index]?.blur();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
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
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    onChange(digits);
    const target = Math.min(digits.length, length - 1);
    focusIndex(target);
  };

  return (
    <div className="otp-input-group" role="group" aria-label={ariaLabel}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          className="otp-input"
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={2}
          autoFocus={autoFocus && index === 0}
          value={DIGITS_ONLY.test(value[index] ?? '') ? (value[index] ?? '') : ''}
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
