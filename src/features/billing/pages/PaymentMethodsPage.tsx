import { Button, EmptyState, PageHeader } from '@/shared/components';
import { Link } from 'react-router-dom';
import { usePaymentMethods } from '../hooks/useBilling';
import { ROUTES } from '@/shared/constants';
import { PaymentMethodCard } from '../components/PaymentMethodCard';
import { AddPaymentMethodModal } from '../components/AddPaymentMethodModal';
import { useState } from 'react';
import './payment-methods.css';

/** SCR-F9-03: all saved payment methods for the current user. */
export function PaymentMethodsPage() {
  const [adding, setAdding] = useState(false);
  const { data: paymentMethods, isLoading, isError } = usePaymentMethods();
  const activeMethods = (paymentMethods ?? []).filter((pm) => pm.isActive);

  return (
    <div className="payment-methods-page">
      <PageHeader
        title="Payment methods"
        description="Saved cards and billing accounts used for subscription payments."
        actions={
          <div className="payment-methods-page__actions">
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              Add payment method
            </Button>
            <Link to={ROUTES.BILLING}>
              <Button variant="ghost" size="sm">
                Back to billing
              </Button>
            </Link>
          </div>
        }
      />

      {isLoading ? <p className="payment-methods-page__hint">Loading payment methods…</p> : null}
      {isError ? (
        <p className="payment-methods-page__hint">Could not load payment methods.</p>
      ) : null}
      {!isLoading && !isError && activeMethods.length === 0 ? (
        <EmptyState
          title="No payment methods"
          description="Add a card to enable automatic renewals and one-click checkout."
        />
      ) : null}
      {!isLoading && !isError && activeMethods.length > 0 ? (
        <div className="payment-methods-page__grid">
          {activeMethods.map((method) => (
            <PaymentMethodCard key={method.paymentMethodId} method={method} />
          ))}
        </div>
      ) : null}

      <AddPaymentMethodModal open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

export default PaymentMethodsPage;
