import type { ComponentType } from 'react';
import { z, type ZodType } from 'zod';
import type { LabStepCheck } from '@/features/labs/types/labSpec';
import type {
  AdminAnswerDto,
  AdminQuestionDto,
  AdminQuestionType,
  CreateQuestionPayload,
  QuestionAnswerInput,
} from '@/features/curriculum/types/admin';
import type { IconName } from '@/shared/components';
import { LAB_STEP_DEFAULTS, QUESTION_DEFAULTS } from './defaults';

// Shared contract of the per-type question editors (contract C§6.1, FE§3.3). Every
// editor is a module: its form value, zod schema (client mirror of the server rules),
// the empty form, the payload builder and the DTO reader. Form paths use the server
// field names (`answers.2.answerText`, `check.command`), so server issues map 1:1.

export interface QuestionEditorModule<TForm> {
  type: AdminQuestionType;
  label: string;
  icon: IconName;
  Editor: ComponentType<{
    value: TForm;
    onChange(v: TForm): void;
    errors: Record<string, string>;
  }>;
  schema: ZodType<TForm>;
  empty(): TForm;
  toPayload(v: TForm): CreateQuestionPayload;
  fromDto(q: AdminQuestionDto): TForm;
}

/** The registry stores modules of every form shape; the drawer always pairs a module with its own values. */
export type AnyQuestionEditorModule = QuestionEditorModule<unknown>;

/**
 * Erases a typed module for the registry. The only erasure point: the registry is keyed by
 * question type, so each module only ever receives the value shape it produced.
 */
export function eraseModule<TForm>(module: QuestionEditorModule<TForm>): AnyQuestionEditorModule {
  return module as unknown as AnyQuestionEditorModule;
}

/* ── Form values ─────────────────────────────────────────────────────── */

/** Fields every question type edits. Penalties are `null` while the field is empty. */
export interface QuestionCommonValues {
  questionText: string;
  points: number | null;
  explanation: string;
  isActive: boolean;
  wrongPenalty: number | null;
  guessPenalty: number | null;
}

/** One answer row (options, accepted answers, ordering items). `key` is client only. */
export interface OptionRow {
  key: string;
  answerText: string;
  isCorrect: boolean;
}

/** One bucket-sort card; `answerOrder` is the 1-based bucket index, `null` until chosen. */
export interface BucketCardRow {
  key: string;
  answerText: string;
  answerOrder: number | null;
}

export interface ChoiceForm extends QuestionCommonValues {
  answers: OptionRow[];
}

export interface TrueFalseForm extends QuestionCommonValues {
  correct: 'true' | 'false' | null;
}

export interface MultiSelectForm extends QuestionCommonValues {
  answers: OptionRow[];
}

export interface FillBlankForm extends QuestionCommonValues {
  answers: OptionRow[];
}

export interface OrderingForm extends QuestionCommonValues {
  instructions: string;
  answers: OptionRow[];
}

export interface BucketSortForm extends QuestionCommonValues {
  buckets: string[];
  answers: BucketCardRow[];
}

export type TerminalMode = 'answer' | 'check';
export type TerminalAnswerFormat = 'choice' | 'text';

export interface TerminalForm extends QuestionCommonValues {
  instructions: string;
  labId: number | null;
  mode: TerminalMode;
  answerFormat: TerminalAnswerFormat;
  setup: string[];
  answers: OptionRow[];
  check: LabStepCheck;
}

/* ── Limits (server rules, contract C§6.1 and C§4.4) ─────────────────── */

export const QUESTION_TEXT_MAX = 2000;
export const EXPLANATION_MAX = 2000;
export const ANSWER_TEXT_MAX = 2000;
export const INSTRUCTIONS_MAX = 2000;
export const SETUP_COMMAND_MAX = 4000;
export const BUCKET_NAME_MAX = 200;
export const POINTS_MIN = 1;
export const POINTS_MAX = 100;
export const PENALTY_MIN = 0;
export const PENALTY_MAX = 1000;

const POINTS_MESSAGE = `Enter points from ${POINTS_MIN} to ${POINTS_MAX}.`;
const PENALTY_MESSAGE = `Use a whole number from ${PENALTY_MIN} to ${PENALTY_MAX}.`;
const ANSWER_TEXT_MESSAGE = 'Enter the answer text.';

/* ── Shared zod rules ────────────────────────────────────────────────── */

export const penaltyRule = z
  .number({ error: PENALTY_MESSAGE })
  .int({ error: PENALTY_MESSAGE })
  .min(PENALTY_MIN, { error: PENALTY_MESSAGE })
  .max(PENALTY_MAX, { error: PENALTY_MESSAGE });

export const answerTextRule = z
  .string({ error: ANSWER_TEXT_MESSAGE })
  .trim()
  .min(1, { error: ANSWER_TEXT_MESSAGE })
  .max(ANSWER_TEXT_MAX, { error: `Use ${ANSWER_TEXT_MAX} characters or fewer.` });

export const answerRowSchema = z.object({
  key: z.string(),
  answerText: answerTextRule,
  isCorrect: z.boolean(),
});

/** A list of answer rows with a count rule; `noun` names the rows in the messages. */
export function answerListSchema(noun: string, min: number, max: number) {
  return z
    .array(answerRowSchema)
    .min(min, { error: `Add at least ${min} ${noun}.` })
    .max(max, { error: `Use ${max} ${noun} or fewer.` });
}

/** Fields shared by every question schema (the rule keys match `QuestionCommonValues`). */
export const commonSchemaShape = {
  questionText: z
    .string({ error: 'Enter the question text.' })
    .trim()
    .min(3, { error: 'Use at least 3 characters.' })
    .max(QUESTION_TEXT_MAX, { error: `Use ${QUESTION_TEXT_MAX} characters or fewer.` }),
  points: z
    .number({ error: POINTS_MESSAGE })
    .int({ error: POINTS_MESSAGE })
    .min(POINTS_MIN, { error: POINTS_MESSAGE })
    .max(POINTS_MAX, { error: POINTS_MESSAGE }),
  explanation: z
    .string()
    .max(EXPLANATION_MAX, { error: `Use ${EXPLANATION_MAX} characters or fewer.` }),
  isActive: z.boolean(),
  wrongPenalty: penaltyRule,
  // Validated only where the guess cost is shown (terminal answer mode).
  guessPenalty: z.number().nullable(),
};

/* ── Defaults ────────────────────────────────────────────────────────── */

let keySequence = 0;

/** Client-only key for a row (React keys and reorder ids). */
export function nextKey(): string {
  keySequence += 1;
  return `row-${keySequence}`;
}

export function commonEmpty(): QuestionCommonValues {
  return {
    questionText: '',
    points: QUESTION_DEFAULTS.points,
    explanation: '',
    isActive: true,
    wrongPenalty: QUESTION_DEFAULTS.wrongPenalty,
    guessPenalty: QUESTION_DEFAULTS.guessPenalty,
  };
}

export function blankRow(): OptionRow {
  return { key: nextKey(), answerText: '', isCorrect: false };
}

export function blankRows(count: number): OptionRow[] {
  return Array.from({ length: count }, () => blankRow());
}

/** Starting check for a terminal check question: a command that must exit 0. */
export function defaultCheck(): LabStepCheck {
  return {
    type: 'command',
    command: '',
    expect: { mode: 'exitCode', value: 0 },
    timeoutMs: LAB_STEP_DEFAULTS.timeoutMs,
  };
}

/* ── Issues and errors ───────────────────────────────────────────────── */

export interface IssueLike {
  path: ReadonlyArray<PropertyKey>;
  message: string;
}

/** Field messages keyed by dotted path; the first message per path wins. */
export function issuesToErrors(issues: ReadonlyArray<IssueLike>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || 'form';
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

/** Per-row messages for `${prefix}.${index}` keys, shaped for list fields. */
export function indexedErrors(
  errors: Record<string, string>,
  prefix: string,
  count: number,
): Array<string | undefined> {
  return Array.from({ length: count }, (_, index) => errors[`${prefix}.${index}`]);
}

/* ── DTO readers and payload builders ────────────────────────────────── */

export function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readNumber(config: Record<string, unknown>, key: string, fallback: number): number {
  const value = config[key];
  return typeof value === 'number' ? value : fallback;
}

export function commonFromDto(question: AdminQuestionDto): QuestionCommonValues {
  const config = readRecord(question.config);
  return {
    questionText: question.questionText,
    points: question.points,
    explanation: question.explanation ?? '',
    isActive: question.isActive,
    wrongPenalty: readNumber(config, 'wrongPenalty', QUESTION_DEFAULTS.wrongPenalty),
    guessPenalty: readNumber(config, 'guessPenalty', QUESTION_DEFAULTS.guessPenalty),
  };
}

/**
 * Common payload fields. The schema has already rejected empty numbers before a payload is
 * built, so `NaN` (serialized as null) only shows up if validation was skipped, and the
 * server then rejects it instead of storing a silent default.
 */
export function commonPayload(
  value: QuestionCommonValues,
): Pick<CreateQuestionPayload, 'questionText' | 'points' | 'explanation' | 'isActive'> {
  const explanation = value.explanation.trim();
  return {
    questionText: value.questionText.trim(),
    points: value.points ?? Number.NaN,
    explanation: explanation === '' ? null : explanation,
    isActive: value.isActive,
  };
}

/** Penalty fields of a config. The guess cost is sent as 0 unless the type shows it. */
export function penaltyConfig(
  value: QuestionCommonValues,
  showGuess: boolean,
): { wrongPenalty: number; guessPenalty: number } {
  return {
    wrongPenalty: value.wrongPenalty ?? Number.NaN,
    guessPenalty: showGuess ? (value.guessPenalty ?? Number.NaN) : 0,
  };
}

export function rowsFromDto(answers: AdminAnswerDto[]): OptionRow[] {
  return [...answers]
    .sort((a, b) => a.answerOrder - b.answerOrder)
    .map((answer) => ({
      key: nextKey(),
      answerText: answer.answerText,
      isCorrect: answer.isCorrect,
    }));
}

/**
 * Answer payload from rows, `answerOrder` = position. `allCorrect` is used by types
 * where every row is an accepted answer (fill blank, ordering, terminal text).
 */
export function rowsPayload(rows: OptionRow[], allCorrect = false): QuestionAnswerInput[] {
  return rows.map((row, index) => ({
    answerText: row.answerText.trim(),
    isCorrect: allCorrect ? true : row.isCorrect,
    answerOrder: index + 1,
  }));
}
