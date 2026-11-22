import { useId, useState } from 'react';
import { Input, NumberInput, Select, Textarea, type SelectOptionItem } from '@/shared/components';
import type {
  LabCheckType,
  LabExpectMode,
  LabNumericOp,
  LabStepCheck,
} from '@/features/labs/types/labSpec';
import { LAB_STEP_DEFAULTS } from '../question/defaults';
import {
  buildCheck,
  draftIssues,
  EXPECT_MODES,
  EXPECT_TEXT_MAX,
  REGEX_MAX,
  seedForType,
  SHELL_COMMAND_MAX,
  toDraft,
  type CheckDraft,
} from './checkDraft';

// Editor for one task check (LabStepCheck, contract C§2.1/2.2). Controlled: every
// change is emitted as a well-formed check (correct shape and keys for its type).
// Rule violations (empty command, bad path, out-of-range port) are shown as field
// errors keyed by path ("check.command"); the caller can pass its own messages in
// `errors` (for example server issues), which take precedence. A numeric field the
// author cleared is emitted as NaN (never a silent fallback), so the caller's schema
// rejects it; `getCheckIssues(check)` from ./checkDraft returns the same messages the
// editor shows, for blocking Save. An empty timeout means the default (15000 ms).

export interface CheckEditorProps {
  value: LabStepCheck;
  onChange: (next: LabStepCheck) => void;
  /** Field messages keyed by path, for example `check.command`. */
  errors?: Record<string, string | undefined>;
  disabled?: boolean;
}

const TYPE_OPTIONS: SelectOptionItem[] = [
  { value: 'command', label: 'Command exit code' },
  { value: 'output', label: 'Command output' },
  { value: 'file', label: 'File' },
  { value: 'http', label: 'HTTP status' },
];

const EXPECT_LABELS: Record<LabExpectMode, string> = {
  exitCode: 'Exit code',
  exact: 'Exact match',
  contains: 'Contains',
  regex: 'Regex match',
  numeric: 'Compare number',
};

// `file` + exitCode: the server runs `test -e`, so 0 = exists and 1 = missing.
const FILE_STATE_OPTIONS: SelectOptionItem[] = [
  { value: '0', label: 'Exists' },
  { value: '1', label: 'Does not exist' },
];

const OP_OPTIONS: SelectOptionItem[] = [
  { value: 'eq', label: 'Equals' },
  { value: 'ne', label: 'Does not equal' },
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater than or equal' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less than or equal' },
];

function valueLabel(draft: CheckDraft): string {
  if (draft.expectMode === 'exitCode') return 'Exit code';
  if (draft.expectMode === 'numeric') return draft.type === 'http' ? 'Status code' : 'Value';
  if (draft.expectMode === 'regex') return 'Pattern';
  if (draft.expectMode === 'contains') return 'Text to find';
  return 'Expected output';
}

export function CheckEditor({ value, onChange, errors, disabled = false }: CheckEditorProps) {
  const generatedId = useId();
  const idPrefix = `check-${generatedId}`;

  // Re-sync the draft when the caller hands in a different check. The echo of our own
  // last emission is recognised by its serialized form and does not reset the draft.
  const valueKey = JSON.stringify(value);
  const [syncedKey, setSyncedKey] = useState(valueKey);
  const [draft, setDraft] = useState<CheckDraft>(() => toDraft(value));
  if (valueKey !== syncedKey) {
    setSyncedKey(valueKey);
    setDraft(toDraft(value));
  }

  const issues = draftIssues(draft);
  const fieldError = (path: string) => errors?.[path] ?? issues[path];
  const expectOptions: SelectOptionItem[] = EXPECT_MODES[draft.type].map((mode) => ({
    value: mode,
    label: draft.type === 'file' && mode === 'exitCode' ? 'File state' : EXPECT_LABELS[mode],
  }));
  const hasComparison = draft.expectMode === 'numeric';

  function update(patch: Partial<CheckDraft>) {
    const next: CheckDraft = { ...draft, ...patch };
    setDraft(next);
    const built = buildCheck(next);
    setSyncedKey(JSON.stringify(built));
    onChange(built);
  }

  function changeType(type: LabCheckType) {
    update(seedForType(draft, type));
  }

  function changeExpectMode(expectMode: LabExpectMode) {
    const patch: Partial<CheckDraft> = { expectMode };
    if (expectMode === 'exitCode' && draft.expectNumber === null) patch.expectNumber = 0;
    update(patch);
  }

  const fileState = draft.type === 'file' && draft.expectMode === 'exitCode';
  const showExpectSelect = expectOptions.length > 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Check type"
          id={`${idPrefix}-type`}
          value={draft.type}
          options={TYPE_OPTIONS}
          disabled={disabled}
          onChange={(event) => changeType(event.target.value as LabCheckType)}
        />
        {showExpectSelect ? (
          <Select
            label="Expect"
            id={`${idPrefix}-mode`}
            value={draft.expectMode}
            options={expectOptions}
            disabled={disabled}
            onChange={(event) => changeExpectMode(event.target.value as LabExpectMode)}
          />
        ) : null}
      </div>

      {draft.type === 'command' || draft.type === 'output' ? (
        <Textarea
          id={`${idPrefix}-command`}
          label="Command"
          mono
          rows={3}
          required
          spellCheck={false}
          maxLength={SHELL_COMMAND_MAX}
          value={draft.command}
          disabled={disabled}
          error={fieldError('check.command')}
          onChange={(event) => update({ command: event.target.value })}
        />
      ) : null}

      {draft.type === 'file' ? (
        <Input
          id={`${idPrefix}-path`}
          label="Absolute path"
          className="font-mono"
          required
          spellCheck={false}
          autoComplete="off"
          value={draft.path}
          disabled={disabled}
          error={fieldError('check.path')}
          onChange={(event) => update({ path: event.target.value })}
        />
      ) : null}

      {draft.type === 'http' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id={`${idPrefix}-path`}
            label="URL path"
            className="font-mono"
            required
            spellCheck={false}
            autoComplete="off"
            value={draft.path}
            disabled={disabled}
            error={fieldError('check.path')}
            onChange={(event) => update({ path: event.target.value })}
          />
          <NumberInput
            label="Port"
            id={`${idPrefix}-port`}
            required
            value={draft.port}
            disabled={disabled}
            error={fieldError('check.port')}
            onValueChange={(port) => update({ port })}
          />
        </div>
      ) : null}

      <div className={hasComparison ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : 'flex flex-col'}>
        {draft.expectMode === 'exact' ? (
          <Textarea
            id={`${idPrefix}-expect`}
            label={valueLabel(draft)}
            mono
            rows={3}
            spellCheck={false}
            maxLength={EXPECT_TEXT_MAX}
            value={draft.expectText}
            disabled={disabled}
            error={fieldError('check.expect.value')}
            onChange={(event) => update({ expectText: event.target.value })}
          />
        ) : null}

        {draft.expectMode === 'contains' || draft.expectMode === 'regex' ? (
          <Input
            id={`${idPrefix}-expect`}
            label={valueLabel(draft)}
            className="font-mono"
            spellCheck={false}
            autoComplete="off"
            maxLength={draft.expectMode === 'regex' ? REGEX_MAX : EXPECT_TEXT_MAX}
            value={draft.expectText}
            disabled={disabled}
            error={fieldError('check.expect.value')}
            onChange={(event) => update({ expectText: event.target.value })}
          />
        ) : null}

        {fileState ? (
          <Select
            id={`${idPrefix}-expect`}
            label="File state"
            value={draft.expectNumber === 1 ? '1' : '0'}
            options={FILE_STATE_OPTIONS}
            disabled={disabled}
            error={fieldError('check.expect.value')}
            onChange={(event) => update({ expectNumber: Number(event.target.value) })}
          />
        ) : null}

        {(draft.expectMode === 'exitCode' && !fileState) || draft.expectMode === 'numeric' ? (
          <NumberInput
            id={`${idPrefix}-expect`}
            label={valueLabel(draft)}
            required
            allowDecimal={draft.expectMode === 'numeric' && draft.type !== 'http'}
            value={draft.expectNumber}
            disabled={disabled}
            error={fieldError('check.expect.value')}
            onValueChange={(expectNumber) => update({ expectNumber })}
          />
        ) : null}

        {hasComparison ? (
          <Select
            label="Comparison"
            id={`${idPrefix}-op`}
            value={draft.op}
            options={OP_OPTIONS}
            disabled={disabled}
            onChange={(event) => update({ op: event.target.value as LabNumericOp })}
          />
        ) : null}
      </div>

      <NumberInput
        id={`${idPrefix}-timeout`}
        label="Timeout (ms)"
        placeholder={String(LAB_STEP_DEFAULTS.timeoutMs)}
        value={draft.timeoutMs}
        disabled={disabled}
        error={fieldError('check.timeoutMs')}
        onValueChange={(timeoutMs) => update({ timeoutMs })}
      />
    </div>
  );
}
