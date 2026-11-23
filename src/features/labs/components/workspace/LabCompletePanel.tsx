import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LabStepsStateTotals } from '@/features/labs/types';
import { getNetLabEarnedXp } from '@/features/labs/utils/stepXp';
import { Button } from '@/shared/components/Button';
import { Countdown } from '@/shared/components/Countdown';
import { Icon } from '@/shared/components/Icon';
import { XpDelta } from '@/shared/components/XpDelta';

export interface LabCompletePanelProps {
  completedAt: string;
  /** Scaled completion bonus of the lab (0 when the lab has none). */
  completionBonus: number;
  totals: LabStepsStateTotals;
  /** Effective total lab XP after permanent hint deductions. */
  effectiveTotalXp?: number;
  /** Deadline of the lab environment grace period; null when no environment is running. */
  graceExpiresAt: string | null;
  next: { label: string; to: string } | null;
  backTo: string;
}

interface TotalRowProps {
  label: string;
  children: ReactNode;
}

function TotalRow({ label, children }: TotalRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="m-0 text-sm font-medium text-card-foreground">{children}</dd>
    </div>
  );
}

/** Penalty totals are stored as positive amounts and shown as negative XP deltas. */
function PenaltyValue({ amount }: { amount: number }) {
  return amount > 0 ? <XpDelta delta={-amount} /> : <span className="tabular-nums">0 XP</span>;
}

/** Shown once the lab is completed: bonus, totals, environment grace period and navigation. */
export function LabCompletePanel({
  completedAt,
  completionBonus,
  totals,
  effectiveTotalXp,
  graceExpiresAt,
  next,
  backTo,
}: LabCompletePanelProps) {
  const navigate = useNavigate();
  const completedDate = new Date(completedAt);
  const netEarned = getNetLabEarnedXp(totals);
  const totalAvailable = effectiveTotalXp ?? totals.pointsAvailable;

  return (
    <section className="motion-pop-in flex flex-col gap-5 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Icon name="trophy" size={22} filled className="shrink-0 text-check-success" />
          <h2 className="m-0 text-xl font-semibold tracking-tight text-card-foreground">
            Lab complete
          </h2>
        </div>
        {Number.isNaN(completedDate.getTime()) ? null : (
          <time dateTime={completedAt} className="text-sm text-muted">
            {completedDate.toLocaleDateString()}
          </time>
        )}
      </div>

      {completionBonus > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted">Completion bonus</span>
          <XpDelta delta={completionBonus} />
        </div>
      ) : null}

      <dl className="m-0 flex flex-col">
        <TotalRow label="Earned">
          <span className="tabular-nums">
            {netEarned} of {totalAvailable} XP
          </span>
        </TotalRow>
        <TotalRow label="Hint penalties">
          <PenaltyValue amount={totals.hintPenalties} />
        </TotalRow>
        <TotalRow label="Wrong answer penalties">
          <PenaltyValue amount={totals.wrongAnswerPenalties} />
        </TotalRow>
        <TotalRow label="Guess penalties">
          <PenaltyValue amount={totals.guessPenalties} />
        </TotalRow>
      </dl>

      {graceExpiresAt !== null ? (
        <p className="m-0 flex flex-wrap items-center gap-1 text-sm text-muted">
          <span>Lab environment ends in</span>
          <Countdown until={graceExpiresAt} />
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {next ? (
          <Button
            variant="primary"
            iconName="arrow-right"
            iconPosition="right"
            onClick={() => navigate(next.to)}
          >
            {next.label}
          </Button>
        ) : null}
        <Button variant="secondary" iconName="arrow-left" onClick={() => navigate(backTo)}>
          Back
        </Button>
      </div>
    </section>
  );
}
