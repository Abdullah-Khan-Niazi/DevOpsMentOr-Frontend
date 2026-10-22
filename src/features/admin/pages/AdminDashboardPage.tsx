import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, ErrorState, PageHeader, AdminDashboardSkeleton } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import {
  ActivityLineChart,
  FluidFunnelChart,
  HatchedPieChart,
  PixelatedBarChart,
  PixelatedMiniSparkline,
  type ActivityTrendPoint,
  type PixelatedBarPoint,
} from '../analytics/components';
import { SystemTelemetryMonitor } from '../components/SystemTelemetryMonitor';
import { useActivityTrend } from '../analytics/hooks/useAnalytics';
import { useAdminDashboard } from '../hooks';

function formatPktDate(value: string): string {
  try {
    const date = new Date(value);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      hour12: true,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${formatter.format(date)} PKT`;
  } catch {
    return value;
  }
}

type AuditFilterCategory = 'ALL' | 'USER' | 'ORG' | 'AUTH' | 'SETTING';

export function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useAdminDashboard({ refetchInterval: 8000 });
  const [trendDays, setTrendDays] = useState<number>(14);
  const trend = useActivityTrend(trendDays);

  // Single-column audit trail state
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState<AuditFilterCategory>('ALL');
  const [auditPage, setAuditPage] = useState(1);
  const AUDIT_PAGE_SIZE = 6;

  // Format activity trend for multi-series line chart with clear axes
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
    if (!data?.kpis.peakActivity) return [];
    if (trafficWindow === '7d' && data.kpis.peakActivity.sevenDayDistribution) {
      return data.kpis.peakActivity.sevenDayDistribution.map((pt) => ({
        label: pt.label,
        value: pt.count,
      }));
    }
    if (trafficWindow === 'month' && data.kpis.peakActivity.thirtyDayDistribution) {
      return data.kpis.peakActivity.thirtyDayDistribution.map((pt) => ({
        label: pt.label,
        value: pt.count,
      }));
    }
    if (data.kpis.peakActivity.hourlyDistribution) {
      return data.kpis.peakActivity.hourlyDistribution.map((h) => ({
        label: h.label,
        value: h.count,
      }));
    }
    return [];
  }, [data, trafficWindow]);

  // Filter audit logs
  const filteredAuditLogs = useMemo(() => {
    if (!data?.recentAuditLogs) return [];
    return data.recentAuditLogs.filter((log) => {
      const matchesSearch =
        auditSearch === '' ||
        (log.adminEmail && log.adminEmail.toLowerCase().includes(auditSearch.toLowerCase())) ||
        (log.adminFullName && log.adminFullName.toLowerCase().includes(auditSearch.toLowerCase())) ||
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        String(log.targetId ?? '').includes(auditSearch);

      if (!matchesSearch) return false;

      if (auditFilter === 'ALL') return true;
      if (auditFilter === 'USER') return log.action.includes('USER') || log.targetType === 'user';
      if (auditFilter === 'ORG') return log.action.includes('ORG') || log.targetType === 'organization';
      if (auditFilter === 'AUTH') return log.action.includes('LOGIN') || log.action.includes('AUTH');
      if (auditFilter === 'SETTING') return log.action.includes('SETTING');
      return true;
    });
  }, [data?.recentAuditLogs, auditSearch, auditFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (auditPage - 1) * AUDIT_PAGE_SIZE;
    return filteredAuditLogs.slice(start, start + AUDIT_PAGE_SIZE);
  }, [filteredAuditLogs, auditPage]);

  const totalAuditPages = Math.max(1, Math.ceil(filteredAuditLogs.length / AUDIT_PAGE_SIZE));

  const userbaseLevels = useMemo(() => {
    if (data?.kpis?.sparklines?.userbase) return data.kpis.sparklines.userbase;
    const series = data?.kpis?.peakActivity?.sevenDayDistribution?.map((p) => p.count) ?? [];
    if (series.length >= 5) {
      const slice = series.slice(-5);
      const min = Math.min(...slice);
      const max = Math.max(...slice);
      const range = max - min || 1;
      return slice.map((val) => Math.min(5, Math.max(1, Math.round(((val - min) / range) * 4) + 1)));
    }
    const u = data?.kpis?.totalUsers ?? data?.kpis?.totalIndividualLearners ?? 1;
    return [
      Math.max(1, Math.min(5, Math.round(u * 0.4) || 2)),
      Math.max(1, Math.min(5, Math.round(u * 0.6) || 3)),
      Math.max(1, Math.min(5, Math.round(u * 0.8) || 4)),
      Math.max(1, Math.min(5, Math.round(u * 0.7) || 3)),
      Math.max(1, Math.min(5, Math.round(u * 1.0) || 5)),
    ];
  }, [data]);

  const podsLevels = useMemo(() => {
    if (data?.kpis?.sparklines?.pods) return data.kpis.sparklines.pods;
    const active = data?.kpis?.pwnbox?.activePods ?? 0;
    const pending = data?.kpis?.pwnbox?.pendingPods ?? 0;
    const errors = data?.kpis?.pwnbox?.errorPods ?? 0;
    const stopped = data?.kpis?.pwnbox?.stoppedPods ?? 0;
    const total = active + pending + errors + stopped || 1;
    return [
      Math.max(1, Math.min(5, Math.round((stopped / total) * 5) + 1)),
      Math.max(1, Math.min(5, Math.round((errors / total) * 5) + 1)),
      Math.max(1, Math.min(5, Math.round((pending / total) * 5) + 1)),
      Math.max(1, Math.min(5, Math.round((active / total) * 5) + 1)),
      Math.max(1, Math.min(5, Math.round(active > 0 ? 5 : 1))),
    ];
  }, [data]);

  const computeLevels = useMemo(() => {
    if (data?.kpis?.sparklines?.compute) return data.kpis.sparklines.compute;
    const ram = data?.kpis?.pwnbox?.totalActiveRamGb ?? data?.kpis?.hostTelemetry?.memoryUsagePercent ?? 20;
    const cpu = data?.kpis?.pwnbox?.totalActiveCpuCores ?? data?.kpis?.hostTelemetry?.activeCpuLoadPercent ?? 15;
    const heap = data?.kpis?.hostTelemetry?.heapUsedMb ?? 60;
    return [
      Math.max(1, Math.min(5, Math.round(cpu / 20) + 1)),
      Math.max(1, Math.min(5, Math.round(ram / 20) + 1)),
      Math.max(1, Math.min(5, Math.round(heap / 40) + 1)),
      Math.max(1, Math.min(5, Math.round((cpu + ram) / 40) + 1)),
      Math.max(1, Math.min(5, Math.round(ram > 0 ? 4 : 1))),
    ];
  }, [data]);

  const learnersLevels = useMemo(() => {
    if (data?.kpis?.sparklines?.learners) return data.kpis.sparklines.learners;
    const hourly = data?.kpis?.peakActivity?.hourlyDistribution?.map((h) => h.count) ?? [];
    if (hourly.length >= 5) {
      const slice = hourly.slice(-5);
      const min = Math.min(...slice);
      const max = Math.max(...slice);
      const range = max - min || 1;
      return slice.map((val) => Math.min(5, Math.max(1, Math.round(((val - min) / range) * 4) + 1)));
    }
    const l = data?.kpis?.activeLearners ?? 1;
    return [
      Math.max(1, Math.min(5, Math.round(l * 0.5) || 2)),
      Math.max(1, Math.min(5, Math.round(l * 0.7) || 3)),
      Math.max(1, Math.min(5, Math.round(l * 0.6) || 2)),
      Math.max(1, Math.min(5, Math.round(l * 0.9) || 4)),
      Math.max(1, Math.min(5, Math.round(l * 1.0) || 5)),
    ];
  }, [data]);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title="Platform Dashboard"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`${ROUTES.ADMIN_ORGANIZATIONS}?create=true`}>
              <Button variant="primary" size="sm">
                + New Organization
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN_USERS}>
              <Button variant="secondary" size="sm">
                User Governance
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN_AUDIT_LOGS}>
              <Button variant="secondary" size="sm">
                Audit Logs
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN_ANALYTICS}>
              <Button variant="secondary" size="sm">
                Platform Analytics
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN_SETTINGS}>
              <Button variant="ghost" size="sm">
                System Settings
              </Button>
            </Link>
          </div>
        }
      />

      {isLoading ? <AdminDashboardSkeleton /> : null}

      {isError ? (
        <ErrorState
          message={error?.message ?? 'Unable to load the platform dashboard.'}
          onRetry={() => void refetch()}
        />
      ) : null}

      {data ? (
        <>
          {/* Executive Vitals Strip with DB-Driven NothingOS Sparklines & Context Tooltips */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch w-full min-w-0 max-w-full">
            {/* Total Registered Userbase */}
            <NothingKpiCard
              label="Registered Userbase"
              value={data.kpis.totalUsers ?? data.kpis.totalIndividualLearners}
              subtext={`${data.kpis.totalIndividualLearners} individual • ${data.kpis.totalOrgStudents ?? 0} students`}
              href={ROUTES.ADMIN_USERS}
              sparklineLevels={userbaseLevels}
              tooltipContext="Total learner and administrator accounts registered across all tenants."
            />

            {/* Live Active Pods */}
            <NothingKpiCard
              label="Live Sandbox Pods"
              value={data.kpis.pwnbox?.activePods ?? 0}
              subtext={`${data.kpis.pwnbox?.pendingPods ?? 0} queued in buffer • ${data.kpis.pwnbox?.errorPods ?? 0} errors`}
              href={ROUTES.ADMIN_ANALYTICS}
              sparklineLevels={podsLevels}
              accentValue="ACTIVE"
              tooltipContext="Live interactive browser sandboxes currently running in container orchestrator."
            />

            {/* Live Compute Allocation */}
            <NothingKpiCard
              label="Compute Allocated"
              value={`${data.kpis.pwnbox?.totalActiveRamGb ?? 0} GB`}
              subtext={`${data.kpis.pwnbox?.totalActiveCpuCores ?? 0} CPU cores provisioned`}
              href={ROUTES.ADMIN_ANALYTICS}
              sparklineLevels={computeLevels}
              tooltipContext="Dedicated memory and processor cores actively assigned to learner sandboxes."
            />

            {/* Active Learners Past 30 Days */}
            <NothingKpiCard
              label="Active Learners (30d)"
              value={data.kpis.activeLearners}
              subtext={`${data.kpis.totalOrganizations} tenant organizations`}
              href={ROUTES.ADMIN_USERS}
              sparklineLevels={learnersLevels}
              tooltipContext="Unique individual learners who logged in or completed lessons in the past 30 days."
            />
          </div>

          {/* Full Host Server, Database, Cache, AI Mentor & Traffic Telemetry Monitor */}
          <SystemTelemetryMonitor
            host={data.kpis.hostTelemetry}
            pwnbox={data.kpis.pwnbox}
            cache={data.kpis.cacheTelemetry}
            db={data.kpis.dbTelemetry}
            ai={data.kpis.aiTelemetry}
            request={data.kpis.requestTelemetry}
            session={data.kpis.sessionTelemetry}
            telemetry={data.kpis.telemetry}
          />

          {/* Visual Centerpiece: Progression Funnel & Userbase Segmentation (Images 2 & 3) */}
          <div className="grid gap-6 lg:grid-cols-2 items-stretch w-full min-w-0 max-w-full">
            {/* Left: Fluid Progression Funnel */}
            <Card className="flex flex-col justify-between p-5 min-w-0 max-w-full overflow-hidden">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground mb-4">
                  Learner Progression Funnel
                </h2>
                <FluidFunnelChart
                  stages={data.kpis.funnel ?? []}
                  headlineGrowth="+0.4% vs prior 30 days"
                />
              </div>
            </Card>

            {/* Right: Hatched User Segmentation Pie Chart */}
            <Card className="flex flex-col justify-between p-5 min-w-0 max-w-full overflow-hidden">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground mb-4">
                  User Role Distribution
                </h2>
                <HatchedPieChart
                  data={(data.kpis.userSegmentation ?? []).map((u) => ({
                    label: u.segment,
                    value: u.count,
                    percentage: u.percentage,
                  }))}
                  headlineValue={data.kpis.totalUsers ?? 0}
                  headlineSubtext="Total registered accounts across all tenant organizations"
                  headlineGrowth="+0.5% vs prior 30 days"
                />
              </div>
            </Card>
          </div>

          {/* Main Dual-Column Operational Grid: Line Chart on Left, Audit Stream on Right */}
          <div className="grid gap-6 lg:grid-cols-2 items-stretch w-full min-w-0 max-w-full">
            {/* Left Column: Activity Trends (Multi-Series Line Chart + 24h PKT curve) */}
            <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
              {/* Daily Activity Multi-Series Line Chart with Visible Labeled Axes */}
              <Card className="flex flex-col justify-between p-5 min-w-0 max-w-full overflow-hidden">
                <ActivityLineChart
                  data={lineChartData}
                  height={250}
                  days={trendDays}
                  onDaysChange={setTrendDays}
                />
              </Card>

              {/* Traffic Density Curve in PKT (Day / 7D / Month) */}
              <Card className="flex flex-col justify-between p-5 min-w-0 max-w-full overflow-hidden">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider font-mono text-card-foreground whitespace-nowrap">
                    {trafficWindow === 'day' && '24-Hour Traffic Curve (PKT)'}
                    {trafficWindow === '7d' && '7-Day Traffic Trajectory (PKT)'}
                    {trafficWindow === 'month' && '30-Day Traffic Trajectory (PKT)'}
                  </h2>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Time Horizon Selector (Day / Last 7D / Month) */}
                    <div className="tab-switcher">
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
                          className={`tab-switcher__tab ${
                            trafficWindow === w.key ? 'tab-switcher__tab--active' : ''
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>

                    {data.kpis.peakActivity?.peakHour && (
                      <div className="flex items-center gap-1 text-muted text-[10px] border border-border px-1.5 py-0.5 bg-surface font-mono shrink-0 whitespace-nowrap rounded-md">
                        <span className="text-[9px] uppercase">PEAK:</span>
                        <span className="font-bold text-card-foreground">
                          {data.kpis.peakActivity.peakHour}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-44 w-full min-w-0 max-w-full overflow-hidden">
                  <PixelatedBarChart
                    data={trafficChartData}
                    height={170}
                    segments={trafficWindow === 'month' ? 14 : 10}
                    color="var(--color-accent-400)"
                  />
                </div>
              </Card>
            </div>

            {/* Right Column: Single Column Administrative Audit Trail */}
            <Card className="flex flex-col justify-between p-5 h-full min-w-0 max-w-full overflow-hidden">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground">
                      Administrative Audit Stream
                    </h2>
                  </div>
                  <Link
                    to={ROUTES.ADMIN_AUDIT_LOGS}
                    className="text-xs font-mono text-muted hover:text-card-foreground transition-colors"
                  >
                    View all &rarr;
                  </Link>
                </div>

                {/* Audit Search & Action Category Filters */}
                <div className="flex flex-col gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Search by admin, action, or target ID..."
                    value={auditSearch}
                    onChange={(e) => {
                      setAuditSearch(e.target.value);
                      setAuditPage(1);
                    }}
                    className="w-full border border-border bg-surface px-3 py-1.5 text-xs font-mono text-card-foreground placeholder:text-muted focus:outline-none focus:border-accent rounded-md"
                  />

                  {/* Filter Tabs */}
                  <div className="tab-switcher">
                    {(['ALL', 'USER', 'ORG', 'AUTH', 'SETTING'] as AuditFilterCategory[]).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setAuditFilter(cat);
                            setAuditPage(1);
                          }}
                          className={`tab-switcher__tab ${
                            auditFilter === cat ? 'tab-switcher__tab--active' : ''
                          }`}
                        >
                          {cat}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Single Column Feed List */}
                <div className="mt-2 divide-y divide-border/60">
                  {paginatedLogs.length === 0 ? (
                    <div className="flex h-64 items-center justify-center border border-dashed border-border text-xs text-muted font-mono">
                      No matching audit records found.
                    </div>
                  ) : (
                    paginatedLogs.map((log) => (
                      <div
                        key={log.logId}
                        className="py-2.5 px-2 border-b border-border/40 last:border-b-0 hover:bg-surface/50 transition-colors font-mono space-y-1"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-bold text-accent uppercase tracking-wide truncate">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-muted whitespace-nowrap shrink-0">
                            {formatPktDate(log.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
                          <span className="text-card-foreground truncate">
                            {log.adminFullName ?? log.adminEmail}
                          </span>
                          <span className="text-[11px] text-muted/80 whitespace-nowrap shrink-0">
                            &rarr; {log.targetType ?? 'system'}{log.targetId ? ` #${log.targetId}` : ''}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Single Column Pagination Controls */}
              {totalAuditPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-border text-xs font-mono text-muted">
                  <span>
                    Page {auditPage} of {totalAuditPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={auditPage <= 1}
                      onClick={() => setAuditPage((p) => p - 1)}
                      className="px-2.5 py-1 border border-border rounded-md disabled:opacity-40 hover:border-card-foreground transition-colors cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={auditPage >= totalAuditPages}
                      onClick={() => setAuditPage((p) => p + 1)}
                      className="px-2.5 py-1 border border-border rounded-md disabled:opacity-40 hover:border-card-foreground transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function NothingKpiCard({
  label,
  value,
  subtext,
  href,
  sparklineLevels,
  accentValue,
  tooltipContext,
}: {
  label: string;
  value: string | number;
  subtext: string;
  href?: string;
  sparklineLevels?: number[];
  accentValue?: string;
  tooltipContext?: string;
}) {
  const cardContent = (
    <Card
      tabIndex={0}
      className="group relative flex flex-col justify-between p-4 transition-all duration-150 ease-out border border-border bg-surface hover:-translate-y-1 hover:border-ink hover:shadow-md hover:bg-surface-hover active:translate-y-0 active:scale-[0.99] focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none cursor-pointer h-full select-none"
    >
      <div className="flex items-start justify-between">
        <p
          className="text-[11px] font-mono uppercase tracking-wider text-muted group-hover:text-card-foreground transition-colors"
          title={tooltipContext}
        >
          {label}
        </p>
        {sparklineLevels && <PixelatedMiniSparkline levels={sparklineLevels} />}
      </div>

      <div className="my-2">
        <p className="text-2xl font-bold font-mono tracking-tight text-card-foreground group-hover:text-accent transition-colors">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {accentValue && (
            <span className="ml-2 text-xs font-mono text-accent">{accentValue}</span>
          )}
        </p>
      </div>

      <p className="text-xs text-muted group-hover:text-card-foreground/80 transition-colors truncate border-t border-border/40 pt-1.5">{subtext}</p>
    </Card>
  );

  if (href) {
    return (
      <Link to={href} className="block h-full outline-none focus-visible:ring-1 focus-visible:ring-accent">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export default AdminDashboardPage;
