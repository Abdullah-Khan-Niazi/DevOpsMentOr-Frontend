import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { billingService } from '@/features/billing';
import { checkoutService } from '../services/checkoutService';
import type { BillingCycle, PlanTier } from '../types';

export function usePricingPlans() {
  return useQuery({
    queryKey: QUERY_KEYS.billing.plans,
    queryFn: () => checkoutService.getPlans(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: (vars: {
      code: string;
      planType: PlanTier['planType'];
      billingCycle: BillingCycle;
    }) => checkoutService.validateCoupon(vars.code, vars.planType, vars.billingCycle),
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: billingService.createSubscription,
  });
}
