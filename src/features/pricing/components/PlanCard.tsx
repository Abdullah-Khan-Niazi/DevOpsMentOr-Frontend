import { Card } from '@/shared/components';
import type { PlanTier } from '@/features/billing';
import type { BillingCycle } from '../types';
import './plan-card.css';

interface PlanCardProps {
  plan: PlanTier;
  billingCycle: BillingCycle;
  selected: boolean;
  onSelect: () => void;
}

function formatPrice(usd: number): string {
  if (usd === 0) {
    return '$0';
  }
  return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** SCR-F9-01: selectable plan tier card on the checkout page. */
export function PlanCard({ plan, billingCycle, selected, onSelect }: PlanCardProps) {
  const price = billingCycle === 'monthly' ? plan.monthlyPriceUsd : plan.annualPriceUsd;
  return (
    <button type="button" className="plan-card" onClick={onSelect} aria-pressed={selected}>
      <Card interactive highlighted={selected} className="plan-card__card">
        <div className="plan-card__header">
          <span className="plan-card__name">{plan.displayName}</span>
          {selected ? <span className="plan-card__selected">Selected</span> : null}
        </div>
        <p className="plan-card__price">
          {formatPrice(price)}
          <span className="plan-card__cycle">
            {' '}
            / {billingCycle === 'monthly' ? 'month' : 'year'}
          </span>
        </p>
        <ul className="plan-card__features">
          {plan.features.premiumLabsAccess ? <li>Premium lab access</li> : null}
          {plan.features.premiumCoursesAccess ? <li>Premium courses</li> : null}
          {plan.features.aiMentorAccess ? <li>AI Mentor access</li> : null}
          {plan.features.certificatesIncluded ? <li>Certificates included</li> : null}
          {plan.features.prioritySupport ? <li>Priority support</li> : null}
        </ul>
      </Card>
    </button>
  );
}

export default PlanCard;
