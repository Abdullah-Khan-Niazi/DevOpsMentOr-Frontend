import type { ReactNode } from 'react';

interface FieldLabelProps {
  htmlFor?: string;
  label?: string;
  required?: boolean;
  /** Right side of the label row (counter, action). */
  aside?: ReactNode;
  id?: string;
}

export function FieldLabel({ htmlFor, label, required, aside, id }: FieldLabelProps) {
  if (!label && !aside) return null;
  return (
    <div className="field-label-row">
      {label ? (
        <label id={id} htmlFor={htmlFor} className="input-label">
          {label}
          {required ? (
            <span className="text-signal ml-0.5" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : (
        <span />
      )}
      {aside}
    </div>
  );
}
