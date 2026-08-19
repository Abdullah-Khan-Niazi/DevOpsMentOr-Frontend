import { apiClient } from '@/shared/services';
import type {
  AdminBillingOverview,
  AdminCouponRow,
  AdminOrderRow,
  AdminPaginated,
  AdminSubscriptionRow,
  AdjustSubscriptionPayload,
  CreateCouponPayload,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F9 §07 admin billing endpoints (BIL-15..22, SCR-F9-05). */
export const adminBillingService = {
  /** BIL-22: billing KPIs. */
  async getOverview(): Promise<AdminBillingOverview> {
    const { data } = await apiClient.get<{ data: AdminBillingOverview }>('/billing/admin/overview');
    return unwrap(data);
  },

  /** BIL-15: paginated subscriptions with search and plan filter. */
  async getSubscriptions(params: {
    page: number;
    limit: number;
    search?: string;
    planType?: string;
  }): Promise<AdminPaginated<AdminSubscriptionRow>> {
    const { data } = await apiClient.get<{ data: AdminPaginated<AdminSubscriptionRow> }>(
      '/billing/admin/subscriptions',
      { params },
    );
    return unwrap(data);
  },

  /** BIL-16: adjust a subscription (plan, auto-renew, active state, end date). */
  async adjustSubscription(
    subscriptionId: number,
    payload: AdjustSubscriptionPayload,
  ): Promise<AdminSubscriptionRow> {
    const { data } = await apiClient.patch<{ data: AdminSubscriptionRow }>(
      `/billing/admin/subscriptions/${subscriptionId}`,
      payload,
    );
    return unwrap(data);
  },

  /** BIL-17: paginated orders with search and status filter. */
  async getOrders(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }): Promise<AdminPaginated<AdminOrderRow>> {
    const { data } = await apiClient.get<{ data: AdminPaginated<AdminOrderRow> }>(
      '/billing/admin/orders',
      {
        params,
      },
    );
    return unwrap(data);
  },

  /** BIL-19: paginated coupons. */
  async getCoupons(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<AdminPaginated<AdminCouponRow>> {
    const { data } = await apiClient.get<{ data: AdminPaginated<AdminCouponRow> }>(
      '/billing/admin/coupons',
      {
        params,
      },
    );
    return unwrap(data);
  },

  /** BIL-20: create a coupon. */
  async createCoupon(payload: CreateCouponPayload): Promise<AdminCouponRow> {
    const { data } = await apiClient.post<{ data: AdminCouponRow }>(
      '/billing/admin/coupons',
      payload,
    );
    return unwrap(data);
  },

  /** BIL-21: toggle coupon active state. */
  async toggleCoupon(couponId: number, isActive: boolean): Promise<AdminCouponRow> {
    const { data } = await apiClient.patch<{ data: AdminCouponRow }>(
      `/billing/admin/coupons/${couponId}`,
      {
        isActive,
      },
    );
    return unwrap(data);
  },

  /** BIL-18: flag a paid order for refund. */
  async refundOrder(orderId: number): Promise<void> {
    await apiClient.patch(`/billing/admin/orders/${orderId}/refund`, {});
  },
};

export default adminBillingService;
