import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, ConfirmDialog, ErrorState, Skeleton } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import {
  useCancelSubscription,
  useCurrentSubscription,
  usePlans,
  usePortalSession,
} from '../hooks/useBilling';
import './current-plan.css';
import { safeHttpUrl } from '@/shared/utils';

function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return '-';
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
  const {
    data: current,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCurrentSubscription();
  const { data: catalog } = usePlans();
  const cancelMutation = useCancelSubscription();
  const portalMutation = usePortalSession();

  if (isLoading) {
    return (
      <Card className="current-plan" aria-hidden="true">
        <Skeleton className="h-5 w-32 rounded-sm" />
        <Skeleton className="h-4 w-24 rounded-xs" />
        <Skeleton className="h-16 w-full rounded-sm" />
      </Card>
    );
  }

  const subscription = current?.subscription ?? null;
  const plan = catalog?.plans.find((p) => p.planType === current?.planType);
  const price = plan ? formatPrice(plan.monthlyPriceUsd, 'monthly') : null;
  const status = subscription
    ? subscription.isActive
      ? { text: `Plan active until ${formatDate(subscription.endDate)}`, tone: 'active' }
      : subscription.cancelledAt
        ? { text: `Cancels on ${formatDate(subscription.endDate)}`, tone: 'cancelling' }
        : { text: 'Plan inactive', tone: 'inactive' }
    : { text: 'No active plan', tone: 'inactive' };

  const openPortal = (): void => {
    portalMutation.mutate(undefined, {
      onSuccess: (session) => {
        const url = safeHttpUrl(session.url);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
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
        <div className="current-plan__status" data-tone={status.tone}>
          {status.text}
        </div>
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

      {isError ? (
        <ErrorState
          title="Could not load your plan"
          error={error}
          onRetry={() => void refetch()}
          retrying={isRefetching}
          compact
        />
      ) : null}

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
              isLoading={cancelMutation.isPending}
              disabled={!subscription.isActive || cancelMutation.isPending}
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
