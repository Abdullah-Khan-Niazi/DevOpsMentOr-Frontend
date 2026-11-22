import type {
  LabCheckType,
  LabExpectMode,
  LabNumericOp,
  LabStepCheck,
  LabStepExpect,
} from '@/features/labs/types/labSpec';
import { LAB_STEP_DEFAULTS } from '../question/defaults';

// Pure model behind CheckEditor: a flat draft of a LabStepCheck, the builder that
// turns it back into a typed check, and the client mirror of the backend check rules
// (contract C§2.2 `labStepCheckSchema`). Issues are keyed by path ("check.command").

export const SHELL_COMMAND_MAX = 8000;
export const EXPECT_TEXT_MAX = 4000;
export const REGEX_MAX = 500;
const TIMEOUT_MIN = 1000;
const TIMEOUT_MAX = 60000;
const PORT_MIN = 1;
const PORT_MAX = 65535;
const STATUS_MIN = 100;
const STATUS_MAX = 599;
const EXIT_CODE_MAX = 255;
const HTTP_DEFAULT_PORT = 80;
const HTTP_DEFAULT_STATUS = 200;

const ABSOLUTE_PATH_RE = /^\/[^'"`$\r\n]{1,1023}$/;
const URL_PATH_RE = /^\/[A-Za-z0-9._~/?=&%:+-]{0,511}$/;

// Expect modes offered per check type; the first entry is the default after a type change.
export const EXPECT_MODES: Record<LabCheckType, LabExpectMode[]> = {
  command: ['exitCode'],
  output: ['exact', 'contains', 'regex', 'numeric'],
  file: ['exitCode', 'exact', 'contains', 'regex', 'numeric'],
  http: ['numeric'],
};

// Flat, editable form of a check. Numeric fields are `null` while empty.
export interface CheckDraft {
  type: LabCheckType;
  command: string;
  path: string;
  port: number | null;
  expectMode: LabExpectMode;
  expectText: string;
  expectNumber: number | null;
  op: LabNumericOp;
  timeoutMs: number | null;
}

function fromExpect(
  expect: LabStepExpect,
): Pick<CheckDraft, 'expectMode' | 'expectText' | 'expectNumber' | 'op'> {
  if (expect.mode === 'exitCode') {
    return {
      expectMode: 'exitCode',
      expectText: '',
      expectNumber: finiteOrNull(expect.value),
      op: 'eq',
    };
  }
  if (expect.mode === 'numeric') {
    return {
      expectMode: 'numeric',
      expectText: '',
      expectNumber: finiteOrNull(expect.value),
      op: expect.op,
    };
  }
  return { expectMode: expect.mode, expectText: expect.value, expectNumber: null, op: 'eq' };
}

// NaN (an emitted empty field) reads back as an empty field.
function finiteOrNull(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

export function toDraft(check: LabStepCheck): CheckDraft {
  const base: CheckDraft = {
    type: check.type,
    command: '',
    path: '',
    port: null,
    expectMode: 'exitCode',
    expectText: '',
    expectNumber: null,
    op: 'eq',
    timeoutMs: finiteOrNull(check.timeoutMs),
  };
  switch (check.type) {
    case 'command':
    case 'output':
      return { ...base, command: check.command, ...fromExpect(check.expect) };
    case 'file':
      return { ...base, path: check.path, ...fromExpect(check.expect) };
    case 'http':
      return {
        ...base,
        path: check.path,
        port: finiteOrNull(check.port),
        ...fromExpect(check.expect),
      };
  }
}

// Text modes (exact, contains, regex) and the numeric comparison of output checks.
function buildContentExpect(draft: CheckDraft): Exclude<LabStepExpect, { mode: 'exitCode' }> {
  if (draft.expectMode === 'numeric') {
    return { mode: 'numeric', value: draft.expectNumber ?? Number.NaN, op: draft.op };
  }
  // Exit code is never offered for output checks (see EXPECT_MODES), so this is a text mode.
  const mode = draft.expectMode === 'exitCode' ? 'exact' : draft.expectMode;
  return { mode, value: draft.expectText };
}

function buildExpect(draft: CheckDraft): LabStepExpect {
  if (draft.expectMode === 'exitCode') {
    return { mode: 'exitCode', value: draft.expectNumber ?? Number.NaN };
  }
  return buildContentExpect(draft);
}

export function buildCheck(draft: CheckDraft): LabStepCheck {
  const timeoutMs = draft.timeoutMs ?? LAB_STEP_DEFAULTS.timeoutMs;
  switch (draft.type) {
    case 'command':
      return {
        type: 'command',
        command: draft.command,
        expect: { mode: 'exitCode', value: draft.expectNumber ?? Number.NaN },
        timeoutMs,
      };
    case 'output':
      return {
        type: 'output',
        command: draft.command,
        expect: buildContentExpect(draft),
        timeoutMs,
      };
    case 'file':
      return { type: 'file', path: draft.path, expect: buildExpect(draft), timeoutMs };
    case 'http':
      return {
        type: 'http',
        path: draft.path,
        port: draft.port ?? Number.NaN,
        expect: { mode: 'numeric', value: draft.expectNumber ?? Number.NaN, op: draft.op },
        timeoutMs,
      };
  }
}

function expectValueIssue(draft: CheckDraft): string | undefined {
  switch (draft.expectMode) {
    case 'exitCode': {
      if (draft.expectNumber === null) return 'Enter an exit code.';
      if (draft.type === 'file') {
        return draft.expectNumber === 0 || draft.expectNumber === 1
          ? undefined
          : 'Use 0 (file exists) or 1 (file missing).';
      }
      const valid =
        Number.isInteger(draft.expectNumber) &&
        draft.expectNumber >= 0 &&
        draft.expectNumber <= EXIT_CODE_MAX;
      return valid ? undefined : `Use an exit code from 0 to ${EXIT_CODE_MAX}.`;
    }
    case 'exact':
      return draft.expectText.length > EXPECT_TEXT_MAX
        ? `Use ${EXPECT_TEXT_MAX} characters or fewer.`
        : undefined;
    case 'contains':
      if (draft.expectText === '') return 'Enter text to find.';
      return draft.expectText.length > EXPECT_TEXT_MAX
        ? `Use ${EXPECT_TEXT_MAX} characters or fewer.`
        : undefined;
    case 'regex': {
      if (draft.expectText === '') return 'Enter a pattern.';
      if (draft.expectText.length > REGEX_MAX) return `Use ${REGEX_MAX} characters or fewer.`;
      try {
        new RegExp(draft.expectText, 'm');
      } catch {
        return 'Invalid regular expression.';
      }
      return undefined;
    }
    case 'numeric': {
      if (draft.expectNumber === null) return 'Enter a number.';
      if (draft.type === 'http') {
        const status = draft.expectNumber;
        const valid = Number.isInteger(status) && status >= STATUS_MIN && status <= STATUS_MAX;
        return valid ? undefined : `Use a status code from ${STATUS_MIN} to ${STATUS_MAX}.`;
      }
      return undefined;
    }
  }
}

export function draftIssues(draft: CheckDraft): Record<string, string> {
  const issues: Record<string, string> = {};

  if (draft.type === 'command' || draft.type === 'output') {
    if (draft.command.trim() === '') {
      issues['check.command'] = 'Enter a command.';
    } else if (draft.command.length > SHELL_COMMAND_MAX) {
      issues['check.command'] = `Use ${SHELL_COMMAND_MAX} characters or fewer.`;
    } else if (draft.command.includes('\u0000')) {
      issues['check.command'] = 'NUL bytes are not allowed.';
    }
  }

  if (draft.type === 'file') {
    if (!ABSOLUTE_PATH_RE.test(draft.path) || draft.path.includes('\u0000')) {
      issues['check.path'] = 'Use an absolute path without quotes or "$".';
    }
  }

  if (draft.type === 'http') {
    if (!URL_PATH_RE.test(draft.path)) {
      issues['check.path'] = 'Use a URL path such as /health.';
    }
    const port = draft.port;
    if (port === null || !Number.isInteger(port) || port < PORT_MIN || port > PORT_MAX) {
      issues['check.port'] = `Use a port from ${PORT_MIN} to ${PORT_MAX}.`;
    }
  }

  const expectIssue = expectValueIssue(draft);
  if (expectIssue) issues['check.expect.value'] = expectIssue;

  const timeout = draft.timeoutMs;
  if (
    timeout !== null &&
    (!Number.isInteger(timeout) || timeout < TIMEOUT_MIN || timeout > TIMEOUT_MAX)
  ) {
    issues['check.timeoutMs'] = `Use ${TIMEOUT_MIN} to ${TIMEOUT_MAX} ms.`;
  }

  return issues;
}

/** Field messages for a check, keyed by path (`check.command`); empty when valid. */
export function getCheckIssues(check: LabStepCheck): Record<string, string> {
  return draftIssues(toDraft(check));
}

// Numeric values that carry over to the new type, else that type's default.
export function seedForType(draft: CheckDraft, type: LabCheckType): Partial<CheckDraft> {
  const modes = EXPECT_MODES[type];
  const expectMode = modes.includes(draft.expectMode) ? draft.expectMode : modes[0];
  const patch: Partial<CheckDraft> = { type, expectMode };
  const number = draft.expectNumber;
  if (type === 'http') {
    if (draft.port === null) patch.port = HTTP_DEFAULT_PORT;
    if (number === null || number < STATUS_MIN || number > STATUS_MAX) {
      patch.expectNumber = HTTP_DEFAULT_STATUS;
    }
  } else if (expectMode === 'exitCode') {
    const max = type === 'file' ? 1 : EXIT_CODE_MAX;
    if (number === null || number < 0 || number > max) patch.expectNumber = 0;
  }
  return patch;
}
