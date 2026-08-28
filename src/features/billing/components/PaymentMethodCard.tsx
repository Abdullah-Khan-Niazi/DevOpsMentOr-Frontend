import { Button, Card, ConfirmDialog } from '@/shared/components';
import { useState } from 'react';
import type { PaymentMethodDto } from '../types';
import { useRemovePaymentMethod, useSetDefaultPaymentMethod } from '../hooks/useBilling';
import './payment-method.css';

function formatType(method: PaymentMethodDto): string {
  if (method.methodType === 'paypal') {
    return method.paypalEmail ?? 'PayPal';
  }
  if (method.methodType === 'enterprise_invoice') {
    return 'Enterprise invoice';
  }
  const brand = method.cardBrand
    ? `${method.cardBrand[0].toUpperCase()}${method.cardBrand.slice(1)}`
    : 'Card';
  return `${brand} •••• ${method.last4Digits ?? '····'}`;
}

/** SCR-F9-04: one saved payment method with default/remove actions. */
export function PaymentMethodCard({ method }: { method: PaymentMethodDto }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const setDefault = useSetDefaultPaymentMethod();
  const remove = useRemovePaymentMethod();

  return (
    <Card className="payment-method">
      <div className="payment-method__row">
        <div className="payment-method__info">
          <span className="payment-method__label">{formatType(method)}</span>
          {method.isDefault ? <span className="payment-method__tag">Default</span> : null}
        </div>
        <div className="payment-method__actions">
          {!method.isDefault ? (
            <Button
              variant="ghost"
              size="sm"
              isLoading={setDefault.isPending}
              onClick={() => setDefault.mutate(method.paymentMethodId)}
            >
              Set default
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
            Remove
          </Button>
        </div>
      </div>
      {setDefault.isError ? (
        <p className="payment-method__error">{setDefault.error.message}</p>
      ) : null}
      <ConfirmDialog
        open={confirmOpen}
        title="Remove payment method?"
        message="This payment method will be removed from your account."
        confirmLabel="Remove"
        isLoading={remove.isPending}
        onConfirm={() => {
          remove.mutate(method.paymentMethodId, {
            onSuccess: () => setConfirmOpen(false),
          });
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
}

export default PaymentMethodCard;
