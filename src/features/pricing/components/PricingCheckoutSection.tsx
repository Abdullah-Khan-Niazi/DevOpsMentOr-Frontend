import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, ErrorState, LoadingState, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { usePaymentMethods } from '@/features/billing';
import type { CouponValidation } from '@/features/billing';
import { PlanCard } from './PlanCard';
import { CouponInput } from './CouponInput';
import { CheckoutSummary } from './CheckoutSummary';
import { StripeElementsWrapper } from './StripeElementsWrapper';
import { useCreateCheckout, usePricingPlans } from '../hooks/useCheckout';
import type { BillingCycle, PlanTier } from '../types';
import './pricing-checkout.css';

type PaidPlanTier = PlanTier & { planType: Exclude<PlanTier['planType'], 'free'> };

function CheckoutForm({ stripeAvailable }: { stripeAvailable: boolean }) {
  const [plan, setPlan] = useState<PaidPlanTier | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [payWithNewCard, setPayWithNewCard] = useState(false);
  const [savedMethodId, setSavedMethodId] = useState<number | null>(null);
  const create = useCreateCheckout();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { data: catalog } = usePricingPlans();
  const { data: methods } = usePaymentMethods();

  const paidPlans = (catalog?.plans ?? []).filter((p): p is PaidPlanTier => p.planType !== 'free');
  const selectedPlan = plan ?? paidPlans[0] ?? null;
  const activeMethods = (methods ?? []).filter((pm) => pm.isActive);
  const defaultMethod = activeMethods.find((pm) => pm.isDefault) ?? activeMethods[0] ?? null;
  const selectedSavedId = savedMethodId ?? defaultMethod?.paymentMethodId ?? null;

  const submit = async (): Promise<void> => {
    if (create.isPending || !selectedPlan) {
      return;
    }
    if (!payWithNewCard && !selectedSavedId) {
      toast.error('Choose a payment method first.');
      return;
    }

    try {
      if (!payWithNewCard && selectedSavedId) {
        const result = await create.mutateAsync({
          planType: selectedPlan.planType,
          billingCycle: cycle,
          paymentMethodId: selectedSavedId,
          couponCode: couponCode ?? undefined,
        });
        toast.success(`Order ${result.orderNumber} paid. Welcome to ${selectedPlan.displayName}.`);
        navigate(ROUTES.BILLING);
        return;
      }

      const result = await create.mutateAsync({
        planType: selectedPlan.planType,
        billingCycle: cycle,
        couponCode: couponCode ?? undefined,
      });
      if (!result.clientSecret) {
        toast.success(`Order ${result.orderNumber} paid. Welcome to ${selectedPlan.displayName}.`);
        navigate(ROUTES.BILLING);
        return;
      }
      if (!stripe || !elements) {
        toast.error('Payment is not available right now.');
        return;
      }
      const outcome = await stripe.confirmPayment({
        elements,
        clientSecret: result.clientSecret,
        redirect: 'if_required',
      });
      if (outcome.error) {
        toast.error(outcome.error.message ?? 'Payment failed.');
        return;
      }
      toast.success(`Order ${result.orderNumber} paid. Welcome to ${selectedPlan.displayName}.`);
      navigate(ROUTES.BILLING);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed.');
    }
  };

  if (!selectedPlan) {
    return null;
  }

  return (
    <div className="pricing-checkout__body">
      <section className="pricing-checkout__section">
        <h3 className="pricing-checkout__section-title">Choose your plan</h3>
        <div className="pricing-checkout__plans">
          {paidPlans.map((paidPlan) => (
            <PlanCard
              key={paidPlan.planType}
              plan={paidPlan}
              billingCycle={cycle}
              selected={selectedPlan.planType === paidPlan.planType}
              onSelect={() => setPlan(paidPlan)}
            />
          ))}
        </div>
      </section>

      <section className="pricing-checkout__section">
        <h3 className="pricing-checkout__section-title">Billing cycle</h3>
        <div className="pricing-checkout__cycle">
          <Button
            variant={cycle === 'monthly' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCycle('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={cycle === 'annual' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCycle('annual')}
          >
            Annual
          </Button>
        </div>
      </section>

      <section className="pricing-checkout__section">
        <h3 className="pricing-checkout__section-title">Promo code</h3>
        <CouponInput
          planType={selectedPlan.planType}
          billingCycle={cycle}
          onValidated={(validation, code) => {
            setCoupon(validation);
            setCouponCode(validation ? code : null);
          }}
        />
      </section>

      <section className="pricing-checkout__section">
        <h3 className="pricing-checkout__section-title">Payment</h3>
        {activeMethods.length > 0 ? (
          <div className="pricing-checkout__methods">
            {activeMethods.map((method) => (
              <button
                key={method.paymentMethodId}
                type="button"
                className="pricing-checkout__method"
                aria-pressed={!payWithNewCard && selectedSavedId === method.paymentMethodId}
                onClick={() => {
                  setPayWithNewCard(false);
                  setSavedMethodId(method.paymentMethodId);
                }}
              >
                {method.methodType === 'paypal'
                  ? (method.paypalEmail ?? 'PayPal')
                  : `${method.cardBrand ?? 'Card'} •••• ${method.last4Digits ?? '····'}`}
                {method.isDefault ? ' (default)' : ''}
              </button>
            ))}
            <button
              type="button"
              className="pricing-checkout__method"
              aria-pressed={payWithNewCard}
              onClick={() => setPayWithNewCard(true)}
            >
              New card
            </button>
          </div>
        ) : null}

        {payWithNewCard || activeMethods.length === 0 ? (
          <div className="pricing-checkout__card-form">
            {stripeAvailable ? (
              <PaymentElement />
            ) : (
              <p className="pricing-checkout__hint">Card payments are not available right now.</p>
            )}
          </div>
        ) : null}

        {create.isError ? (
          <p className="pricing-checkout__error">
            {create.error instanceof Error ? create.error.message : 'Checkout failed.'}
          </p>
        ) : null}
      </section>

      <CheckoutSummary plan={selectedPlan} billingCycle={cycle} coupon={coupon} />

      <div className="pricing-checkout__submit">
        <Button size="lg" isLoading={create.isPending} onClick={() => void submit()}>
          Subscribe
        </Button>
      </div>
    </div>
  );
}

/**
 * SCR-F9-01: Pricing & Checkout. Plan cards are always visible; clicking
 * Subscribe while unauthenticated redirects to login with a return path,
 * then the full checkout (coupon, summary, Stripe Elements) renders once
 * authenticated.
 */
export function PricingCheckoutSection() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: catalog, isLoading, isError } = usePricingPlans();

  if (isLoading) {
    return <LoadingState label="Loading plans…" />;
  }
  if (isError || !catalog || catalog.plans.length === 0) {
    return <ErrorState title="Plans unavailable" message="Please try again later." />;
  }

  if (!isAuthenticated) {
    const plans = catalog.plans.filter((p) => p.planType !== 'free');
    return (
      <div className="pricing-checkout__body">
        <section className="pricing-checkout__section">
          <h3 className="pricing-checkout__section-title">Choose your plan</h3>
          <div className="pricing-checkout__plans">
            {plans.map((paidPlan) => (
              <div key={paidPlan.planType} className="pricing-checkout__anonymous-card">
                <PlanCard
                  plan={paidPlan}
                  billingCycle="monthly"
                  selected={false}
                  onSelect={() => undefined}
                />
                <Link to={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(ROUTES.PRICING)}`}>
                  <Button size="sm" className="pricing-checkout__subscribe-link">
                    Subscribe
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <StripeElementsWrapper>
      {(stripe) => <CheckoutForm stripeAvailable={stripe !== null} />}
    </StripeElementsWrapper>
  );
}

export default PricingCheckoutSection;
