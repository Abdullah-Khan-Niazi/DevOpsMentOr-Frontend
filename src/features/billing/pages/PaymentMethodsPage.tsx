import { Button, EmptyState, ErrorState, PageHeader } from '@/shared/components';
import { PaymentMethodsSkeleton } from './PaymentMethodsSkeleton';
import { usePaymentMethods } from '../hooks/useBilling';
import { ROUTES } from '@/shared/constants';
import { PaymentMethodCard } from '../components/PaymentMethodCard';
import { AddPaymentMethodModal } from '../components/AddPaymentMethodModal';
import { useState } from 'react';
import './payment-methods.css';

/** SCR-F9-03: all saved payment methods for the current user. */
export function PaymentMethodsPage() {
  const [adding, setAdding] = useState(false);
  const {
    data: paymentMethods,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = usePaymentMethods();
  const activeMethods = (paymentMethods ?? []).filter((pm) => pm.isActive);

  if (isLoading) return <PaymentMethodsSkeleton />;

  return (
    <div className="payment-methods-page">
      <PageHeader
        title="Payment Methods"
        backTo={ROUTES.BILLING}
        actions={
          <div className="payment-methods-page__actions">
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              Add payment method
            </Button>
          </div>
        }
      />

      {isError ? (
        <ErrorState
          title="Could not load payment methods"
          error={error}
          onRetry={() => void refetch()}
          retrying={isRefetching}
        />
      ) : null}
      {!isError && activeMethods.length === 0 ? (
        <EmptyState
          title="No payment methods"
          icon="card"
          action={
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              Add payment method
            </Button>
          }
        />
      ) : null}
      {!isError && activeMethods.length > 0 ? (
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
