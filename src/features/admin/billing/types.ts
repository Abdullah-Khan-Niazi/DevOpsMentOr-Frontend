import type { OrderStatus, PlanType } from '@/features/billing';

export type { OrderStatus, PlanType } from '@/features/billing';

export interface AdminBillingOverview {
  activeSubscriptions: number;
  byPlan: Record<PlanType, number>;
  monthlyRevenue: number;
  activeCoupons: number;
  openRefundFlags: number;
}

export interface AdminSubscriptionRow {
  subscriptionId: number;
  userId: number;
  userEmail: string;
  userFullName: string | null;
  organizationId: number | null;
  organizationName: string | null;
  planName: string;
  planType: PlanType;
  autoRenew: boolean;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface AdminOrderRow {
  orderId: number;
  userId: number;
  userEmail: string;
  userFullName: string | null;
  orderNumber: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  currency: string;
  status: OrderStatus;
  subscriptionId: number | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminCouponRow {
  couponId: number;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminPaginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdjustSubscriptionPayload {
  planType?: PlanType;
  autoRenew?: boolean;
  isActive?: boolean;
  endDate?: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  maxUses?: number;
  expiresAt?: string;
  isActive?: boolean;
}
