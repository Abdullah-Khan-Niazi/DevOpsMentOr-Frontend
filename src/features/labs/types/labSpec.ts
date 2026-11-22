/**
 * Lab step spec v2 (`pro_labs.flag_values`), mirrored from the backend
 * `src/features/labs/dto/lab-spec.dto.ts` (contract C§2.1). Admin-only: the
 * full spec carries check commands, setup scripts, accepted answers and hints,
 * so it is only ever read and written by the staff lab spec editor.
 */

export type LabMode = 'guided' | 'break_fix';
export type LabStepKind = 'task' | 'question';
export type LabCheckType = 'command' | 'file' | 'output' | 'http';
export type LabExpectMode = 'exitCode' | 'exact' | 'contains' | 'regex' | 'numeric';
export type LabNumericOp = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
export type LabAnswerNormalize = 'none' | 'trim' | 'trim_lower' | 'collapse_ws_lower';

export type LabStepExpect =
  | { mode: 'exitCode'; value: number }
  | { mode: 'exact'; value: string }
  | { mode: 'contains'; value: string }
  | { mode: 'regex'; value: string }
  | { mode: 'numeric'; value: number; op: LabNumericOp };

export type LabStepCheck =
  | {
      type: 'command';
      command: string;
      expect: Extract<LabStepExpect, { mode: 'exitCode' }>;
      timeoutMs: number;
    }
  | {
      type: 'output';
      command: string;
      expect: Exclude<LabStepExpect, { mode: 'exitCode' }>;
      timeoutMs: number;
    }
  | { type: 'file'; path: string; expect: LabStepExpect; timeoutMs: number }
  | {
      type: 'http';
      path: string;
      port: number;
      expect: Extract<LabStepExpect, { mode: 'numeric' }>;
      timeoutMs: number;
    };

export interface LabStepAnswer {
  accepted: string[];
  normalize: LabAnswerNormalize;
}

export interface LabHint {
  id: string;
  text: string;
}

export interface LabStepV2 {
  id: string;
  title: string;
  /** Markdown. */
  instructions: string;
  kind: LabStepKind;
  /** Shell commands run in the environment when the step is staged (server only). */
  setup: string[];
  /** Task steps only. */
  check?: LabStepCheck;
  /** Question steps only. */
  answer?: LabStepAnswer;
  hints: LabHint[];
  /** Base points, scaled by `difficulty_levels.points_multiplier` at award time. */
  points: number;
  /** Points deducted per hint reveal of this step (0..1000, default 5). */
  hintCost: number;
  /** Question steps: deducted per wrong answer (0..1000, default 2); task steps: 0. */
  wrongPenalty: number;
  /** Question steps: deducted for an answer given without a shell command since stage (0..1000, default 5); task steps: 0. */
  guessPenalty: number;
}

export interface LabSpecV2 {
  version: 2;
  mode: LabMode;
  scenario: { intro: string; setup: string[] };
  /** Awarded once per lab when every step passed (0..10000, default 50), scaled by the difficulty multiplier. */
  completionBonus: number;
  steps: LabStepV2[];
}

/** How the stored `flag_values` parsed on the server. */
export type LabSpecStatus = 'v2' | 'legacy' | 'missing' | 'invalid';

/** One validation issue; `path` is dotted, for example `steps.2.check.command`. */
export interface LabSpecIssue {
  path: string;
  message: string;
}
