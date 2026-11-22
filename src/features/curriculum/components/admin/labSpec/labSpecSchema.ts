import { z } from 'zod';
import type {
  LabMode,
  LabSpecIssue,
  LabSpecV2,
  LabStepCheck,
  LabStepV2,
} from '@/features/labs/types/labSpec';
import { LAB_STEP_DEFAULTS } from '../question/defaults';

// Client mirror of the lab step spec v2 rules (contract C§2.2 `labSpecV2Schema`) and the
// editor's draft model. The server stays authoritative: `POST /admin/labs/spec/validate`
// and `PUT /admin/labs/:labId/spec` run the same rules again. Issues are keyed by dotted
// path, for example `steps.2.check.command`.

export const STEP_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
export const STEP_ID_MAX_LENGTH = 64;
export const MAX_STEPS = 50;
export const MAX_HINTS = 5;
export const MAX_STEP_SETUP = 10;
export const MAX_SCENARIO_SETUP = 20;
export const MAX_ACCEPTED_ANSWERS = 20;
export const MAX_TITLE_LENGTH = 120;
export const MAX_INSTRUCTIONS_LENGTH = 20000;
export const MAX_HINT_LENGTH = 2000;
export const MAX_SHELL_COMMAND_LENGTH = 8000;
export const MAX_SETUP_COMMAND_LENGTH = 4000;
export const MAX_ANSWER_LENGTH = 500;
export const MAX_STEP_POINTS = 1000;
export const MAX_COMPLETION_BONUS = 10000;
export const MIN_TIMEOUT_MS = 1000;
export const MAX_TIMEOUT_MS = 60000;

const NOT_A_NUMBER = 'Enter a number.';
const NOT_A_WHOLE_NUMBER = 'Enter a whole number.';
const NUL_MESSAGE = 'NUL bytes are not allowed.';

function noNul(value: string): boolean {
  return !value.includes('\u0000');
}

function isValidRegex(value: string): boolean {
  try {
    new RegExp(value, 'm');
    return true;
  } catch {
    return false;
  }
}

function wholeNumber(min: number, max: number) {
  const range = `Use a whole number from ${min} to ${max}.`;
  return z
    .number({ error: NOT_A_WHOLE_NUMBER })
    .int(NOT_A_WHOLE_NUMBER)
    .min(min, range)
    .max(max, range);
}

function commandText(max: number) {
  return z
    .string()
    .min(1, 'Enter a command.')
    .max(max, `Use ${max} characters or fewer.`)
    .refine(noNul, NUL_MESSAGE);
}

const numericOp = z
  .enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte'], { error: 'Choose a comparison.' })
  .default('eq');

const absolutePathSchema = z
  .string()
  .regex(/^\/[^\n'"`$]{1,1023}$/, 'Use an absolute path without quotes or "$".')
  .refine(noNul, NUL_MESSAGE);

const httpPathSchema = z
  .string()
  .regex(/^\/[A-Za-z0-9._~/?=&%:+-]{0,511}$/, 'Use a URL path such as /health.');

const timeoutMsSchema = wholeNumber(MIN_TIMEOUT_MS, MAX_TIMEOUT_MS).default(
  LAB_STEP_DEFAULTS.timeoutMs,
);

const exitExpectSchema = z
  .object({
    mode: z.literal('exitCode'),
    value: wholeNumber(0, 255),
  })
  .strict();

const fileExitExpectSchema = z
  .object({
    mode: z.literal('exitCode'),
    value: z.union([z.literal(0), z.literal(1)], {
      error: 'Use 0 (file exists) or 1 (file missing).',
    }),
  })
  .strict();

const contentExpectSchema = z.discriminatedUnion('mode', [
  z
    .object({
      mode: z.literal('exact'),
      value: z.string().max(4000, 'Use 4000 characters or fewer.'),
    })
    .strict(),
  z
    .object({
      mode: z.literal('contains'),
      value: z.string().min(1, 'Enter text to find.').max(4000, 'Use 4000 characters or fewer.'),
    })
    .strict(),
  z
    .object({
      mode: z.literal('regex'),
      value: z
        .string()
        .min(1, 'Enter a pattern.')
        .max(500, 'Use 500 characters or fewer.')
        .refine(isValidRegex, 'Invalid regular expression.'),
    })
    .strict(),
  z
    .object({
      mode: z.literal('numeric'),
      value: z.number({ error: NOT_A_NUMBER }),
      op: numericOp,
    })
    .strict(),
]);

const statusExpectSchema = z
  .object({
    mode: z.literal('numeric'),
    value: wholeNumber(100, 599),
    op: numericOp,
  })
  .strict();

export const labStepCheckSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('command'),
      command: commandText(MAX_SHELL_COMMAND_LENGTH),
      expect: exitExpectSchema,
      timeoutMs: timeoutMsSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal('output'),
      command: commandText(MAX_SHELL_COMMAND_LENGTH),
      expect: contentExpectSchema,
      timeoutMs: timeoutMsSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal('file'),
      path: absolutePathSchema,
      expect: z.union([fileExitExpectSchema, contentExpectSchema]),
      timeoutMs: timeoutMsSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal('http'),
      path: httpPathSchema,
      port: wholeNumber(1, 65535).default(80),
      expect: statusExpectSchema,
      timeoutMs: timeoutMsSchema,
    })
    .strict(),
]);

const stepIdSchema = z
  .string()
  .regex(STEP_ID_PATTERN, 'Use lowercase letters, numbers, "_" or "-", up to 64 characters.');

export const labHintSchema = z
  .object({
    id: stepIdSchema,
    text: z.string().trim().min(1, 'Enter hint text.').max(2000, 'Use 2000 characters or fewer.'),
  })
  .strict();

export const labStepAnswerSchema = z
  .object({
    accepted: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Enter an answer.')
          .max(MAX_ANSWER_LENGTH, `Use ${MAX_ANSWER_LENGTH} characters or fewer.`),
      )
      .min(1, 'Add at least one accepted answer.')
      .max(MAX_ACCEPTED_ANSWERS, `Use ${MAX_ACCEPTED_ANSWERS} accepted answers or fewer.`),
    normalize: z
      .enum(['none', 'trim', 'trim_lower', 'collapse_ws_lower'], {
        error: 'Choose how answers are matched.',
      })
      .default('trim_lower'),
  })
  .strict();

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Enter a title.')
  .max(MAX_TITLE_LENGTH, `Use ${MAX_TITLE_LENGTH} characters or fewer.`)
  .refine((value) => !/[\r\n]/.test(value), 'Titles must be one line.');

const instructionsSchema = z
  .string()
  .trim()
  .min(1, 'Enter instructions.')
  .max(MAX_INSTRUCTIONS_LENGTH, `Use ${MAX_INSTRUCTIONS_LENGTH} characters or fewer.`);

const stepSetupSchema = z
  .array(commandText(MAX_SETUP_COMMAND_LENGTH))
  .max(MAX_STEP_SETUP, `Use ${MAX_STEP_SETUP} setup commands or fewer.`)
  .default([]);

export const labStepSchema = z
  .object({
    id: stepIdSchema,
    title: titleSchema,
    instructions: instructionsSchema,
    kind: z.enum(['task', 'question'], { error: 'Choose Task or Question.' }),
    setup: stepSetupSchema,
    check: labStepCheckSchema.optional(),
    answer: labStepAnswerSchema.optional(),
    hints: z.array(labHintSchema).max(MAX_HINTS, `Use ${MAX_HINTS} hints or fewer.`).default([]),
    points: wholeNumber(0, MAX_STEP_POINTS),
    hintCost: wholeNumber(0, MAX_STEP_POINTS).default(LAB_STEP_DEFAULTS.hintCost),
    wrongPenalty: wholeNumber(0, MAX_STEP_POINTS).default(LAB_STEP_DEFAULTS.wrongPenalty),
    guessPenalty: wholeNumber(0, MAX_STEP_POINTS).default(LAB_STEP_DEFAULTS.guessPenalty),
  })
  .strict()
  .superRefine((step, ctx) => {
    if (step.kind === 'task' && !step.check) {
      ctx.addIssue({ code: 'custom', path: ['check'], message: 'Task steps need a check.' });
    }
    if (step.kind === 'task' && step.answer) {
      ctx.addIssue({
        code: 'custom',
        path: ['answer'],
        message: 'Task steps cannot have answers.',
      });
    }
    if (step.kind === 'question' && !step.answer) {
      ctx.addIssue({
        code: 'custom',
        path: ['answer'],
        message: 'Question steps need accepted answers.',
      });
    }
    if (step.kind === 'question' && step.check) {
      ctx.addIssue({
        code: 'custom',
        path: ['check'],
        message: 'Question steps cannot have a check.',
      });
    }
    const hintIds = step.hints.map((hint) => hint.id);
    if (new Set(hintIds).size !== hintIds.length) {
      ctx.addIssue({ code: 'custom', path: ['hints'], message: 'Hint ids must be unique.' });
    }
  });

export const labSpecSchema = z
  .object({
    version: z.literal(2, { error: 'The spec version must be 2.' }),
    mode: z.enum(['guided', 'break_fix'], { error: 'Choose Guided or Break-fix.' }),
    scenario: z
      .object({
        intro: z
          .string()
          .trim()
          .max(MAX_INSTRUCTIONS_LENGTH, `Use ${MAX_INSTRUCTIONS_LENGTH} characters or fewer.`)
          .default(''),
        setup: z
          .array(commandText(MAX_SETUP_COMMAND_LENGTH))
          .max(MAX_SCENARIO_SETUP, `Use ${MAX_SCENARIO_SETUP} setup commands or fewer.`)
          .default([]),
      })
      .strict(),
    completionBonus: wholeNumber(0, MAX_COMPLETION_BONUS).default(
      LAB_STEP_DEFAULTS.completionBonus,
    ),
    steps: z
      .array(labStepSchema)
      .min(1, 'Add at least one step.')
      .max(MAX_STEPS, `Use ${MAX_STEPS} steps or fewer.`),
  })
  .strict()
  .superRefine((spec, ctx) => {
    const ids = spec.steps.map((step) => step.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['steps'], message: 'Step ids must be unique.' });
    }
  });

/** Client-side issues for any value, keyed by path. Empty when the spec is valid. */
export function clientSpecIssues(spec: unknown): LabSpecIssue[] {
  const result = labSpecSchema.safeParse(spec);
  if (result.success) return [];
  return result.error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}

/** Keys the strict schema does not know (used to refuse a JSON apply that would drop them). */
export function unrecognizedKeyIssues(spec: unknown): LabSpecIssue[] {
  const result = labSpecSchema.safeParse(spec);
  if (result.success) return [];
  return result.error.issues
    .filter((issue) => issue.code === 'unrecognized_keys')
    .map((issue) => ({ path: issue.path.map(String).join('.'), message: issue.message }));
}

/* ── Draft model ─────────────────────────────────────────────────────── */

/** One step in the editor. `key` is a stable local id (ReorderList identity, selection). */
export interface StepDraft {
  key: string;
  /** The id still follows the title (new steps until the author edits the id). */
  autoId: boolean;
  step: LabStepV2;
}

export interface SpecDraft {
  mode: LabMode;
  scenario: LabSpecV2['scenario'];
  completionBonus: number;
  steps: StepDraft[];
}

let stepKeySequence = 0;

export function createStepKey(): string {
  stepKeySequence += 1;
  return `draft-step-${stepKeySequence}`;
}

export function emptyCheck(): LabStepCheck {
  return {
    type: 'command',
    command: '',
    expect: { mode: 'exitCode', value: 0 },
    timeoutMs: LAB_STEP_DEFAULTS.timeoutMs,
  };
}

/** A new task step with the authoring defaults (points 25, hint cost 5). */
export function emptyStep(index: number): LabStepV2 {
  return {
    id: `step-${index + 1}`,
    title: '',
    instructions: '',
    kind: 'task',
    setup: [],
    check: emptyCheck(),
    hints: [],
    points: LAB_STEP_DEFAULTS.points,
    hintCost: LAB_STEP_DEFAULTS.hintCost,
    wrongPenalty: 0,
    guessPenalty: 0,
  };
}

/** A spec with the authoring defaults and one empty step (the editor's starting point). */
export function emptySpec(): LabSpecV2 {
  return {
    version: 2,
    mode: 'guided',
    scenario: { intro: '', setup: [] },
    completionBonus: LAB_STEP_DEFAULTS.completionBonus,
    steps: [emptyStep(0)],
  };
}

// Fills the lists an editor needs when a hand-edited JSON omits or mistypes them.
function normalizeStep(step: LabStepV2): LabStepV2 {
  return {
    ...step,
    setup: Array.isArray(step.setup) ? step.setup : [],
    hints: Array.isArray(step.hints) ? step.hints : [],
    answer:
      step.answer && Array.isArray(step.answer.accepted)
        ? step.answer
        : step.answer
          ? { ...step.answer, accepted: [] }
          : undefined,
  };
}

/** Loads a spec into the editor. Existing steps keep their ids (autoId false). */
export function specToDraft(
  spec: Partial<LabSpecV2> & { steps: LabStepV2[] },
  autoId = false,
): SpecDraft {
  return {
    mode: spec.mode ?? 'guided',
    scenario: {
      intro: spec.scenario?.intro ?? '',
      setup: spec.scenario?.setup ?? [],
    },
    completionBonus: spec.completionBonus ?? LAB_STEP_DEFAULTS.completionBonus,
    steps: spec.steps.map((step) => ({
      key: createStepKey(),
      autoId,
      step: normalizeStep(step),
    })),
  };
}

export function draftToSpec(draft: SpecDraft): LabSpecV2 {
  return {
    version: 2,
    mode: draft.mode,
    scenario: draft.scenario,
    completionBonus: draft.completionBonus,
    steps: draft.steps.map((entry) => entry.step),
  };
}

export function specKey(spec: LabSpecV2): string {
  return JSON.stringify(spec);
}

/** Step id candidate from a title: lower case, dashes, at most 64 characters. */
export function slugifyStepId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, STEP_ID_MAX_LENGTH)
    .replace(/-+$/, '');
}

/** `base` when free, else `base-2`, `base-3`, ... (never a taken id). */
export function uniqueStepId(base: string, taken: ReadonlyArray<string>): string {
  const root = base || 'step';
  if (!taken.includes(root)) return root;
  for (let n = 2; ; n += 1) {
    const suffix = `-${n}`;
    const candidate = `${root.slice(0, STEP_ID_MAX_LENGTH - suffix.length)}${suffix}`;
    if (!taken.includes(candidate)) return candidate;
  }
}

/** Keeps the first message per path. */
export function issuesToRecord(issues: ReadonlyArray<LabSpecIssue>): Record<string, string> {
  const record: Record<string, string> = {};
  for (const issue of issues) {
    if (!(issue.path in record)) record[issue.path] = issue.message;
  }
  return record;
}

/** Issues under `prefix`, with the prefix removed (`steps.2.check.command` -> `check.command`). */
export function relativeIssues(
  issues: Record<string, string>,
  prefix: string,
): Record<string, string> {
  const relative: Record<string, string> = {};
  for (const [path, message] of Object.entries(issues)) {
    if (path.startsWith(prefix)) relative[path.slice(prefix.length)] = message;
  }
  return relative;
}

/** Per-row messages for a list stored under `prefix` (`setup.0`, `setup.1`, ...). */
export function rowIssues(
  issues: Record<string, string>,
  prefix: string,
  count: number,
): Array<string | undefined> {
  return Array.from({ length: count }, (_, index) => issues[`${prefix}.${index}`]);
}
