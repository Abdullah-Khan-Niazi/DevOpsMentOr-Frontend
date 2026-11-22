import { forwardRef, useId, useState } from 'react';
import {
  FieldError,
  Markdown,
  TabPanel,
  TabSwitcher,
  Textarea,
  type TabSwitcherItem,
} from '@/shared/components';

// Markdown source editor with a Write / Preview switch. Preview uses the shared
// sanitized Markdown renderer, so it matches what learners see.

type MarkdownMode = 'write' | 'preview';

const MODE_ITEMS: ReadonlyArray<TabSwitcherItem<MarkdownMode>> = [
  { id: 'write', label: 'Write' },
  { id: 'preview', label: 'Preview' },
];

// The counter appears only once the text is close to the limit (last 10%).
const COUNTER_THRESHOLD = 0.9;

export interface MarkdownFieldProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
  error?: string;
  id?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const MarkdownField = forwardRef<HTMLTextAreaElement, MarkdownFieldProps>(
  function MarkdownField(
    {
      label,
      value,
      onChange,
      maxLength,
      error,
      id,
      required = false,
      rows = 8,
      placeholder,
      disabled = false,
    },
    ref,
  ) {
    const generatedId = useId();
    const idPrefix = id ?? `markdown-${generatedId}`;
    const labelId = `${idPrefix}-label`;
    const textareaId = `${idPrefix}-input`;
    const errorId = `${textareaId}-error`;
    const [mode, setMode] = useState<MarkdownMode>('write');
    const showCounter = maxLength !== undefined && value.length >= maxLength * COUNTER_THRESHOLD;

    return (
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span id={labelId} className="input-label">
            {label}
            {required ? (
              <span className="text-signal ml-0.5" aria-hidden="true">
                *
              </span>
            ) : null}
          </span>
          <TabSwitcher
            size="sm"
            items={MODE_ITEMS}
            value={mode}
            onChange={setMode}
            ariaLabel={`${label} view`}
            idPrefix={idPrefix}
          />
        </div>

        {/* Kept mounted so the forwarded ref (focus on validation errors) always resolves. */}
        <TabPanel idPrefix={idPrefix} id="write" active={mode === 'write'} keepMounted>
          <Textarea
            ref={ref}
            id={textareaId}
            aria-labelledby={labelId}
            aria-required={required || undefined}
            aria-invalid={Boolean(error) || undefined}
            aria-errormessage={error ? errorId : undefined}
            aria-describedby={error ? errorId : undefined}
            mono
            rows={rows}
            value={value}
            maxLength={maxLength}
            showCount={showCounter}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
          />
        </TabPanel>

        <TabPanel idPrefix={idPrefix} id="preview" active={mode === 'preview'}>
          {value.trim() ? (
            <Markdown variant="compact">{value}</Markdown>
          ) : (
            <p className="text-sm text-muted">Nothing to preview yet.</p>
          )}
        </TabPanel>

        <FieldError id={errorId} message={error} />
      </div>
    );
  },
);
