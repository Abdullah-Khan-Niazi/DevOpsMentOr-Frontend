import { useState } from 'react';
import { Button } from '@/shared/components';
import { useValidateCoupon } from '../hooks/useCheckout';
import type { CouponValidation } from '@/features/billing';
import type { BillingCycle, PlanTier } from '../types';
import './coupon-input.css';

interface CouponInputProps {
  planType: PlanTier['planType'];
  billingCycle: BillingCycle;
  onValidated: (validation: CouponValidation | null, code: string | null) => void;
}

/** SCR-F9-01: coupon code entry with inline validation (BIL-05). */
export function CouponInput({ planType, billingCycle, onValidated }: CouponInputProps) {
  const [code, setCode] = useState('');
  const validate = useValidateCoupon();

  const apply = (): void => {
    const trimmed = code.trim();
    if (!trimmed) {
      return;
    }
    validate.mutate(
      { code: trimmed, planType, billingCycle },
      {
        onSuccess: (result) => onValidated(result, trimmed),
        onError: () => {
          onValidated(null, null);
        },
      },
    );
  };

  return (
    <div className="coupon-input">
      <div className="coupon-input__row">
        <input
          className="coupon-input__field"
          value={code}
          placeholder="Promo code"
          aria-label="Promo code"
          onChange={(e) => {
            setCode(e.target.value);
            onValidated(null, null);
          }}
        />
        <Button variant="secondary" size="sm" onClick={apply} isLoading={validate.isPending}>
          Apply
        </Button>
      </div>
      {validate.isError ? (
        <p className="coupon-input__message coupon-input__message--error">
          {validate.error.message}
        </p>
      ) : null}
      {validate.isSuccess ? (
        <p className="coupon-input__message coupon-input__message--ok">
          {validate.data.discountType === 'percentage'
            ? `${validate.data.discountValue}% off applied`
            : `$${validate.data.discountAmount.toFixed(2)} off applied`}
        </p>
      ) : null}
    </div>
  );
}

export default CouponInput;
