import { useId } from 'react';
import { Button, IconButton } from '@/shared/components';
import type { LabHint } from '@/features/labs/types/labSpec';
import { MarkdownField } from '../fields/MarkdownField';
import { MAX_HINT_LENGTH, MAX_HINTS } from './labSpecSchema';

// Hints of one step (ids h1..h5, text 1..2000). `issues` are relative to the step
// ("hints.0.text", "hints").

export interface HintsEditorProps {
  hints: LabHint[];
  issues: Record<string, string>;
  disabled?: boolean;
  onChange: (next: LabHint[]) => void;
}

/** The first `h<n>` id not used by another hint, so removing a hint never renumbers the rest. */
function nextHintId(hints: LabHint[]): string {
  const used = new Set(hints.map((hint) => hint.id));
  for (let n = 1; n <= MAX_HINTS; n += 1) {
    if (!used.has(`h${n}`)) return `h${n}`;
  }
  return `h${MAX_HINTS}`;
}

export function HintsEditor({ hints, issues, disabled = false, onChange }: HintsEditorProps) {
  const idPrefix = `hints-${useId()}`;
  const full = hints.length >= MAX_HINTS;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="input-label">Hints</span>
        <Button
          variant="secondary"
          size="sm"
          iconName="plus"
          disabled={disabled || full}
          onClick={() => onChange([...hints, { id: nextHintId(hints), text: '' }])}
        >
          Add hint
        </Button>
      </div>

      {hints.map((hint, index) => (
        <div key={hint.id} className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-mono text-micro text-muted">{hint.id}</span>
            <MarkdownField
              id={`${idPrefix}-${index}`}
              label={`Hint ${index + 1}`}
              value={hint.text}
              maxLength={MAX_HINT_LENGTH}
              rows={3}
              required
              disabled={disabled}
              error={issues[`hints.${index}.text`]}
              onChange={(text) =>
                onChange(
                  hints.map((entry, position) => (position === index ? { ...entry, text } : entry)),
                )
              }
            />
          </div>
          <IconButton
            icon="delete"
            label="Remove hint"
            size="sm"
            tone="danger"
            disabled={disabled}
            onClick={() => onChange(hints.filter((_, position) => position !== index))}
          />
        </div>
      ))}
    </section>
  );
}
