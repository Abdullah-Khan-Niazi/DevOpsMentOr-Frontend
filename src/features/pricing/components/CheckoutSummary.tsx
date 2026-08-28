import { Card } from '@/shared/components';
import type { CouponValidation, PlanTier } from '@/features/billing';
import type { BillingCycle } from '../types';
import './checkout-summary.css';

interface CheckoutSummaryProps {
  plan: PlanTier;
  billingCycle: BillingCycle;
  coupon: CouponValidation | null;
}

function formatMoney(usd: number): string {
  return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** SCR-F9-01: order summary showing base price, discount and final total. */
export function CheckoutSummary({ plan, billingCycle, coupon }: CheckoutSummaryProps) {
  const base = billingCycle === 'monthly' ? plan.monthlyPriceUsd : plan.annualPriceUsd;
  const discount = coupon?.discountAmount ?? 0;
  const total = Math.max(0, base - discount);

  return (
    <Card className="checkout-summary">
      <h3 className="checkout-summary__title">Order summary</h3>
      <dl className="checkout-summary__rows">
        <div className="checkout-summary__row">
          <dt>
            {plan.displayName} ({billingCycle})
          </dt>
          <dd>{formatMoney(base)}</dd>
        </div>
        {discount > 0 ? (
          <div className="checkout-summary__row">
            <dt>Discount</dt>
            <dd>-{formatMoney(discount)}</dd>
          </div>
        ) : null}
        <div className="checkout-summary__row checkout-summary__row--total">
          <dt>Total</dt>
          <dd>{formatMoney(total)}</dd>
        </div>
      </dl>
    </Card>
  );
}

export default CheckoutSummary;
