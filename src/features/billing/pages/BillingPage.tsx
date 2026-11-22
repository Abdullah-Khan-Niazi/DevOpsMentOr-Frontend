import { Link } from 'react-router-dom';
import { Button, EmptyState, ErrorState, PageHeader } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { CurrentPlanCard } from '../components/CurrentPlanCard';
import { PaymentMethodCard } from '../components/PaymentMethodCard';
import { useCurrentSubscription, usePaymentMethods } from '../hooks/useBilling';
import { BillingSkeleton } from './BillingSkeleton';
import './billing.css';

/** SCR-F9-02: billing hub - current plan, saved payment methods, history link. */
export function BillingPage() {
  const {
    data: paymentMethods,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = usePaymentMethods();
  const subscription = useCurrentSubscription();
  const activeMethods = (paymentMethods ?? []).filter((pm) => pm.isActive);

  if (isLoading || subscription.isLoading) return <BillingSkeleton />;

  return (
    <div className="billing-page">
      <PageHeader
        title="Billing"
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
        {isError ? (
          <ErrorState
            title="Could not load payment methods"
            error={error}
            onRetry={() => void refetch()}
            retrying={isRefetching}
            compact
          />
        ) : null}
        {!isError && activeMethods.length === 0 ? (
          <EmptyState title="No payment methods saved yet" icon="card" className="py-6" />
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
