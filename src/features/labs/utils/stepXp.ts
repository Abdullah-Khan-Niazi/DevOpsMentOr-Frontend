import type {
  LabStepsStateDto,
  LabStepsStateTotals,
  LearnerLabStepDto,
} from '@/features/labs/types';

/** Total XP deducted by hints revealed on a single step. */
export function getStepHintDeduction(step: LearnerLabStepDto): number {
  return step.hints.revealed.length * step.hints.cost;
}

/** Step XP remaining after deducting the cost of any revealed hints on that step. */
export function getEffectiveStepXp(step: LearnerLabStepDto): number {
  const base =
    step.status === 'passed' && step.pointsAwarded > 0 ? step.pointsAwarded : step.points;
  return Math.max(0, base - getStepHintDeduction(step));
}

/** Total lab XP available after accounting for hint deductions across all steps. */
export function getEffectiveLabTotalXp(state: LabStepsStateDto): number {
  const stepSum = state.steps.reduce((sum, step) => sum + getEffectiveStepXp(step), 0);
  return Math.max(0, stepSum + state.completionBonus);
}

/** Net XP earned in the current lab after subtracting hint, wrong-answer and guess penalties. */
export function getNetLabEarnedXp(totals: LabStepsStateTotals): number {
  return Math.max(
    0,
    totals.pointsEarned -
      totals.hintPenalties -
      totals.wrongAnswerPenalties -
      totals.guessPenalties,
  );
}
