import { useId } from 'react';
import { NumberInput } from '@/shared/components';

// Wrong-answer and guess penalties (quiz questions and terminal question steps).
// Values are whole numbers from 0 to 1000. An empty field is reported as `null`
// so the caller's schema decides how to handle it.

export const PENALTY_MIN = 0;
export const PENALTY_MAX = 1000;

export interface PenaltyValues {
  wrongPenalty: number | null;
  guessPenalty: number | null;
}

export interface PenaltyFieldErrors {
  wrongPenalty?: string;
  guessPenalty?: string;
}

interface PenaltyFieldsProps extends PenaltyValues {
  /** Shows the guess cost (terminal answer mode only). */
  showGuess: boolean;
  onChange: (next: PenaltyValues) => void;
  errors?: PenaltyFieldErrors;
  disabled?: boolean;
}

const RANGE_MESSAGE = `Use a whole number from ${PENALTY_MIN} to ${PENALTY_MAX}.`;

function isValidPenalty(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= PENALTY_MIN && value <= PENALTY_MAX;
}

export function PenaltyFields({
  wrongPenalty,
  guessPenalty,
  showGuess,
  onChange,
  errors,
  disabled = false,
}: PenaltyFieldsProps) {
  const idPrefix = `penalty-${useId()}`;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NumberInput
        label="Wrong answer cost"
        id={`${idPrefix}-wrong`}
        name="wrongPenalty"
        disabled={disabled}
        value={wrongPenalty}
        onValueChange={(next) => onChange({ wrongPenalty: next, guessPenalty })}
        error={errors?.wrongPenalty ?? (isValidPenalty(wrongPenalty) ? undefined : RANGE_MESSAGE)}
      />
      {showGuess ? (
        <NumberInput
          label="Guess cost"
          id={`${idPrefix}-guess`}
          name="guessPenalty"
          disabled={disabled}
          value={guessPenalty}
          onValueChange={(next) => onChange({ wrongPenalty, guessPenalty: next })}
          error={errors?.guessPenalty ?? (isValidPenalty(guessPenalty) ? undefined : RANGE_MESSAGE)}
        />
      ) : null}
    </div>
  );
}
