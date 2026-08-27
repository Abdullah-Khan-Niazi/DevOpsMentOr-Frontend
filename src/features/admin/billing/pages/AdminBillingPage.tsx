import { useState } from 'react';
import {
  Button,
  ErrorState,
  LoadingState,
  PageHeader,
  Pagination,
  TabRow,
  toast,
} from '@/shared/components';
import { BillingKpiStrip } from '../components/BillingKpiStrip';
import {
  useAdminBillingOverview,
  useAdminCoupons,
  useAdminOrders,
  useAdminSubscriptions,
  useAdjustSubscription,
  useCreateCoupon,
  useRefundOrder,
  useToggleCoupon,
} from '../hooks/useAdminBilling';
import type { AdminBillingOverview, AdminSubscriptionRow, PlanType } from '../types';
import { Modal } from '@/shared/components/Modal';
import './admin-billing.css';

type AdminTab = 'subscriptions' | 'orders' | 'coupons';

const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free',
  premium: 'Premium',
  enterprise: 'Enterprise',
  student: 'Student',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

function formatMoney(value: number, currency: string): string {
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface AdjustDraft {
  planType: PlanType;
  autoRenew: boolean;
  isActive: boolean;
}

function CouponCreateForm({ onClose }: { onClose: () => void }) {
  const create = useCreateCoupon();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('1');
  const [expiresAt, setExpiresAt] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  });

  const submit = (): void => {
    const value = Number(discountValue);
    const max = Number(maxUses);
    const normalizedCode = code.trim().toUpperCase();
    if (!code.trim() || !Number.isFinite(value) || value <= 0) {
      toast.error('Code and a positive discount are required.');
      return;
    }
    if (discountType === 'percentage' && value > 100) {
      toast.error('Percentage discount must be 0-100.');
      return;
    }
    if (!expiresAt || new Date(`${expiresAt}T23:59:59.999Z`) <= new Date()) {
      toast.error('Expiry date must be in the future.');
      return;
    }
    create.mutate(
      {
        code: normalizedCode,
        discountType,
        discountValue: value,
        maxUses: Number.isFinite(max) && max >= 1 ? Math.floor(max) : undefined,
        expiresAt: new Date(`${expiresAt}T23:59:59.999Z`).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success(`Coupon ${normalizedCode} created.`);
          onClose();
        },
      },
    );
  };

  return (
    <div className="admin-billing__form">
      <label className="admin-billing__field">
        <span>Code</span>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SUMMER25" />
      </label>
      <label className="admin-billing__field">
        <span>Type</span>
        <select
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed_amount')}
        >
          <option value="percentage">Percentage</option>
          <option value="fixed_amount">Fixed amount</option>
        </select>
      </label>
      <label className="admin-billing__field">
        <span>{discountType === 'percentage' ? 'Percent off' : 'Amount off'}</span>
        <input
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          placeholder={discountType === 'percentage' ? '25' : '20.00'}
        />
      </label>
      <label className="admin-billing__field">
        <span>Max uses</span>
        <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="1" />
      </label>
      <label className="admin-billing__field">
        <span>Expires (UTC)</span>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
        />
      </label>
      <div className="admin-billing__form-actions">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} isLoading={create.isPending}>
          Create
        </Button>
      </div>
      {create.isError ? <p className="admin-billing__error">{create.error.message}</p> : null}
    </div>
  );
}

/** SCR-F9-05: platform billing administration (BIL-15..22). */
export function AdminBillingPage() {
  const [tab, setTab] = useState<AdminTab>('subscriptions');
  const [page, setPage] = useState(1);
  const [adjusting, setAdjusting] = useState<AdminSubscriptionRow | null>(null);
  const [draft, setDraft] = useState<AdjustDraft | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [refunding, setRefunding] = useState<{ orderId: number; orderNumber: string } | null>(null);

  const overview = useAdminBillingOverview();
  const subscriptions = useAdminSubscriptions({ page, limit: 20 });
  const orders = useAdminOrders({ page, limit: 20 });
  const coupons = useAdminCoupons({ page, limit: 20 });
  const adjust = useAdjustSubscription();
  const toggleCoupon = useToggleCoupon();
  const refund = useRefundOrder();

  const active = tab === 'subscriptions' ? subscriptions : tab === 'orders' ? orders : coupons;

  const openAdjust = (row: AdminSubscriptionRow): void => {
    setAdjusting(row);
    setDraft({ planType: row.planType, autoRenew: row.autoRenew, isActive: row.isActive });
  };

  const saveAdjust = (): void => {
    if (!adjusting || !draft) {
      return;
    }
    adjust.mutate(
      {
        subscriptionId: adjusting.subscriptionId,
        payload: {
          planType: draft.planType,
          autoRenew: draft.autoRenew,
          isActive: draft.isActive,
        },
      },
      {
        onSuccess: () => {
          toast.success('Subscription updated.');
          setAdjusting(null);
          setDraft(null);
        },
      },
    );
  };

  if (overview.isLoading || overview.isError) {
    return overview.isError ? (
      <ErrorState title="Could not load billing" message="Please try again later." />
    ) : (
      <LoadingState />
    );
  }

  return (
    <div className="admin-billing">
      <PageHeader
        title="Billing"
        description="Subscriptions, orders and coupons across the platform."
      />

      <BillingKpiStrip overview={overview.data as AdminBillingOverview} />

      <TabRow
        items={[
          { id: 'subscriptions', label: 'Subscriptions' },
          { id: 'orders', label: 'Orders' },
          { id: 'coupons', label: 'Coupons' },
        ]}
        activeId={tab}
        onChange={(id) => {
          setTab(id as AdminTab);
          setPage(1);
        }}
      />

      {active.isLoading ? <p className="admin-billing__hint">Loading…</p> : null}
      {active.isError ? <p className="admin-billing__hint">Could not load data.</p> : null}

      {tab === 'subscriptions' && !subscriptions.isLoading && !subscriptions.isError ? (
        <table className="admin-billing__table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Auto-renew</th>
              <th>Status</th>
              <th>Renews on</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(subscriptions.data?.items ?? []).map((row) => (
              <tr key={row.subscriptionId}>
                <td>{row.userEmail || row.userFullName || `User #${row.userId}`}</td>
                <td>{row.planName}</td>
                <td>{row.autoRenew ? 'On' : 'Off'}</td>
                <td>{row.isActive ? 'Active' : 'Inactive'}</td>
                <td>{formatDate(row.endDate)}</td>
                <td>
                  <Button variant="ghost" size="sm" onClick={() => openAdjust(row)}>
                    Adjust
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {tab === 'orders' && !orders.isLoading && !orders.isError ? (
        <table className="admin-billing__table">
          <thead>
            <tr>
              <th>Order</th>
              <th>User</th>
              <th>Total</th>
              <th>Status</th>
              <th>Paid</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(orders.data?.items ?? []).map((row) => (
              <tr key={row.orderId}>
                <td>{row.orderNumber}</td>
                <td>{row.userEmail || row.userFullName || `User #${row.userId}`}</td>
                <td>{formatMoney(row.finalAmount, row.currency)}</td>
                <td>{ORDER_STATUS_LABELS[row.status]}</td>
                <td>{formatDate(row.paidAt)}</td>
                <td>
                  {row.status === 'paid' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setRefunding({ orderId: row.orderId, orderNumber: row.orderNumber })
                      }
                    >
                      Flag refund
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {tab === 'coupons' && !coupons.isLoading && !coupons.isError ? (
        <div className="admin-billing__coupons">
          <div className="admin-billing__coupons-header">
            <p className="admin-billing__hint">Coupons apply at checkout (BIL-19..21).</p>
            <Button size="sm" onClick={() => setCouponOpen(true)}>
              New coupon
            </Button>
          </div>
          <table className="admin-billing__table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Redeemed</th>
                <th>Expires</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(coupons.data?.items ?? []).map((row) => (
                <tr key={row.couponId}>
                  <td>{row.code}</td>
                  <td>
                    {row.discountType === 'percentage'
                      ? `${row.discountValue}%`
                      : `$${row.discountValue.toFixed(2)}`}
                  </td>
                  <td>
                    {row.usedCount}
                    {row.maxUses > 0 ? ` / ${row.maxUses}` : ''}
                  </td>
                  <td>{formatDate(row.expiresAt)}</td>
                  <td>{row.isActive ? 'Yes' : 'No'}</td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={toggleCoupon.isPending}
                      onClick={() =>
                        toggleCoupon.mutate({ couponId: row.couponId, isActive: !row.isActive })
                      }
                    >
                      {row.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {active.data && active.data.total > active.data.limit ? (
        <Pagination
          page={active.data.page}
          pageSize={active.data.limit}
          total={active.data.total}
          totalPages={Math.ceil(active.data.total / active.data.limit)}
          onPageChange={setPage}
        />
      ) : null}

      {adjusting && draft ? (
        <Modal open title={`Adjust ${adjusting.planName}`} onClose={() => setAdjusting(null)}>
          <div className="admin-billing__form">
            <p className="admin-billing__hint">
              {adjusting.userEmail || adjusting.userFullName || `User #${adjusting.userId}`} —
              renews on {formatDate(adjusting.endDate)}
            </p>
            <label className="admin-billing__field">
              <span>Plan</span>
              <select
                value={draft.planType}
                onChange={(e) => setDraft({ ...draft, planType: e.target.value as PlanType })}
              >
                {Object.entries(PLAN_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-billing__field">
              <span>Auto-renew</span>
              <select
                value={draft.autoRenew ? '1' : '0'}
                onChange={(e) => setDraft({ ...draft, autoRenew: e.target.value === '1' })}
              >
                <option value="1">On</option>
                <option value="0">Off</option>
              </select>
            </label>
            <label className="admin-billing__field">
              <span>Status</span>
              <select
                value={draft.isActive ? '1' : '0'}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.value === '1' })}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </label>
            <div className="admin-billing__form-actions">
              <Button variant="ghost" size="sm" onClick={() => setAdjusting(null)}>
                Cancel
              </Button>
              <Button size="sm" isLoading={adjust.isPending} onClick={saveAdjust}>
                Save
              </Button>
            </div>
            {adjust.isError ? <p className="admin-billing__error">{adjust.error.message}</p> : null}
          </div>
        </Modal>
      ) : null}

      {couponOpen ? (
        <Modal open title="New coupon" onClose={() => setCouponOpen(false)}>
          <CouponCreateForm onClose={() => setCouponOpen(false)} />
        </Modal>
      ) : null}

      {refunding ? (
        <Modal
          open
          title={`Flag refund for ${refunding.orderNumber}?`}
          onClose={() => setRefunding(null)}
        >
          <div className="admin-billing__form">
            <p className="admin-billing__hint">The payment will be marked for refund processing.</p>
            <div className="admin-billing__form-actions">
              <Button variant="ghost" size="sm" onClick={() => setRefunding(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={refund.isPending}
                onClick={() => {
                  refund.mutate(refunding.orderId, {
                    onSuccess: () => {
                      toast.success('Refund flagged.');
                      setRefunding(null);
                    },
                  });
                }}
              >
                Flag refund
              </Button>
            </div>
            {refund.isError ? <p className="admin-billing__error">{refund.error.message}</p> : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export default AdminBillingPage;
