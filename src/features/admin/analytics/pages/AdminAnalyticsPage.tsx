import '../styles/analytics-admin.css';
import { useState, useMemo } from 'react';
import { Card, ErrorState, PageHeader, TabSwitcher } from '@/shared/components';
import {
  ActivityLineChart,
  ContributionHeatmap,
  FluidFunnelChart,
  HatchedPieChart,
  PixelatedBarChart,
  PixelatedMiniSparkline,
  RegionalMap,
  type ActivityTrendPoint,
  type PixelatedBarPoint,
} from '../components';
import { SystemTelemetryMonitor } from '../../components/SystemTelemetryMonitor';
import { useAdminDashboard } from '../../hooks';
import { AdminAnalyticsSkeleton } from './AdminAnalyticsSkeleton';
import {
  useActivityTrend,
  useAnalyticsOverview,
  useDetailedAnalytics,
} from '../hooks/useAnalytics';

const TREND_RANGES = [7, 14, 30, 90] as const;

export function AdminAnalyticsPage() {
  const [days, setDays] = useState<number>(14);

  // Poll dashboard data every 8s for live telemetry & hardware monitor
  const { data: dashboardData } = useAdminDashboard({ refetchInterval: 8000 });
  const overview = useAnalyticsOverview();
  const trend = useActivityTrend(days);
  const detailed = useDetailedAnalytics();

  // Multi-series trend chart data for ActivityLineChart ("Platform Activity Trajectory")
  const lineChartData: ActivityTrendPoint[] = useMemo(() => {
    if (!trend.data?.data) return [];
    return trend.data.data.map((item) => ({
      date: item.date.slice(5, 10), // MM-DD
      activeUsers: item.activeUsers,
      newSignups: item.newSignups,
      courseCompletions: item.courseCompletions,
    }));
  }, [trend.data]);

  // Time horizon for the Peak Traffic Density curve (Day, 7D, Month)
  const [trafficWindow, setTrafficWindow] = useState<'day' | '7d' | 'month'>('day');

  // Traffic density curve distribution in PKT (Day, 7D, Month)
  const trafficChartData: PixelatedBarPoint[] = useMemo(() => {
    if (!dashboardData?.kpis.peakActivity) return [];
    if (trafficWindow === '7d' && dashboardData.kpis.peakActivity.sevenDayDistribution) {
      return dashboardData.kpis.peakActivity.sevenDayDistribution.map((pt) => ({
        label: pt.label,
        value: pt.count,
      }));
    }
    if (trafficWindow === 'month' && dashboardData.kpis.peakActivity.thirtyDayDistribution) {
      return dashboardData.kpis.peakActivity.thirtyDayDistribution.map((pt) => ({
        label: pt.label,
        value: pt.count,
      }));
    }
    if (dashboardData.kpis.peakActivity.hourlyDistribution) {
      return dashboardData.kpis.peakActivity.hourlyDistribution.map((h) => ({
        label: h.label,
        value: h.count,
      }));
    }
    return [];
  }, [dashboardData, trafficWindow]);

  if (overview.isError || trend.isError) {
    return (
      <ErrorState
        title="Could not load platform analytics"
        error={overview.error ?? trend.error}
        onRetry={() => {
          void overview.refetch();
          void trend.refetch();
        }}
        retrying={overview.isRefetching || trend.isRefetching}
      />
    );
  }

  if (overview.isLoading || trend.isLoading) {
    return <AdminAnalyticsSkeleton />;
  }

  // Derive dynamic sparkline heights from the trend slice
  const getSliceLevels = (
    key: 'activeUsers' | 'newSignups' | 'courseCompletions' | 'pointsAwarded',
    fallback: number[] = [2, 3, 4, 3, 4],
  ): number[] => {
    if (!trend.data?.data || trend.data.data.length === 0) return fallback;
    const slice = trend.data.data.slice(-5).map((d) => Number(d[key] ?? 0));
    const max = Math.max(...slice, 1);
    const min = Math.min(...slice);
    if (max === min && max === 0) return fallback;
    return slice.map((v) => Math.min(5, Math.max(1, Math.round((v / max) * 5))));
  };

  const subsVal = overview.data?.activeSubscriptions ?? 0;
  const notifVal = overview.data?.notificationsSent7d ?? 0;
  const reportsVal = overview.data?.pendingReports ?? 0;
  const reviewsVal = overview.data?.newReviews7d ?? 0;

  const kpis = [
    {
      label: 'Active Users (7d)',
      value: overview.data?.activeUsers7d ?? 0,
      spark: getSliceLevels('activeUsers', [2, 3, 4, 3, 5]),
    },
    {
      label: 'New Signups (30d)',
      value: overview.data?.newSignups30d ?? 0,
      spark: getSliceLevels('newSignups', [1, 2, 3, 4, 5]),
    },
    {
      label: 'Certifications (30d)',
      value: overview.data?.courseCompletions30d ?? 0,
      spark: getSliceLevels('courseCompletions', [1, 2, 2, 3, 4]),
    },
    {
      label: 'Points Awarded (7d)',
      value: overview.data?.pointsAwarded7d ?? 0,
      spark: getSliceLevels('pointsAwarded', [2, 3, 5, 4, 5]),
    },
    {
      label: 'Active Subscriptions',
      value: subsVal,
      spark: [2, 3, 4, 4, Math.max(1, Math.min(5, Math.round(subsVal / 2) + 2))],
    },
    {
      label: 'System Notifications (7d)',
      value: notifVal,
      spark: [1, 2, 4, 3, Math.max(1, Math.min(5, Math.round(notifVal / 3) + 1))],
    },
    {
      label: 'Pending Moderation',
      value: reportsVal,
      spark: [1, 2, 1, Math.max(1, Math.min(3, reportsVal)), Math.max(0, Math.min(5, reportsVal))],
    },
    {
      label: 'Learner Reviews (7d)',
      value: reviewsVal,
      spark: [2, 3, 3, 4, Math.max(1, Math.min(5, Math.round(reviewsVal / 2) + 2))],
    },
  ];

  const sessionStats = detailed.data?.sessionStats ?? dashboardData?.kpis.sessionTelemetry;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <PageHeader title="Platform Analytics" />
        </div>

        {/* Global Live Sync Indicator & Range Switcher */}
        <div className="flex items-center gap-3">
          <TabSwitcher
            ariaLabel="Analytics time range"
            value={String(days) as `${(typeof TREND_RANGES)[number]}`}
            onChange={(val) => setDays(Number(val))}
            items={TREND_RANGES.map((val) => ({
              id: String(val) as `${(typeof TREND_RANGES)[number]}`,
              label: `${val}D`,
              icon: 'calendar' as const,
            }))}
          />
        </div>
      </div>

      {/* Top 8 Database-Driven KPI Tiles with Microinteractions & Context Tooltips */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {kpis.map((kpi) => (
          <AnalyticsKpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Live Concurrent Session Telemetry Strip */}
      {sessionStats && (
        <Card className="p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-signal animate-pulse rounded-full shrink-0 inline-block" />
            <span className="text-muted text-[0.625rem] uppercase">
              CONCURRENT LEARNERS ONLINE:
            </span>
            <span className="font-bold text-card-foreground text-sm">
              {sessionStats.currentlyActiveUsers} LEARNERS ACTIVE
            </span>
            <span className="text-muted text-[0.6875rem]">
              ({sessionStats.activeSessions} active browser sessions)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[0.6875rem]">
            <div>
              <span className="text-muted text-[0.625rem] uppercase mr-1.5">
                AVG STAY DURATION:
              </span>
              <span className="font-semibold text-card-foreground">
                {sessionStats.avgStayDurationMinutes}m
              </span>
            </div>
            <div>
              <span className="text-muted text-[0.625rem] uppercase mr-1.5">MIN STAY:</span>
              <span className="font-semibold text-card-foreground">
                {sessionStats.minStayDurationMinutes}m
              </span>
            </div>
            <div>
              <span className="text-muted text-[0.625rem] uppercase mr-1.5">MAX STAY:</span>
              <span className="font-semibold text-card-foreground">
                {sessionStats.maxStayDurationMinutes}m
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Live System Hardware, Database, Redis Cache, AI Mentor & Network Telemetry Monitor */}
      <SystemTelemetryMonitor
        host={dashboardData?.kpis.hostTelemetry}
        pwnbox={
          dashboardData?.kpis.pwnbox ??
          (detailed.data?.pwnbox
            ? {
                activePods: detailed.data.pwnbox.activeInstances,
                pendingPods: detailed.data.pwnbox.pendingInstances,
                stoppedPods: 0,
                errorPods: detailed.data.pwnbox.errorInstances,
                terminatedPods: detailed.data.pwnbox.terminatedInstances,
                totalActiveRamGb: detailed.data.pwnbox.totalRamGb,
                totalActiveCpuCores: detailed.data.pwnbox.totalCpuCores,
                consumedRamMb: detailed.data.pwnbox.consumedRamMb,
                consumedRamGb: detailed.data.pwnbox.consumedRamGb,
                consumedCpuCores: detailed.data.pwnbox.consumedCpuCores,
                consumedCpuPercent: detailed.data.pwnbox.consumedCpuPercent,
                avgDurationMinutes: detailed.data.pwnbox.avgDurationMinutes,
                maxSimultaneousPods: detailed.data.pwnbox.activeInstances,
              }
            : undefined)
        }
        cache={dashboardData?.kpis.cacheTelemetry}
        db={dashboardData?.kpis.dbTelemetry}
        ai={dashboardData?.kpis.aiTelemetry}
        request={dashboardData?.kpis.requestTelemetry}
        session={sessionStats}
        telemetry={dashboardData?.kpis.telemetry}
        peakHour={dashboardData?.kpis.peakActivity?.peakHour}
      />

      {/* Primary Visual Centerpiece: Platform Activity Trajectory Line Chart */}
      <Card className="p-5 flex flex-col gap-4">
        <ActivityLineChart
          data={lineChartData}
          height={280}
          days={days}
          ranges={TREND_RANGES}
          onDaysChange={setDays}
        />
      </Card>

      {/* Multi-Metric Contribution & Activity Heatmap (5 modes: Activity, Logins, Labs, Signups, Orgs) */}
      <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground">
              Platform Interaction & Growth Heatmap
            </h2>
          </div>
        </div>

        <div className="pt-2 overflow-x-auto">
          <ContributionHeatmap
            data={detailed.data?.heatmap ?? []}
            heatmaps={detailed.data?.heatmaps}
            weeksCount={12}
          />
        </div>
      </Card>

      {/* Conversion Funnel & Subscription Tiers (Hatched Pie Chart) */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch w-full min-w-0 max-w-full">
        {/* Left: Stepped Fluid Conversion Funnel */}
        <Card className="p-5 flex flex-col justify-between min-w-0 max-w-full overflow-hidden">
          <div>
            <div className="mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground">
                Learner Progression Funnel
              </h2>
            </div>

            <FluidFunnelChart stages={detailed.data?.funnel ?? []} />
          </div>
        </Card>

        {/* Right: Subscription Tiers Hatched Pie Chart */}
        <Card className="p-5 flex flex-col justify-between min-w-0 max-w-full overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground">
                  Subscription Tier Distribution
                </h2>
              </div>
            </div>

            <HatchedPieChart
              data={(detailed.data?.subscriptionBreakdown ?? []).map((sub) => ({
                label: `${sub.planType.charAt(0).toUpperCase() + sub.planType.slice(1)} Plan`,
                value: sub.count,
              }))}
              headlineValue={overview.data?.activeSubscriptions ?? 0}
            />
          </div>
        </Card>
      </div>

      {/* Real Vector Geographic Choropleth Map (180 Countries, Darker for more users) */}
      <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground">
              Regional Userbase Demographics Map
            </h2>
          </div>
        </div>

        <RegionalMap countries={detailed.data?.countries ?? []} />
      </Card>

      {/* Dual Deep Dive Columns: 24-Hour Traffic Curve (PKT) & Lab environment infrastructure telemetry */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch w-full min-w-0 max-w-full">
        {/* Peak Activity Traffic Density Curve in PKT (Day / 7D / Month) */}
        <Card className="p-5 flex flex-col justify-between min-w-0 max-w-full overflow-hidden">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-wider font-mono text-card-foreground whitespace-nowrap">
                {trafficWindow === 'day' && '24-Hour Traffic Density Curve (PKT)'}
                {trafficWindow === '7d' && '7-Day Traffic Trajectory (PKT)'}
                {trafficWindow === 'month' && '30-Day Traffic Trajectory (PKT)'}
              </h2>

              <div className="flex flex-wrap items-center gap-1.5">
                <TabSwitcher
                  ariaLabel="Traffic horizon"
                  value={trafficWindow}
                  onChange={setTrafficWindow}
                  items={[
                    { id: 'day', label: 'Day', icon: 'clock' },
                    { id: '7d', label: 'Last 7D', icon: 'calendar' },
                    { id: 'month', label: 'Month', icon: 'chart' },
                  ]}
                />

                {dashboardData?.kpis.peakActivity?.peakHour && (
                  <div className="flex items-center gap-1 text-muted text-[0.625rem] font-mono shrink-0 whitespace-nowrap">
                    <span className="text-[0.5625rem] uppercase">Peak</span>
                    <span className="font-bold text-card-foreground">
                      {dashboardData.kpis.peakActivity.peakHour}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-48 w-full min-w-0 max-w-full overflow-hidden">
              <PixelatedBarChart
                data={trafficChartData}
                height={180}
                segments={trafficWindow === 'month' ? 14 : 12}
                color="var(--color-accent-400)"
              />
            </div>
          </div>
        </Card>

        {/* Container Sandbox Compute & Pod Lifecycle Telemetry */}
        <Card className="p-5 flex flex-col justify-between min-w-0 max-w-full overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground">
                  Lab environment infrastructure telemetry
                </h2>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-xs font-mono">
              <div className="p-3 border border-border bg-surface/50">
                <span className="text-muted block text-[0.625rem] uppercase">Active Pods</span>
                <span className="text-xl font-bold text-card-foreground">
                  {detailed.data?.pwnbox?.activeInstances ?? 0}
                </span>
                <span className="text-[0.625rem] text-muted block mt-0.5">
                  {detailed.data?.pwnbox?.pendingInstances ?? 0} queued in buffer
                </span>
              </div>

              <div className="p-3 border border-border bg-surface/50">
                <span className="text-muted block text-[0.625rem] uppercase">
                  Compute Allocated
                </span>
                <span className="text-xl font-bold text-card-foreground">
                  {detailed.data?.pwnbox?.totalRamGb ?? 0} GB
                </span>
                <span className="text-[0.625rem] text-muted block mt-0.5">
                  {detailed.data?.pwnbox?.totalCpuCores ?? 0} CPU cores
                </span>
              </div>

              <div className="p-3 border border-border bg-surface/50">
                <span className="text-muted block text-[0.625rem] uppercase">
                  Avg Session Duration
                </span>
                <span className="text-xl font-bold text-card-foreground">
                  {detailed.data?.pwnbox?.avgDurationMinutes ?? 0}m
                </span>
              </div>

              <div className="p-3 border border-border bg-surface/50">
                <span className="text-muted block text-[0.625rem] uppercase">Lifecycle Buffer</span>
                <span className="text-xl font-bold text-card-foreground">
                  {detailed.data?.pwnbox?.terminatedInstances ?? 0}
                </span>
                <span className="text-[0.625rem] text-muted block mt-0.5">
                  Terminated, {detailed.data?.pwnbox?.errorInstances ?? 0} errors
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsKpiCard({
  kpi,
}: {
  kpi: {
    label: string;
    value: number;
    spark: number[];
  };
}) {
  return (
    <Card
      tabIndex={0}
      className="group relative flex flex-col justify-between p-3.5 transition-all duration-150 ease-out border border-border bg-surface hover:-translate-y-1 hover:border-ink hover:shadow-md hover:bg-surface-hover active:translate-y-0 active:scale-[0.99] focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none cursor-pointer select-none"
    >
      <div className="flex items-start justify-between">
        <span className="text-[0.625rem] font-mono uppercase tracking-wider text-muted group-hover:text-card-foreground transition-colors truncate">
          {kpi.label}
        </span>
        <PixelatedMiniSparkline levels={kpi.spark} />
      </div>

      <div className="mt-2">
        <span className="text-xl font-bold font-mono tracking-tight text-card-foreground group-hover:text-accent transition-colors">
          {kpi.value.toLocaleString()}
        </span>
      </div>
    </Card>
  );
}

export default AdminAnalyticsPage;
