import { Icon } from '@/shared/components/Icon';
import '../Input/Input.css';
import './Field.css';

interface FieldErrorProps {
  id?: string;
  message?: string | null;
}

/** Field-level validation message; animates in, announced via the field's `aria-errormessage`. */
export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="input-error field-error">
      <Icon name="error" size={14} />
      <span>{message}</span>
    </p>
  );
}
