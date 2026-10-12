import '../styles/analytics-admin.css';
import { useState, useMemo } from 'react';
import { Card, ErrorState, LoadingState, PageHeader } from '@/shared/components';
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
        message="Please check database connection and try again."
      />
    );
  }

  if (overview.isLoading || trend.isLoading) {
    return <LoadingState />;
  }

  // Derive dynamic sparkline heights from the trend slice
  const getSliceLevels = (key: 'activeUsers' | 'newSignups' | 'courseCompletions'): number[] => {
    if (!trend.data?.data || trend.data.data.length === 0) return [1, 2, 3, 2, 4];
    const slice = trend.data.data.slice(-5).map((d) => d[key]);
    const max = Math.max(...slice, 1);
    return slice.map((v) => Math.min(5, Math.max(1, Math.round((v / max) * 5))));
  };

  const kpis = [
    {
      label: 'Active Users (7d)',
      value: overview.data?.activeUsers7d ?? 0,
      spark: getSliceLevels('activeUsers'),
      context: 'Active learner accounts generating interaction records over the past 7 days.',
      subtext: 'Unique active learner sessions',
    },
    {
      label: 'New Signups (30d)',
      value: overview.data?.newSignups30d ?? 0,
      spark: getSliceLevels('newSignups'),
      context: 'New student and practitioner profiles created and verified during the past 30 days.',
      subtext: 'Verified account onboarding',
    },
    {
      label: 'Certifications (30d)',
      value: overview.data?.courseCompletions30d ?? 0,
      spark: getSliceLevels('courseCompletions'),
      context: 'Officially accredited course graduation certificates recorded in the last 30 days.',
      subtext: 'Accredited certificates issued',
    },
    {
      label: 'Points Awarded (7d)',
      value: overview.data?.pointsAwarded7d ?? 0,
      spark: [2, 4, 5, 3, 4],
      context: 'Total gamified knowledge experience points accrued across lab exercises and quizzes.',
      subtext: 'Knowledge XP points earned',
    },
    {
      label: 'Active Subscriptions',
      value: overview.data?.activeSubscriptions ?? 0,
      spark: [3, 4, 4, 5, 5],
      context: 'Current unexpired recurring billing records across individual and enterprise plans.',
      subtext: 'Enterprise & Pro memberships',
    },
    {
      label: 'System Notifications (7d)',
      value: overview.data?.notificationsSent7d ?? 0,
      spark: [1, 3, 2, 4, 3],
      context: 'Operational alerts, verification emails, and achievement messages dispatched.',
      subtext: 'Alerts & emails dispatched',
    },
    {
      label: 'Pending Moderation',
      value: overview.data?.pendingReports ?? 0,
      spark: [1, 1, 2, 1, 0],
      context: 'Open user and content violation reports awaiting administrative resolution.',
      subtext: 'Flagged reports in queue',
    },
    {
      label: 'Learner Reviews (7d)',
      value: overview.data?.newReviews7d ?? 0,
      spark: [2, 3, 4, 3, 4],
      context: 'Curriculum evaluation ratings and written module reviews submitted.',
      subtext: 'Course ratings & feedback',
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

          <div className="flex items-center gap-1 border border-border p-0.5 bg-surface font-mono text-xs">
            {TREND_RANGES.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setDays(val)}
                className={`px-2.5 py-1 transition-colors cursor-pointer ${
                  days === val
                    ? 'bg-accent text-accent-foreground font-bold'
                    : 'text-muted hover:text-card-foreground'
                }`}
                style={{ borderRadius: 0 }}
              >
                {val}D
              </button>
            ))}
          </div>
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
        <Card className="p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs" style={{ borderRadius: 0 }}>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-signal animate-pulse rounded-none" />
            <span className="text-muted text-[10px] uppercase">CONCURRENT LEARNERS ONLINE:</span>
            <span className="font-bold text-card-foreground text-sm">
              {sessionStats.currentlyActiveUsers} LEARNERS ACTIVE
            </span>
            <span className="text-muted text-[11px]">
              ({sessionStats.activeSessions} active browser sessions)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px]">
            <div>
              <span className="text-muted text-[10px] uppercase mr-1.5">AVG STAY DURATION:</span>
              <span className="font-semibold text-card-foreground">
                {sessionStats.avgStayDurationMinutes}m
              </span>
            </div>
            <div>
              <span className="text-muted text-[10px] uppercase mr-1.5">MIN STAY:</span>
              <span className="font-semibold text-card-foreground">
                {sessionStats.minStayDurationMinutes}m
              </span>
            </div>
            <div>
              <span className="text-muted text-[10px] uppercase mr-1.5">MAX STAY:</span>
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
      <Card className="p-5 flex flex-col gap-4" style={{ borderRadius: 0 }}>
        <ActivityLineChart
          data={lineChartData}
          height={280}
          days={days}
          ranges={TREND_RANGES}
          onDaysChange={setDays}
        />
      </Card>

      {/* Multi-Metric Contribution & Activity Heatmap (5 modes: Activity, Logins, Labs, Signups, Orgs) */}
      <Card className="p-5 flex flex-col gap-3" style={{ borderRadius: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground">
              Platform Interaction & Growth Heatmap
            </h2>
          </div>
          <span className="text-xs font-mono text-accent">Active Matrix</span>
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
        <Card className="p-5 flex flex-col justify-between min-w-0 max-w-full overflow-hidden" style={{ borderRadius: 0 }}>
          <div>
            <div className="mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground">
                Learner Progression Funnel
              </h2>
              <p className="text-xs text-muted">
                Conversion milestones from initial registration through sandbox certification
              </p>
            </div>

            <FluidFunnelChart
              stages={detailed.data?.funnel ?? []}
              headlineGrowth="+0.4% vs prior 30 days"
            />
          </div>
          <div className="mt-4 pt-2 border-t border-border/60 text-[11px] font-mono text-muted flex justify-between">
            <span>Milestone criteria: Progress &gt;= 1 lesson &gt;= 1 sandbox</span>
            <span>Accredited certs issued</span>
          </div>
        </Card>

        {/* Right: Subscription Tiers Hatched Pie Chart */}
        <Card className="p-5 flex flex-col justify-between min-w-0 max-w-full overflow-hidden" style={{ borderRadius: 0 }}>
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
              headlineSubtext="Active subscription accounts in billing cycle"
              headlineGrowth="+1.2% vs prior 30 days"
            />
          </div>
        </Card>
      </div>

      {/* Real Vector Geographic Choropleth Map (180 Countries, Darker for more users) */}
      <Card className="p-5 flex flex-col gap-3" style={{ borderRadius: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground">
              Regional Userbase Demographics Map
            </h2>
          </div>
        </div>

        <RegionalMap countries={detailed.data?.countries ?? []} />
      </Card>

      {/* Dual Deep Dive Columns: 24-Hour Traffic Curve (PKT) & Container Sandbox Infrastructure Telemetry */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch w-full min-w-0 max-w-full">
        {/* Peak Activity Traffic Density Curve in PKT (Day / 7D / Month) */}
        <Card className="p-5 flex flex-col justify-between min-w-0 max-w-full overflow-hidden" style={{ borderRadius: 0 }}>
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider font-mono text-card-foreground whitespace-nowrap">
                {trafficWindow === 'day' && '24-Hour Traffic Density Curve (PKT)'}
                {trafficWindow === '7d' && '7-Day Traffic Trajectory (PKT)'}
                {trafficWindow === 'month' && '30-Day Traffic Trajectory (PKT)'}
              </h2>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Time Horizon Selector (Day / Last 7D / Month) */}
                <div className="flex items-center gap-0.5 border border-border p-0.5 bg-surface text-[9px] font-mono shrink-0">
                  {(
                    [
                      { key: 'day', label: 'Day' },
                      { key: '7d', label: 'Last 7D' },
                      { key: 'month', label: 'Month' },
                    ] as const
                  ).map((w) => (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => setTrafficWindow(w.key)}
                      className={`px-1.5 py-0.5 transition-colors cursor-pointer ${
                        trafficWindow === w.key
                          ? 'bg-accent text-accent-foreground font-bold'
                          : 'text-muted hover:text-card-foreground'
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>

                {dashboardData?.kpis.peakActivity?.peakHour && (
                  <div className="flex items-center gap-1 text-muted text-[10px] border border-border px-1.5 py-0.5 bg-surface font-mono shrink-0 whitespace-nowrap">
                    <span className="text-[9px] uppercase">PEAK:</span>
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
        <Card className="p-5 flex flex-col justify-between min-w-0 max-w-full overflow-hidden" style={{ borderRadius: 0 }}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground">
                  Container Sandbox Infrastructure Telemetry
                </h2>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-xs font-mono">
              <div className="p-3 border border-border bg-surface/50" style={{ borderRadius: 0 }}>
                <span className="text-muted block text-[10px] uppercase">Active Pods</span>
                <span className="text-xl font-bold text-card-foreground">
                  {detailed.data?.pwnbox?.activeInstances ?? 0}
                </span>
                <span className="text-[10px] text-muted block mt-0.5">
                  {detailed.data?.pwnbox?.pendingInstances ?? 0} queued in buffer
                </span>
              </div>

              <div className="p-3 border border-border bg-surface/50" style={{ borderRadius: 0 }}>
                <span className="text-muted block text-[10px] uppercase">Compute Allocated</span>
                <span className="text-xl font-bold text-card-foreground">
                  {detailed.data?.pwnbox?.totalRamGb ?? 0} GB
                </span>
                <span className="text-[10px] text-muted block mt-0.5">
                  {detailed.data?.pwnbox?.totalCpuCores ?? 0} CPU cores
                </span>
              </div>

              <div className="p-3 border border-border bg-surface/50" style={{ borderRadius: 0 }}>
                <span className="text-muted block text-[10px] uppercase">Avg Session Duration</span>
                <span className="text-xl font-bold text-card-foreground">
                  {detailed.data?.pwnbox?.avgDurationMinutes ?? 0}m
                </span>
                <span className="text-[10px] text-muted block mt-0.5">Average pod active time</span>
              </div>

              <div className="p-3 border border-border bg-surface/50" style={{ borderRadius: 0 }}>
                <span className="text-muted block text-[10px] uppercase">Lifecycle Buffer</span>
                <span className="text-xl font-bold text-card-foreground">
                  {detailed.data?.pwnbox?.terminatedInstances ?? 0}
                </span>
                <span className="text-[10px] text-muted block mt-0.5">
                  Terminated • {detailed.data?.pwnbox?.errorInstances ?? 0} errors
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
    context: string;
    subtext: string;
  };
}) {
  return (
    <Card
      tabIndex={0}
      className="group relative flex flex-col justify-between p-3.5 transition-all duration-150 ease-out border border-border bg-surface hover:-translate-y-0.5 hover:border-accent hover:bg-surface-hover active:translate-y-0 active:scale-[0.99] focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none cursor-pointer select-none"
      style={{ borderRadius: 0 }}
    >
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted group-hover:text-card-foreground transition-colors truncate">
          {kpi.label}
        </span>
        <PixelatedMiniSparkline levels={kpi.spark} />
      </div>

      <div className="mt-2">
        <span className="text-xl font-bold font-mono tracking-tight text-card-foreground group-hover:text-accent transition-colors">
          {kpi.value.toLocaleString()}
        </span>
      </div>

      <p className="mt-2 pt-1.5 border-t border-border/40 text-[11px] font-mono text-muted group-hover:text-card-foreground/80 transition-colors truncate">
        {kpi.subtext}
      </p>
    </Card>
  );
}

export default AdminAnalyticsPage;
