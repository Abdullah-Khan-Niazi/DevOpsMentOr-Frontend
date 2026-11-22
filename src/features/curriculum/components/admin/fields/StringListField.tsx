import { useId, useEffect, useRef, type KeyboardEvent } from 'react';
import { Button, FieldError, IconButton, Input, Textarea } from '@/shared/components';

// Ordered list of strings edited one row at a time. Controlled: the caller owns
// `values`. Alt+ArrowUp / Alt+ArrowDown on a row moves it; focus follows the row.
// `multiline` swaps the single-line inputs for textareas (used by CommandListField).

export interface StringListFieldProps {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  maxItems: number;
  /** Per-row character limit. */
  maxLength?: number;
  placeholder?: string;
  addLabel?: string;
  /** Per-row messages, indexed like `values`. */
  errors?: ReadonlyArray<string | undefined>;
  /** List-level message, for example "Add at least two options.". */
  error?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  mono?: boolean;
}

export function StringListField({
  label,
  values,
  onChange,
  maxItems,
  maxLength,
  placeholder,
  addLabel = 'Add item',
  errors,
  error,
  id,
  required = false,
  disabled = false,
  multiline = false,
  mono = false,
}: StringListFieldProps) {
  const generatedId = useId();
  const groupId = id ?? `string-list-${generatedId}`;
  const labelId = `${groupId}-label`;
  const groupErrorId = `${groupId}-error`;
  const rowRefs = useRef<Array<HTMLInputElement | HTMLTextAreaElement | null>>([]);
  const addRef = useRef<HTMLButtonElement>(null);
  // Row to focus after the next render: an index, "add" or null.
  const pendingFocus = useRef<number | 'add' | null>(null);
  const full = values.length >= maxItems;

  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    if (target === 'add') {
      addRef.current?.focus();
    } else {
      rowRefs.current[target]?.focus();
    }
  });

  function setRow(index: number, next: string) {
    const copy = values.slice();
    copy[index] = next;
    onChange(copy);
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= values.length) return;
    const copy = values.slice();
    [copy[index], copy[target]] = [copy[target], copy[index]];
    pendingFocus.current = target;
    onChange(copy);
  }

  function remove(index: number) {
    const copy = values.filter((_, position) => position !== index);
    pendingFocus.current = copy.length === 0 ? 'add' : Math.min(index, copy.length - 1);
    onChange(copy);
  }

  function add() {
    if (full) return;
    pendingFocus.current = values.length;
    onChange([...values, '']);
  }

  function handleRowKeyDown(event: KeyboardEvent, index: number) {
    if (!event.altKey || disabled) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(index, -1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(index, 1);
    }
  }

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <span id={labelId} className="input-label">
        {label}
        {required ? (
          <span className="text-signal ml-0.5" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>

      {values.map((value, index) => {
        const rowId = `${groupId}-${index}`;
        const rowError = errors?.[index];
        const rowLabel = `${label} ${index + 1}`;
        const setRowRef = (element: HTMLInputElement | HTMLTextAreaElement | null) => {
          rowRefs.current[index] = element;
        };
        return (
          <div key={index} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              {multiline ? (
                <Textarea
                  ref={setRowRef}
                  id={rowId}
                  aria-label={rowLabel}
                  mono={mono}
                  rows={2}
                  value={value}
                  maxLength={maxLength}
                  placeholder={placeholder}
                  disabled={disabled}
                  error={rowError}
                  onChange={(event) => setRow(index, event.target.value)}
                  onKeyDown={(event) => handleRowKeyDown(event, index)}
                />
              ) : (
                <Input
                  ref={setRowRef}
                  id={rowId}
                  aria-label={rowLabel}
                  value={value}
                  maxLength={maxLength}
                  placeholder={placeholder}
                  disabled={disabled}
                  error={rowError}
                  onChange={(event) => setRow(index, event.target.value)}
                  onKeyDown={(event) => handleRowKeyDown(event, index)}
                />
              )}
            </div>
            <IconButton
              icon="delete"
              label="Remove"
              tone="danger"
              disabled={disabled}
              onClick={() => remove(index)}
            />
          </div>
        );
      })}

      <FieldError id={groupErrorId} message={error} />

      <div>
        <Button
          ref={addRef}
          variant="secondary"
          size="sm"
          iconName="plus"
          disabled={disabled || full}
          onClick={add}
        >
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
