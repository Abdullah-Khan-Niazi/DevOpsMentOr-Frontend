// Authoring defaults for content values. Mirror of the backend CONTENT_DEFAULTS
// (contract C§3): the backend applies the same values through zod `.default()`,
// the editors prefill them so staff start from the same numbers.

export const QUESTION_DEFAULTS = {
  points: 10,
  wrongPenalty: 2,
  guessPenalty: 5,
} as const;

export const LAB_STEP_DEFAULTS = {
  points: 25,
  hintCost: 5,
  wrongPenalty: 2,
  guessPenalty: 5,
  completionBonus: 50,
  timeoutMs: 15000,
} as const;
