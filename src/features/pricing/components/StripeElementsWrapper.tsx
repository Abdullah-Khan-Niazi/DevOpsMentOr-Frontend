import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { useEffect, useState, type ReactNode } from 'react';
import { ENV } from '@/shared/constants';

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> {
  if (!ENV.STRIPE_PUBLISHABLE_KEY) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(ENV.STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

interface StripeElementsWrapperProps {
  children: (stripe: Stripe | null) => ReactNode;
}

/**
 * F9 checkout card surface. When no publishable key is configured the
 * wrapper still renders so the checkout flow stays usable with saved
 * payment methods only.
 */
export function StripeElementsWrapper({ children }: StripeElementsWrapperProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getStripe().then((instance) => {
      if (cancelled) {
        return;
      }
      setStripe(instance);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }
  if (!stripe) {
    return <>{children(null)}</>;
  }
  return <Elements stripe={stripe}>{children(stripe)}</Elements>;
}

export default StripeElementsWrapper;
