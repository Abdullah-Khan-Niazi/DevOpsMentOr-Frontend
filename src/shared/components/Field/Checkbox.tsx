import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/shared/utils';
import { FieldError } from './FieldError';
import { fieldIds } from './fieldIds';
import './Field.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, indeterminate = false, className, id, disabled, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);
    const fieldId = id ?? props.name;
    const { errorId } = fieldIds(fieldId);

    useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
      <div className={cn('inline-flex flex-col gap-1', className)}>
        <label className={cn('field-check', disabled && 'field-check--disabled')}>
          <input
            ref={innerRef}
            id={fieldId}
            type="checkbox"
            className="field-check__input"
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            aria-errormessage={error ? errorId : undefined}
            {...props}
          />
          <span>{label}</span>
        </label>
        <FieldError id={errorId} message={error} />
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';
