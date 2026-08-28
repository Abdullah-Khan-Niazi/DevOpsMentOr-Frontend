import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { billingService } from '../services/billingService';
import type { AddPaymentMethodPayload, CreateSubscriptionPayload } from '../types';

export function usePlans() {
  return useQuery({
    queryKey: QUERY_KEYS.billing.plans,
    queryFn: () => billingService.getPlans(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrentSubscription() {
  return useQuery({
    queryKey: QUERY_KEYS.billing.current,
    queryFn: () => billingService.getCurrentSubscription(),
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: QUERY_KEYS.billing.paymentMethods,
    queryFn: () => billingService.getPaymentMethods(),
  });
}

export function useOrders(page = 1, limit = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.orders(page),
    queryFn: () => billingService.getOrders(page, limit),
  });
}

export function useInvoices(page = 1, limit = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.invoices(page),
    queryFn: () => billingService.getInvoices(page, limit),
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) => billingService.createSubscription(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.current });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: number) => billingService.cancelSubscription(subscriptionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.current });
    },
  });
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddPaymentMethodPayload) => billingService.addPaymentMethod(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.paymentMethods });
    },
  });
}

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: number) =>
      billingService.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.paymentMethods });
    },
  });
}

export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: number) => billingService.removePaymentMethod(paymentMethodId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.paymentMethods });
    },
  });
}

export function usePortalSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => billingService.createPortalSession(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.current });
    },
  });
}

export function useInvoiceDownload() {
  return useMutation({
    mutationFn: (invoiceId: number) => billingService.getInvoiceDownloadUrl(invoiceId),
  });
}
