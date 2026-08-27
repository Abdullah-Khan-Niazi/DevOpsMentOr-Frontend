import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { adminBillingService } from '../services/adminBillingService';
import type { AdjustSubscriptionPayload, CreateCouponPayload } from '../types';

function subscriptionsKey(params: {
  page: number;
  limit: number;
  search?: string;
  planType?: string;
}): string {
  return JSON.stringify(params);
}

function ordersKey(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}): string {
  return JSON.stringify(params);
}

function couponsKey(params: { page: number; limit: number; search?: string }): string {
  return JSON.stringify(params);
}

export function useAdminBillingOverview() {
  return useQuery({
    queryKey: QUERY_KEYS.adminBilling.overview,
    queryFn: () => adminBillingService.getOverview(),
  });
}

export function useAdminSubscriptions(params: {
  page: number;
  limit: number;
  search?: string;
  planType?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.adminBilling.subscriptions(subscriptionsKey(params)),
    queryFn: () => adminBillingService.getSubscriptions(params),
  });
}

export function useAdminOrders(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.adminBilling.orders(ordersKey(params)),
    queryFn: () => adminBillingService.getOrders(params),
  });
}

export function useAdminCoupons(params: { page: number; limit: number; search?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.adminBilling.coupons(couponsKey(params)),
    queryFn: () => adminBillingService.getCoupons(params),
  });
}

export function useAdjustSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { subscriptionId: number; payload: AdjustSubscriptionPayload }) =>
      adminBillingService.adjustSubscription(vars.subscriptionId, vars.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'overview'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'subscriptions'] });
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCouponPayload) => adminBillingService.createCoupon(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'coupons'] });
    },
  });
}

export function useToggleCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { couponId: number; isActive: boolean }) =>
      adminBillingService.toggleCoupon(vars.couponId, vars.isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'coupons'] });
    },
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => adminBillingService.refundOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'overview'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'orders'] });
    },
  });
}
