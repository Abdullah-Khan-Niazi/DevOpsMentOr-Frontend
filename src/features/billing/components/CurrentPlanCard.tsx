import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, ConfirmDialog, LoadingState } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import {
  useCancelSubscription,
  useCurrentSubscription,
  usePlans,
  usePortalSession,
} from '../hooks/useBilling';
import './current-plan.css';

function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPrice(usd: number, cycle: 'monthly' | 'annual'): string {
  if (usd === 0) {
    return 'Free';
  }
  const price = `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return cycle === 'monthly' ? `${price} / month` : `${price} / year`;
}

/** SCR-F9-02: current plan card with renewal date, cancel dialog and portal. */
export function CurrentPlanCard() {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const { data: current, isLoading, isError } = useCurrentSubscription();
  const { data: catalog } = usePlans();
  const cancelMutation = useCancelSubscription();
  const portalMutation = usePortalSession();

  if (isLoading) {
    return (
      <Card>
        <LoadingState label="Loading your plan…" />
      </Card>
    );
  }

  const subscription = current?.subscription ?? null;
  const plan = catalog?.plans.find((p) => p.planType === current?.planType);
  const price = plan ? formatPrice(plan.monthlyPriceUsd, 'monthly') : null;
  const badge = subscription
    ? subscription.isActive
      ? `Plan active until ${formatDate(subscription.endDate)}`
      : subscription.cancelledAt
        ? `Cancels on ${formatDate(subscription.endDate)}`
        : 'Plan inactive'
    : 'No active plan';

  const openPortal = (): void => {
    portalMutation.mutate(undefined, {
      onSuccess: (session) => {
        window.open(session.url, '_blank', 'noopener,noreferrer');
      },
    });
  };

  return (
    <Card className="current-plan">
      <div className="current-plan__header">
        <div>
          <h3 className="current-plan__name">{plan?.displayName ?? 'Free'}</h3>
          <p className="current-plan__price">{price ?? 'Free'}</p>
        </div>
        <div className="current-plan__badge">{badge}</div>
      </div>

      <dl className="current-plan__facts">
        <div>
          <dt>Renews on</dt>
          <dd>{formatDate(subscription?.endDate)}</dd>
        </div>
        <div>
          <dt>Started</dt>
          <dd>{formatDate(subscription?.startDate)}</dd>
        </div>
        <div>
          <dt>Billing plan</dt>
          <dd>{subscription?.planName ?? 'Free tier'}</dd>
        </div>
      </dl>

      {isError ? <p className="current-plan__error">Could not load your plan.</p> : null}

      <div className="current-plan__actions">
        {subscription ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={openPortal}
              isLoading={portalMutation.isPending}
            >
              Manage in Stripe
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingCancel(true)}
              disabled={!subscription.isActive}
            >
              Cancel plan
            </Button>
          </>
        ) : (
          <>
            <Link to={ROUTES.PRICING}>
              <Button size="sm">Upgrade to Premium</Button>
            </Link>
            <Link to={ROUTES.PRICING}>
              <Button variant="ghost" size="sm">
                See plans
              </Button>
            </Link>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel your subscription?"
        message={`Cancel your subscription? You'll retain access until ${formatDate(subscription?.endDate)}.`}
        confirmLabel="Cancel plan"
        isLoading={cancelMutation.isPending}
        onCancel={() => setConfirmingCancel(false)}
        onConfirm={() => {
          if (subscription) {
            cancelMutation.mutate(subscription.subscriptionId, {
              onSettled: () => setConfirmingCancel(false),
            });
          }
        }}
      />

      {cancelMutation.isError ? (
        <p className="current-plan__error">{cancelMutation.error.message}</p>
      ) : null}
      {cancelMutation.isSuccess ? (
        <p className="current-plan__note">
          Cancellation requested. Access continues until the end of the period.
        </p>
      ) : null}
    </Card>
  );
}

export default CurrentPlanCard;
