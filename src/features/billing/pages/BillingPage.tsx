import { Link } from 'react-router-dom';
import { Button, PageHeader } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { CurrentPlanCard } from '../components/CurrentPlanCard';
import { PaymentMethodCard } from '../components/PaymentMethodCard';
import { usePaymentMethods } from '../hooks/useBilling';
import './billing.css';

/** SCR-F9-02: billing hub — current plan, saved payment methods, history link. */
export function BillingPage() {
  const { data: paymentMethods, isLoading, isError } = usePaymentMethods();
  const activeMethods = (paymentMethods ?? []).filter((pm) => pm.isActive);

  return (
    <div className="billing-page">
      <PageHeader
        title="Billing"
        description="Manage your subscription, payment methods and receipts."
        actions={
          <Link to={ROUTES.BILLING_HISTORY}>
            <Button variant="secondary" size="sm">
              Order history
            </Button>
          </Link>
        }
      />

      <section className="billing-page__section">
        <CurrentPlanCard />
      </section>

      <section className="billing-page__section">
        <div className="billing-page__section-heading">
          <h2 className="billing-page__section-title">Payment methods</h2>
          <Link to={ROUTES.BILLING_PAYMENT_METHODS}>
            <Button variant="secondary" size="sm">
              Manage
            </Button>
          </Link>
        </div>
        {isLoading ? <p className="billing-page__hint">Loading payment methods…</p> : null}
        {isError ? <p className="billing-page__hint">Could not load payment methods.</p> : null}
        {!isLoading && !isError && activeMethods.length === 0 ? (
          <p className="billing-page__hint">No payment methods saved yet.</p>
        ) : null}
        <div className="billing-page__methods">
          {activeMethods.slice(0, 3).map((method) => (
            <PaymentMethodCard key={method.paymentMethodId} method={method} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default BillingPage;
