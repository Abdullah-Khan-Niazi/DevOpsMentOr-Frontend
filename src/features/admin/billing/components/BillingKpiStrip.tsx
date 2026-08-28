import { Card } from '@/shared/components';
import type { AdminBillingOverview } from '../types';
import './billing-kpi-strip.css';

function formatMoney(usd: number): string {
  return `$${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/** SCR-F9-05: billing KPI strip (BIL-22). */
export function BillingKpiStrip({ overview }: { overview: AdminBillingOverview }) {
  const kpis = [
    { label: 'Active subscriptions', value: overview.activeSubscriptions.toLocaleString() },
    { label: 'MRR estimate', value: formatMoney(overview.monthlyRevenue) },
    { label: 'Active coupons', value: overview.activeCoupons.toLocaleString() },
    { label: 'Pending refunds', value: overview.openRefundFlags.toLocaleString() },
  ];

  return (
    <div className="billing-kpi-strip">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="billing-kpi-strip__tile">
          <span className="billing-kpi-strip__value">{kpi.value}</span>
          <span className="billing-kpi-strip__label">{kpi.label}</span>
        </Card>
      ))}
    </div>
  );
}

export default BillingKpiStrip;
