import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { Button, Modal, toast } from '@/shared/components';
import { StripeElementsWrapper } from '@/features/pricing';
import { useAddPaymentMethod } from '../hooks/useBilling';
import './add-payment-method.css';

function AddCardForm({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const add = useAddPaymentMethod();
  const stripe = useStripe();
  const elements = useElements();

  const submit = async (): Promise<void> => {
    if (busy || !stripe || !elements) {
      return;
    }
    setBusy(true);
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: { type: 'card' },
      });
      if (error) {
        toast.error(error.message ?? 'Could not add this card.');
        return;
      }
      await add.mutateAsync({
        stripePaymentMethodId: paymentMethod.id,
        methodType: 'credit_card',
      });
      toast.success('Payment method added.');
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add this card.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="add-payment-method__body">
      <div className="add-payment-method__card">
        <PaymentElement />
      </div>
      <Button
        size="md"
        isLoading={busy}
        disabled={!stripe || !elements}
        onClick={() => void submit()}
      >
        Add card
      </Button>
    </div>
  );
}

/** SCR-F9-03: BIL-07 add a payment method via Stripe PaymentElement. */
export function AddPaymentMethodModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Add payment method">
      <StripeElementsWrapper>
        {(stripe) =>
          stripe ? (
            <AddCardForm
              onDone={() => {
                onClose();
              }}
            />
          ) : (
            <p className="add-payment-method__hint">Card payments are not available right now.</p>
          )
        }
      </StripeElementsWrapper>
    </Modal>
  );
}

export default AddPaymentMethodModal;
