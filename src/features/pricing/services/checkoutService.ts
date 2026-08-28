import { apiClient } from '@/shared/services';
import type { CouponValidation, PlanCatalog } from '@/features/billing';
import type { BillingCycle, PlanTier } from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F9 pricing surface (BIL-01/02/05, SCR-F9-01). */
export const checkoutService = {
  async getPlans(): Promise<PlanCatalog> {
    const { data } = await apiClient.get<{ data: PlanCatalog }>('/billing/plans');
    return unwrap(data);
  },

  async validateCoupon(
    code: string,
    planType: PlanTier['planType'],
    billingCycle: BillingCycle,
  ): Promise<CouponValidation> {
    const { data } = await apiClient.post<{ data: CouponValidation }>('/billing/coupons/validate', {
      code,
      planType,
      billingCycle,
    });
    return unwrap(data);
  },
};

export default checkoutService;
