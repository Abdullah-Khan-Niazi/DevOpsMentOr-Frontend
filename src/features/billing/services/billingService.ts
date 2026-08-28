import { apiClient } from '@/shared/services';
import type {
  AddPaymentMethodPayload,
  CancelSubscriptionResult,
  CouponValidation,
  CreateSubscriptionPayload,
  CreateSubscriptionResult,
  CurrentSubscription,
  InvoiceDto,
  OrderDto,
  Paginated,
  PaymentMethodDto,
  PlanCatalog,
  PortalSession,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F9 §07 learner billing endpoints (BIL-01..14, SCR-F9-02..04). */
export const billingService = {
  /** BIL-01: static plan catalog. */
  async getPlans(): Promise<PlanCatalog> {
    const { data } = await apiClient.get<{ data: PlanCatalog }>('/billing/plans');
    return unwrap(data);
  },

  /** BIL-03: current subscription (free plan represented as null). */
  async getCurrentSubscription(): Promise<CurrentSubscription> {
    const { data } = await apiClient.get<{ data: CurrentSubscription }>(
      '/billing/subscriptions/current',
    );
    return unwrap(data);
  },

  /** BIL-02: create a subscription and return the checkout client secret. */
  async createSubscription(payload: CreateSubscriptionPayload): Promise<CreateSubscriptionResult> {
    const { data } = await apiClient.post<{ data: CreateSubscriptionResult }>(
      '/billing/subscriptions',
      payload,
    );
    return unwrap(data);
  },

  /** BIL-04: cancel own subscription (access until end_date). */
  async cancelSubscription(subscriptionId: number): Promise<CancelSubscriptionResult> {
    const { data } = await apiClient.delete<{ data: CancelSubscriptionResult }>(
      `/billing/subscriptions/${subscriptionId}`,
    );
    return unwrap(data);
  },

  /** BIL-05: validate a coupon for the checkout preview. */
  async validateCoupon(
    code: string,
    planType: string,
    billingCycle: string,
  ): Promise<CouponValidation> {
    const { data } = await apiClient.post<{ data: CouponValidation }>('/billing/coupons/validate', {
      code,
      planType,
      billingCycle,
    });
    return unwrap(data);
  },

  /** BIL-06: own payment methods. */
  async getPaymentMethods(): Promise<PaymentMethodDto[]> {
    const { data } = await apiClient.get<{ data: PaymentMethodDto[] }>('/billing/payment-methods');
    return unwrap(data);
  },

  /** BIL-07: add a tokenized payment method. */
  async addPaymentMethod(payload: AddPaymentMethodPayload): Promise<PaymentMethodDto> {
    const { data } = await apiClient.post<{ data: PaymentMethodDto }>(
      '/billing/payment-methods',
      payload,
    );
    return unwrap(data);
  },

  /** BIL-08: set the default payment method. */
  async setDefaultPaymentMethod(paymentMethodId: number): Promise<PaymentMethodDto> {
    const { data } = await apiClient.patch<{ data: PaymentMethodDto }>(
      `/billing/payment-methods/${paymentMethodId}/default`,
    );
    return unwrap(data);
  },

  /** BIL-09: remove a payment method. */
  async removePaymentMethod(paymentMethodId: number): Promise<void> {
    await apiClient.delete(`/billing/payment-methods/${paymentMethodId}`);
  },

  /** BIL-10: own order history. */
  async getOrders(page = 1, limit = 20): Promise<Paginated<OrderDto>> {
    const { data } = await apiClient.get<{ data: Paginated<OrderDto> }>('/billing/orders', {
      params: { page, limit },
    });
    return unwrap(data);
  },

  /** BIL-11: own invoices. */
  async getInvoices(page = 1, limit = 20): Promise<Paginated<InvoiceDto>> {
    const { data } = await apiClient.get<{ data: Paginated<InvoiceDto> }>('/billing/invoices', {
      params: { page, limit },
    });
    return unwrap(data);
  },

  /** BIL-12: signed invoice download URL. */
  async getInvoiceDownloadUrl(invoiceId: number): Promise<string> {
    const { data } = await apiClient.get<{ data: { signedUrl: string } }>(
      `/billing/invoices/${invoiceId}/download`,
    );
    return unwrap(data).signedUrl;
  },

  /** BIL-14: Stripe Customer Portal session URL. */
  async createPortalSession(): Promise<PortalSession> {
    const { data } = await apiClient.post<{ data: PortalSession }>('/billing/portal/session', {});
    return unwrap(data);
  },
};

export default billingService;
