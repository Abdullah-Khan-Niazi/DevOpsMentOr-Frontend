/** F9 learner billing DTOs (mirror backend §05 shapes). */

export type PlanType = 'free' | 'premium' | 'enterprise' | 'student';
export type BillingCycle = 'monthly' | 'annual';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethodType =
  'credit_card' | 'paypal' | 'crypto' | 'bank_transfer' | 'enterprise_invoice';
export type DiscountType = 'percentage' | 'fixed_amount';

export interface PlanTier {
  planType: PlanType;
  displayName: string;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  features: {
    premiumLabsAccess: boolean;
    premiumCoursesAccess: boolean;
    labTtlHours: number;
    labExtensionAllowed: boolean;
    aiMentorAccess: boolean;
    certificatesIncluded: boolean;
    downloadableResources: boolean;
    prioritySupport: boolean;
  };
}

export interface PlanCatalog {
  plans: PlanTier[];
  currency: string;
}

export interface SubscriptionDto {
  subscriptionId: number;
  userId: number;
  organizationId: number | null;
  planName: string;
  planType: PlanType;
  stripeSubscriptionId: string | null;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  isActive: boolean;
  cancelledAt: string | null;
  createdAt: string;
}

export interface CurrentSubscription {
  planType: PlanType;
  subscription: SubscriptionDto | null;
}

export interface PaymentMethodDto {
  paymentMethodId: number;
  methodType: PaymentMethodType;
  last4Digits: string | null;
  cardBrand: string | null;
  stripePaymentMethodId: string | null;
  paypalEmail: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface OrderDto {
  orderId: number;
  userId: number;
  subscriptionId: number | null;
  orderNumber: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentMethodId: number | null;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  createdAt: string;
  invoiceId: number | null;
  invoiceNumber: string | null;
}

export interface InvoiceDto {
  invoiceId: number;
  orderId: number;
  invoiceNumber: string;
  invoiceUrl: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface CouponValidation {
  couponId: number;
  discountType: DiscountType;
  discountValue: number;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  expiresAt: string;
}

export interface CreateSubscriptionResult {
  subscriptionId: number;
  orderId: number;
  orderNumber: string;
  finalAmount: number;
  currency: string;
  clientSecret: string | null;
  status: 'pending' | 'paid';
}

export interface CancelSubscriptionResult {
  subscriptionId: number;
  cancelledAt: string;
  endDate: string | null;
  isActive: boolean;
}

export interface PortalSession {
  url: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSubscriptionPayload {
  planType: Exclude<PlanType, 'free'>;
  billingCycle: BillingCycle;
  paymentMethodId?: number;
  couponCode?: string;
}

export interface AddPaymentMethodPayload {
  stripePaymentMethodId: string;
  methodType: 'credit_card' | 'paypal' | 'enterprise_invoice';
  paypalEmail?: string;
}
