import '../styles/analytics-admin.css';
import { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { useActivityTrend, useAnalyticsOverview } from '../hooks/useAnalytics';

// SCR-F8-16: admin analytics dashboard — KPI strip of anonymized aggregates
// plus a daily activity trend chart. Responses never contain individual
// user data (backend invariant 11).

const TREND_RANGES = [7, 14, 30] as const;

interface KpiTileProps {
  label: string;
  value: number | null;
}

function KpiTile({ label, value }: KpiTileProps) {
  return (
    <div className="analytics-kpi">
      <span className="analytics-kpi__value">{value === null ? '—' : value.toLocaleString()}</span>
      <span className="analytics-kpi__label">{label}</span>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const [days, setDays] = useState<number>(14);
  const overview = useAnalyticsOverview();
  const trend = useActivityTrend(days);

  if (overview.isError || trend.isError) {
    return <ErrorState title="Could not load analytics" message="Please try again later." />;
  }
  if (overview.isLoading || trend.isLoading) {
    return <LoadingState />;
  }

  const kpis = [
    { label: 'Active users (7d)', value: overview.data?.activeUsers7d ?? null },
    { label: 'New signups (30d)', value: overview.data?.newSignups30d ?? null },
    { label: 'Course completions (30d)', value: overview.data?.courseCompletions30d ?? null },
    { label: 'Points awarded (7d)', value: overview.data?.pointsAwarded7d ?? null },
    { label: 'Active subscriptions', value: overview.data?.activeSubscriptions ?? null },
    { label: 'Notifications sent (7d)', value: overview.data?.notificationsSent7d ?? null },
    { label: 'Pending reports', value: overview.data?.pendingReports ?? null },
    { label: 'New reviews (7d)', value: overview.data?.newReviews7d ?? null },
  ];

  return (
    <div className="analytics-admin-page">
      <PageHeader
        title="Analytics"
        description="Anonymized platform health metrics — aggregates only, no individual data."
      />

      <div className="analytics-admin-page__kpis">
        {kpis.map((kpi) => (
          <KpiTile key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </div>

      <Card className="analytics-admin-page__chart-card">
        <div className="analytics-admin-page__chart-head">
          <h2 className="analytics-admin-page__chart-title">Daily activity trend</h2>
          <div className="analytics-admin-page__range">
            {TREND_RANGES.map((value) => (
              <button
                key={value}
                type="button"
                className="analytics-admin-page__range-btn"
                data-active={days === value}
                onClick={() => setDays(value)}
              >
                {value}d
              </button>
            ))}
          </div>
        </div>
        <div className="analytics-admin-page__chart">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={trend.data?.data ?? []}
              margin={{ top: 8, right: 16, bottom: 0, left: -8 }}
            >
              <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                stroke="var(--color-text-tertiary)"
                tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }}
              />
              <YAxis
                stroke="var(--color-text-tertiary)"
                tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-bg-overlay)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="activeUsers"
                name="Active users"
                stroke="var(--color-accent-500)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="newSignups"
                name="New signups"
                stroke="var(--color-info)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="courseCompletions"
                name="Completions"
                stroke="var(--color-warning)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="pointsAwarded"
                name="Points awarded"
                stroke="var(--color-success)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export default AdminAnalyticsPage;
