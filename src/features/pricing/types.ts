import type { BillingCycle, CreateSubscriptionPayload, PlanTier } from '@/features/billing';

export interface CheckoutState {
  plan: PlanTier;
  billingCycle: BillingCycle;
  couponCode: string | null;
  couponDiscount: number;
  finalPrice: number;
}

export function computeCheckout(
  plan: PlanTier,
  billingCycle: BillingCycle,
  discountAmount = 0,
): number {
  const base = billingCycle === 'monthly' ? plan.monthlyPriceUsd : plan.annualPriceUsd;
  return Math.max(0, base - discountAmount);
}

export type { BillingCycle, CreateSubscriptionPayload, PlanTier };
