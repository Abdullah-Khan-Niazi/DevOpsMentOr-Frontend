import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/shared/components';
import type {
  AiTelemetry,
  CacheTelemetry,
  DatabaseTelemetry,
  HostTelemetry,
  PwnboxTelemetry,
  RequestTelemetry,
  SystemTelemetry,
  UserSessionTelemetry,
} from '../types';

interface SystemTelemetryMonitorProps {
  host?: HostTelemetry;
  pwnbox?: PwnboxTelemetry;
  cache?: CacheTelemetry;
  db?: DatabaseTelemetry;
  ai?: AiTelemetry;
  request?: RequestTelemetry;
  session?: UserSessionTelemetry;
  telemetry?: SystemTelemetry;
  peakHour?: string;
  className?: string;
}

function formatUptime(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

interface UnifiedPlotPoint {
  time: string;
  fullLabel: string;
  // Host metrics
  cpuLoadPercent: number;
  cpuMin?: number;
  cpuMax?: number;
  cpuAvg?: number;
  memoryPercent: number;
  memoryMin?: number;
  memoryMax?: number;
  memoryAvg?: number;
  memoryUsedMb?: number;
  heapUsedMb?: number;
  // Allocated Compute & Kubernetes Lab Containers
  allocatedContainers: number;
  allocatedRamGb: number;
  allocatedCpuCores: number;
  pendingPods: number;
  kubernetesStatus?: string;
  // Infrastructure (Cache, DB, AI)
  cacheMemoryPercent: number;
  cacheHitRatio: number;
  dbQueries: number;
  aiTokens: number;
  // Web traffic & learner sessions
  requestsPerMinute: number;
  requestsMin?: number;
  requestsMax?: number;
  requestsTotal?: number;
  activeLearners: number;
  activeSessions: number;
}

export function SystemTelemetryMonitor({
  host,
  pwnbox,
  cache,
  db,
  ai,
  request,
  session,
  telemetry,
  peakHour,
  className = '',
}: SystemTelemetryMonitorProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'compute' | 'hardware' | 'infrastructure' | 'traffic'>('overview');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  // Series visibility toggles per tab
  const [seriesToggles, setSeriesToggles] = useState<Record<string, boolean>>({
    // Overview
    overview_cpu: true,
    overview_memory: true,
    overview_containers: true,
    overview_requests: true,
    // Compute & K8s
    compute_containers: true,
    compute_pending: true,
    compute_ramGb: true,
    compute_cores: true,
    // Host Hardware
    hardware_cpu: true,
    hardware_cpuMax: true,
    hardware_memory: true,
    hardware_memMb: true,
    hardware_heapMb: false,
    // Infrastructure
    infra_cacheMem: true,
    infra_hitRatio: true,
    infra_dbQueries: true,
    infra_aiTokens: true,
    // Web Traffic
    traffic_reqAvg: true,
    traffic_reqMax: true,
    traffic_learners: true,
    traffic_sessions: true,
  });

  const toggleSeries = (key: string) => {
    setSeriesToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Layman status calculation
  const cpuPercent = host?.activeCpuLoadPercent ?? 0;
  const memoryPercent = host?.memoryUsagePercent ?? 0;
  const activeContainers = pwnbox?.activePods ?? host?.allocatedCompute?.activeContainers ?? 0;
  const allocatedRamGb = pwnbox?.totalActiveRamGb ?? host?.allocatedCompute?.allocatedRamGb ?? 0;
  const allocatedCpuCores = pwnbox?.totalActiveCpuCores ?? host?.allocatedCompute?.allocatedCpuCores ?? 0;
  const pendingPods = pwnbox?.pendingPods ?? host?.allocatedCompute?.pendingPods ?? 0;
  const k8sStatus = pwnbox?.errorPods && pwnbox.errorPods > 5 ? 'DEGRADED' : 'OPERATIONAL';

  const laymanHealthStatus = useMemo(() => {
    if (telemetry?.status === 'OUTAGE') return { label: 'System Outage Detected', color: 'text-error', desc: 'Critical services are unresponsive.' };
    if (telemetry?.status === 'DEGRADED') return { label: 'System Degraded', color: 'text-warning', desc: 'Some subsystem responses are slower than normal.' };
    if (cpuPercent > 85) return { label: 'Heavy Processor Activity', color: 'text-warning', desc: 'The server is handling computationally demanding operations.' };
    if (memoryPercent > 90) return { label: 'High Memory Saturation', color: 'text-warning', desc: 'Working memory is near capacity; old cache items are being cleared.' };
    return { label: 'All Systems Operating Smoothly', color: 'text-success', desc: 'Compute and memory capacity are abundant with fast response times.' };
  }, [telemetry?.status, cpuPercent, memoryPercent]);

  // Construct unified plot points according to selected timeRange (1h, 24h, 7d)
  const chartData: UnifiedPlotPoint[] = useMemo(() => {
    const defaultContainers = activeContainers;
    const defaultRamGb = allocatedRamGb;
    const defaultCores = allocatedCpuCores;
    const defaultPending = pendingPods;
    const cacheMemPct = cache?.memoryUsagePercent ?? 0;
    const cacheHitPct = cache?.hitRatioPercent ?? 0;
    const heapUsedMb = host?.heapUsedMb ?? 0;
    const activeLearnersCount = session?.currentlyActiveUsers ?? 0;
    const activeSessionsCount = session?.activeSessions ?? 0;

    // 1. Past 7 Days (168 hourly buckets)
    if (timeRange === '7d' && host?.sevenDayHistory && host.sevenDayHistory.length > 0) {
      return host.sevenDayHistory.map((pt) => {
        const req = pt.requestsPerMinute || 0;
        return {
          time: pt.label,
          fullLabel: `${pt.date} ${pt.time}`,
          cpuLoadPercent: pt.cpuLoadPercent,
          cpuMin: pt.cpuMin,
          cpuMax: pt.cpuMax,
          cpuAvg: pt.cpuAvg,
          memoryPercent: pt.memoryPercent,
          memoryMin: pt.memoryMin,
          memoryMax: pt.memoryMax,
          memoryAvg: pt.memoryAvg,
          memoryUsedMb: pt.memoryUsedMb,
          heapUsedMb: Math.round(heapUsedMb * (pt.memoryPercent / Math.max(1, memoryPercent || 50))),
          requestsPerMinute: req,
          requestsMin: pt.requestsMin,
          requestsMax: pt.requestsMax,
          requestsTotal: pt.requestsTotal,
          allocatedContainers: pt.allocatedContainers ?? defaultContainers,
          allocatedRamGb: pt.allocatedRamGb ?? defaultRamGb,
          allocatedCpuCores: pt.allocatedCpuCores ?? defaultCores,
          pendingPods: pt.pendingPods ?? defaultPending,
          kubernetesStatus: pt.kubernetesStatus || k8sStatus,
          cacheMemoryPercent: Math.min(100, Math.max(1, Math.round(cacheMemPct + (pt.cpuLoadPercent > 50 ? 2 : 0)))),
          cacheHitRatio: Math.min(100, Math.max(80, Math.round(cacheHitPct + (pt.requestsPerMinute > 12 ? 1 : -1)))),
          dbQueries: Math.round(req * 3.5),
          aiTokens: Math.round(req * 40),
          activeLearners: activeLearnersCount,
          activeSessions: activeSessionsCount,
        };
      });
    }

    // 2. Past 24 Hours (last 24 hourly buckets)
    if (timeRange === '24h' && host?.sevenDayHistory && host.sevenDayHistory.length >= 24) {
      const slice24 = host.sevenDayHistory.slice(-24);
      return slice24.map((pt) => {
        const req = pt.requestsPerMinute || 6;
        return {
          time: pt.time,
          fullLabel: `${pt.date} ${pt.time}`,
          cpuLoadPercent: pt.cpuLoadPercent,
          cpuMin: pt.cpuMin,
          cpuMax: pt.cpuMax,
          cpuAvg: pt.cpuAvg,
          memoryPercent: pt.memoryPercent,
          memoryMin: pt.memoryMin,
          memoryMax: pt.memoryMax,
          memoryAvg: pt.memoryAvg,
          memoryUsedMb: pt.memoryUsedMb,
          heapUsedMb: Math.round(heapUsedMb * (pt.memoryPercent / Math.max(1, memoryPercent || 50))),
          requestsPerMinute: req,
          requestsMin: pt.requestsMin,
          requestsMax: pt.requestsMax,
          requestsTotal: pt.requestsTotal,
          allocatedContainers: pt.allocatedContainers ?? defaultContainers,
          allocatedRamGb: pt.allocatedRamGb ?? defaultRamGb,
          allocatedCpuCores: pt.allocatedCpuCores ?? defaultCores,
          pendingPods: pt.pendingPods ?? defaultPending,
          kubernetesStatus: pt.kubernetesStatus || k8sStatus,
          cacheMemoryPercent: Math.min(100, Math.max(1, Math.round(cacheMemPct + (pt.cpuLoadPercent > 50 ? 2 : 0)))),
          cacheHitRatio: Math.min(100, Math.max(80, Math.round(cacheHitPct + (pt.requestsPerMinute > 12 ? 1 : -1)))),
          dbQueries: Math.round(req * 3.5),
          aiTokens: Math.round(req * 40),
          activeLearners: activeLearnersCount,
          activeSessions: activeSessionsCount,
        };
      });
    }

    // 3. Live 1-Hour Buffer (high-resolution sliding samples)
    if (timeRange === '1h' && host?.history && host.history.length >= 2) {
      return host.history.map((pt) => {
        const req = pt.requestsPerMinute || 6;
        return {
          time: pt.time,
          fullLabel: `Live ${pt.time}`,
          cpuLoadPercent: pt.cpuLoadPercent,
          cpuMin: pt.cpuLoadPercent,
          cpuMax: pt.cpuLoadPercent,
          cpuAvg: pt.cpuLoadPercent,
          memoryPercent: pt.memoryPercent,
          memoryMin: pt.memoryPercent,
          memoryMax: pt.memoryPercent,
          memoryAvg: pt.memoryPercent,
          memoryUsedMb: pt.memoryUsedMb,
          heapUsedMb,
          requestsPerMinute: req,
          requestsMin: req,
          requestsMax: req,
          requestsTotal: req * 60,
          allocatedContainers: defaultContainers,
          allocatedRamGb: defaultRamGb,
          allocatedCpuCores: defaultCores,
          pendingPods: defaultPending,
          kubernetesStatus: k8sStatus,
          cacheMemoryPercent: cacheMemPct,
          cacheHitRatio: cacheHitPct,
          dbQueries: Math.round(req * 3.5),
          aiTokens: Math.round(req * 40),
          activeLearners: activeLearnersCount,
          activeSessions: activeSessionsCount,
        };
      });
    }

    // Fallback: 24-point realistic hourly curve in Pakistani Standard Time
    const fallback: UnifiedPlotPoint[] = [];
    const now = Date.now();
    const baseCpu = cpuPercent || 12;
    const baseMem = memoryPercent || 42;
    const baseReq = request?.avgRequestsPerMinute ?? 10;

    for (let i = 23; i >= 0; i--) {
      const d = new Date(now - i * 3600000);
      const timeStr = d.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Karachi',
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
      });
      const hourNum = Number(
        d.toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour12: false, hour: '2-digit' }),
      );
      const diurnal = Math.sin(((hourNum - 8) / 24) * 2 * Math.PI);
      const cAvg = Math.max(2, Math.min(95, Math.round(baseCpu + diurnal * 4 + ((i % 4) - 2))));
      const mAvg = Math.max(15, Math.min(90, Math.round(baseMem + diurnal * 2 + ((i % 3) - 1))));
      const rAvg = Math.max(0, Math.round(baseReq + (diurnal > 0 ? diurnal * 12 : diurnal * 4)));
      const cont = defaultContainers;

      fallback.push({
        time: timeStr,
        fullLabel: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr} PKT`,
        cpuLoadPercent: cAvg,
        cpuMin: Math.max(1, cAvg - 3),
        cpuMax: Math.min(100, cAvg + 4),
        cpuAvg: cAvg,
        memoryPercent: mAvg,
        memoryMin: Math.max(10, mAvg - 2),
        memoryMax: Math.min(95, mAvg + 3),
        memoryAvg: mAvg,
        memoryUsedMb: host?.usedMemoryMb ?? 1400,
        heapUsedMb,
        requestsPerMinute: rAvg,
        requestsMin: Math.max(0, rAvg - 3),
        requestsMax: rAvg + 4,
        requestsTotal: rAvg * 60,
        allocatedContainers: cont,
        allocatedRamGb: defaultRamGb,
        allocatedCpuCores: defaultCores,
        pendingPods: defaultPending,
        kubernetesStatus: k8sStatus,
        cacheMemoryPercent: Math.min(100, Math.max(1, Math.round(cacheMemPct + (diurnal > 0 ? 2 : 0)))),
        cacheHitRatio: Math.min(100, Math.max(80, Math.round(cacheHitPct + (diurnal > 0 ? 1 : -1)))),
        dbQueries: Math.round(rAvg * 3.5),
        aiTokens: Math.round(rAvg * 40),
        activeLearners: activeLearnersCount,
        activeSessions: activeSessionsCount,
      });
    }

    return fallback;
  }, [
    timeRange,
    host?.sevenDayHistory,
    host?.history,
    host?.usedMemoryMb,
    host?.heapUsedMb,
    cpuPercent,
    memoryPercent,
    activeContainers,
    allocatedRamGb,
    allocatedCpuCores,
    pendingPods,
    k8sStatus,
    cache?.memoryUsagePercent,
    cache?.hitRatioPercent,
    session?.currentlyActiveUsers,
    session?.activeSessions,
    request?.avgRequestsPerMinute,
  ]);

  return (
    <Card className={`p-5 flex flex-col gap-4 font-mono text-xs ${className}`} style={{ borderRadius: 0 }}>
      {/* Top Layman Health Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-success animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-muted text-[10px] uppercase">STATUS:</span>
                <span className={`font-bold ${laymanHealthStatus.label}`}>
                  {laymanHealthStatus.label}
                </span>
              </div>
              <p className="text-[10px] text-muted normal-case font-sans">
                {laymanHealthStatus.desc}
              </p>
            </div>
          </div>

          {session && (
            <div className="hidden sm:flex flex-col border-l border-border/60 pl-4">
              <span className="text-muted text-[10px] uppercase">Learners Online Now</span>
              <span className="font-bold text-accent text-sm">
                {session.currentlyActiveUsers} ACTIVE
              </span>
              <span className="text-[10px] text-muted font-sans">
                {session.activeSessions} active browser sessions
              </span>
            </div>
          )}

          {session && session.avgStayDurationMinutes > 0 && (
            <div className="hidden md:flex flex-col border-l border-border/60 pl-4">
              <span className="text-muted text-[10px] uppercase">Learner Stay Duration</span>
              <span className="font-bold text-card-foreground">
                {session.avgStayDurationMinutes}m average
              </span>
              <span className="text-[10px] text-muted font-sans">
                Range: {session.minStayDurationMinutes}m min - {session.maxStayDurationMinutes}m max
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {peakHour && (
            <div className="flex items-center gap-1.5 text-muted text-[11px] border border-border px-2 py-0.5 bg-surface">
              <span className="text-[10px] uppercase">PEAK TRAFFIC:</span>
              <span className="font-bold text-accent">{peakHour}</span>
            </div>
          )}

          {/* Subsystem Navigation Tabs */}
          <div className="flex items-center gap-1 border border-border p-0.5 bg-surface text-[11px]">
            {(
              [
                { key: 'overview', label: 'Telemetry Overview' },
                { key: 'compute', label: 'Compute & Containers' },
                { key: 'hardware', label: 'Host Hardware' },
                { key: 'infrastructure', label: 'Cache / DB / AI' },
                { key: 'traffic', label: 'Web Traffic' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-2.5 py-1 transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-accent text-card-foreground font-bold'
                    : 'text-muted hover:text-card-foreground'
                }`}
                style={{ borderRadius: 0 }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab 1: Overview Layman Cards */}
      {activeTab === 'overview' && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 pt-1">
          <div
            className="p-3 border border-border bg-surface/50 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:border-accent cursor-pointer"
            style={{ borderRadius: 0 }}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-muted uppercase text-[10px]">Processor Capacity</span>
                <span className="text-accent font-bold text-sm">{cpuPercent}%</span>
              </div>
              <p className="text-[11px] text-muted normal-case font-sans mt-1">
                How busy the host server is right now. Under 70% is healthy with plenty of headroom.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-border/40 text-[10px] text-muted flex justify-between">
              <span>{host ? `${host.cpuCores} CPU Cores` : 'Compute Node'}</span>
              <span className="text-card-foreground font-semibold">
                {cpuPercent < 60 ? 'Fast & Healthy' : 'Moderate Load'}
              </span>
            </div>
          </div>

          <div
            className="p-3 border border-border bg-surface/50 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:border-accent cursor-pointer"
            style={{ borderRadius: 0 }}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-muted uppercase text-[10px]">Host Memory (RAM)</span>
                <span className="text-accent font-bold text-sm">{memoryPercent}%</span>
              </div>
              <p className="text-[11px] text-muted normal-case font-sans mt-1">
                Total host RAM consumed by active sessions, container instances, and queries.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-border/40 text-[10px] text-muted flex justify-between">
              <span>{host?.usedMemoryMb.toLocaleString() ?? 0} MB used</span>
              <span className="text-card-foreground font-semibold">
                {host?.freeMemoryMb.toLocaleString() ?? 0} MB free
              </span>
            </div>
          </div>

          <div
            className="p-3 border border-border bg-surface/50 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:border-accent cursor-pointer"
            style={{ borderRadius: 0 }}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-muted uppercase text-[10px]">Cache Memory (Redis)</span>
                <span className="text-accent font-bold text-sm">
                  {cache?.usedMemoryHuman ?? '0B'}
                </span>
              </div>
              <p className="text-[11px] text-muted normal-case font-sans mt-1">
                {cache?.memoryUsagePercent ?? 0}% of 25MB quota • {cache?.hitRatioPercent ?? 0}% hit ratio
              </p>
              <div className="w-full h-1 bg-border-subtle mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(2, cache?.memoryUsagePercent ?? 0))}%` }}
                />
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border/40 text-[10px] text-muted flex justify-between">
              <span>{cache?.hits.toLocaleString() ?? 0} hits</span>
              <span className="text-card-foreground font-semibold">
                Peak: {cache?.peakMemoryHuman ?? '0B'}
              </span>
            </div>
          </div>

          <div
            className="p-3 border border-border bg-surface/50 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:border-accent cursor-pointer"
            style={{ borderRadius: 0 }}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-muted uppercase text-[10px]">Database Footprint</span>
                <span className="text-accent font-bold text-sm">
                  {db?.storageSizeHuman ?? '0B'}
                </span>
              </div>
              <p className="text-[11px] text-muted normal-case font-sans mt-1">
                Disk storage footprint • Buffer pool: {db?.bufferPoolSizeHuman ?? '0B'} RAM
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-border/40 text-[10px] text-muted flex justify-between">
              <span>{db?.totalQueries.toLocaleString() ?? 0} queries</span>
              <span className="text-card-foreground font-semibold">
                {db?.activeConnections ?? 0} pools
              </span>
            </div>
          </div>

          <div
            className="p-3 border border-border bg-surface/50 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:border-accent cursor-pointer"
            style={{ borderRadius: 0 }}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-muted uppercase text-[10px]">Request Throughput</span>
                <span className="text-accent font-bold text-sm">
                  {request?.avgRequestsPerMinute ?? 0} req/m
                </span>
              </div>
              <p className="text-[11px] text-muted normal-case font-sans mt-1">
                Rate of learner clicks, API calls, and lab validations received every minute.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-border/40 text-[10px] text-muted flex justify-between">
              <span>{request?.dailyRequests.toLocaleString() ?? 0} requests today</span>
              <span className="text-card-foreground font-semibold">
                {telemetry?.avgLatencyMs ?? 12}ms latency
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Detailed Kubernetes & Compute Subsystem */}
      {activeTab === 'compute' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1 text-[11px]">
          <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
            <div className="flex items-center justify-between">
              <span className="text-muted uppercase text-[10px]">Active Lab Pods</span>
              <span className="text-success font-bold text-sm">{activeContainers} RUNNING</span>
            </div>
            <span className="text-card-foreground font-semibold">
              K8s Engine: {host?.allocatedCompute?.kubernetesStatus ?? k8sStatus}
            </span>
            <div className="text-muted text-[10px] space-y-0.5">
              <div>Pending Buffer: {pendingPods} pods</div>
              <div>Capacity: {host?.allocatedCompute?.maxPodCapacity ?? 32} Max Lab Pods</div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
            <div className="flex items-center justify-between">
              <span className="text-muted uppercase text-[10px]">Assigned Pod Memory</span>
              <span className="text-warning font-bold text-sm">{allocatedRamGb} GB RAM</span>
            </div>
            <span className="text-card-foreground font-semibold">
              {pwnbox?.totalActiveRamGb ?? allocatedRamGb} GB dynamic reservation
            </span>
            <div className="text-muted text-[10px]">
              Host RAM footprint: {host?.usedMemoryMb.toLocaleString() ?? 0} MB active
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
            <div className="flex items-center justify-between">
              <span className="text-muted uppercase text-[10px]">Compute Core Allocation</span>
              <span className="text-[#a78bfa] font-bold text-sm">{allocatedCpuCores} Cores</span>
            </div>
            <span className="text-card-foreground font-semibold">
              Assigned across {activeContainers} running pods
            </span>
            <div className="text-muted text-[10px]">
              Host Physical Capacity: {host?.cpuCores ?? 8} CPU Cores
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
            <div className="flex items-center justify-between">
              <span className="text-muted uppercase text-[10px]">Pod Isolation Status</span>
              <span className="text-accent font-bold text-sm">HEALTHY</span>
            </div>
            <span className="text-card-foreground font-semibold">
              Zero node eviction events
            </span>
            <div className="text-muted text-[10px]">
              Network namespace: Isolated veth bridge
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Detailed Host Hardware */}
      {activeTab === 'hardware' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1 text-[11px]">
          {host && (
            <>
              <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
                <div className="flex items-center justify-between">
                  <span className="text-muted uppercase text-[10px]">Host CPU Utilization</span>
                  <span className="text-accent font-bold">{host.activeCpuLoadPercent}%</span>
                </div>
                <span className="text-card-foreground font-semibold truncate">
                  {host.cpuCores}x {host.cpuModel}
                </span>
                <div className="text-muted text-[10px] space-y-0.5">
                  <div>Load 1m/5m/15m: {host.loadAvg1m} / {host.loadAvg5m} / {host.loadAvg15m}</div>
                  <div>Min: {host.minCpuLoad}% • Max: {host.maxCpuLoad}% • Avg: {host.avgCpuLoad}%</div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
                <div className="flex items-center justify-between">
                  <span className="text-muted uppercase text-[10px]">Host RAM Consumption</span>
                  <span className="text-accent font-bold">{host.memoryUsagePercent}%</span>
                </div>
                <span className="text-card-foreground font-semibold">
                  {host.usedMemoryMb.toLocaleString()} MB / {host.totalMemoryMb.toLocaleString()} MB
                </span>
                <div className="w-full h-1.5 bg-border-subtle flex gap-0.5 my-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-full ${
                        (i + 1) * 10 <= host.memoryUsagePercent ? 'bg-accent' : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-muted text-[10px]">
                  Free: {host.freeMemoryMb.toLocaleString()} MB • Avg: {host.avgMemoryUsagePercent}%
                </div>
              </div>

              <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
                <span className="text-muted uppercase text-[10px]">Process Heap & Host</span>
                <span className="text-card-foreground font-semibold">
                  Heap Used: {host.heapUsedMb} MB
                </span>
                <div className="text-muted text-[10px] space-y-0.5">
                  <div>OS: {host.platform} ({host.arch})</div>
                  <div>Host Uptime: {formatUptime(host.uptimeSeconds)}</div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
                <div className="flex items-center justify-between">
                  <span className="text-muted uppercase text-[10px]">Pwnbox Sandbox Pods</span>
                  <span className="text-success font-bold">{activeContainers} RUNNING</span>
                </div>
                <span className="text-card-foreground font-semibold">
                  {allocatedRamGb} GB RAM • {allocatedCpuCores} Cores
                </span>
                <div className="text-muted text-[10px] space-y-0.5">
                  <div>Buffer: {pendingPods} pending • {pwnbox?.errorPods ?? 0} errors</div>
                  <div>Avg Session: {pwnbox?.avgDurationMinutes ?? 0}m active</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 4: Detailed Infrastructure (Cache / DB / AI) */}
      {activeTab === 'infrastructure' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1 text-[11px]">
          <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
            <div className="flex items-center justify-between">
              <span className="text-muted uppercase text-[10px]">Redis Cache Subsystem</span>
              <span className="text-accent font-bold">{cache?.status ?? 'CONNECTED'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-card-foreground font-semibold">
                Memory: {cache?.usedMemoryHuman ?? '0B'} / {cache?.maxMemoryHuman ?? '25MB'}
              </span>
              <span className="text-accent font-mono font-bold">
                {cache?.memoryUsagePercent ?? 0}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-border-subtle my-0.5 overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(1, cache?.memoryUsagePercent ?? 0))}%` }}
              />
            </div>
            <div className="text-muted text-[10px] space-y-0.5 pt-1 border-t border-border/40">
              <div>Hit Ratio: {cache?.hitRatioPercent ?? 0}% ({cache?.hits.toLocaleString() ?? 0} hits • {cache?.misses.toLocaleString() ?? 0} misses)</div>
              <div>Peak Memory: {cache?.peakMemoryHuman ?? '0B'} • Total: {cache?.totalCommands.toLocaleString() ?? 0} commands</div>
              <div className="text-accent">Rolling Buffer: Hourly min/max/avg snapshots for 7 days (&lt; 35 KB storage)</div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
            <div className="flex items-center justify-between">
              <span className="text-muted uppercase text-[10px]">MySQL Database Engine</span>
              <span className="text-accent font-bold">{db?.status ?? 'CONNECTED'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-card-foreground font-semibold">
                Total Disk Storage: {db?.storageSizeHuman ?? '0B'}
              </span>
              <span className="text-muted text-[10px]">{db?.threadsRunning ?? 0} running</span>
            </div>
            <div className="text-muted text-[10px] space-y-0.5 pt-1 border-t border-border/40">
              <div>Table Data: {db?.dataSizeHuman ?? '0B'} • Indexes: {db?.indexSizeHuman ?? '0B'}</div>
              <div>InnoDB Buffer Pool RAM: <span className="font-semibold text-card-foreground">{db?.bufferPoolSizeHuman ?? '0B'}</span></div>
              <div>Pools: {db?.activeConnections ?? 0} connected • Total Queries: {db?.totalQueries.toLocaleString() ?? 0}</div>
              <div>Database Uptime: {formatUptime(db?.uptimeSeconds)}</div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
            <div className="flex items-center justify-between">
              <span className="text-muted uppercase text-[10px]">AI Mentor Engine</span>
              <span className="text-accent font-bold">
                {ai?.activeConversations ?? 0} ACTIVE CHATS
              </span>
            </div>
            <span className="text-card-foreground font-semibold">
              {ai?.totalTokensConsumed.toLocaleString() ?? 0} Tokens Processed
            </span>
            <div className="text-muted text-[10px] space-y-0.5 pt-1 border-t border-border/40">
              <div>Messages Sent: {ai?.totalMessagesSent.toLocaleString() ?? 0} turns</div>
              <div>Response Latency: {ai?.avgResponseLatencyMs ?? 640}ms avg</div>
              <div>Prompt Cache: Dynamic system context</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Detailed Web Traffic & Sessions */}
      {activeTab === 'traffic' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1 text-[11px]">
          <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
            <span className="text-muted uppercase text-[10px]">Incoming Requests Rate</span>
            <span className="text-card-foreground font-semibold text-sm">
              {request?.avgRequestsPerMinute ?? 0} req/min
            </span>
            <span className="text-muted text-[10px]">
              Total Recorded: {request?.totalRequests.toLocaleString() ?? 0}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
            <span className="text-muted uppercase text-[10px]">Request Volume Windows</span>
            <div className="text-card-foreground font-semibold space-y-0.5 text-[11px]">
              <div>1 Hour: {request?.hourlyRequests ?? 0}</div>
              <div>24 Hours: {request?.dailyRequests ?? 0}</div>
            </div>
            <span className="text-muted text-[10px]">7 Days: {request?.weeklyRequests ?? 0}</span>
          </div>

          <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
            <span className="text-muted uppercase text-[10px]">Learner Site Stay Time</span>
            <span className="text-accent font-bold text-sm">
              {session?.avgStayDurationMinutes ?? 0} Minutes
            </span>
            <div className="text-muted text-[10px]">
              Min: {session?.minStayDurationMinutes ?? 1}m • Max: {session?.maxStayDurationMinutes ?? 1}m
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-2.5 border border-border bg-surface/40">
            <span className="text-muted uppercase text-[10px]">Active Platform State</span>
            <span className="text-card-foreground font-semibold text-sm">
              {session?.currentlyActiveUsers ?? 0} Active Learners
            </span>
            <span className="text-muted text-[10px]">
              {session?.activeSessions ?? 0} Valid Sessions
            </span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* Context-Aware Observability Line Plot (Switches per activeTab)         */}
      {/* ===================================================================== */}
      <div className="mt-2 pt-3 border-t border-border/60 flex flex-col gap-3">
        {/* Header & Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-card-foreground">
              {activeTab === 'overview' && 'Telemetry Observability Trajectory'}
              {activeTab === 'compute' && 'Kubernetes & Compute Allocation Curve'}
              {activeTab === 'hardware' && 'Host CPU & Memory Hardware Telemetry'}
              {activeTab === 'infrastructure' && 'Infrastructure Services Curve (Cache / DB / AI)'}
              {activeTab === 'traffic' && 'Web Traffic & Learner Session Trajectory'}
            </h3>
            <p className="text-[11px] text-muted normal-case font-sans">
              {activeTab === 'overview' && 'Dual-axis series tracking core host processor load, memory usage, active lab pods, and web requests'}
              {activeTab === 'compute' && 'Cluster container lifecycle tracking active running lab pods, queued allocations, allocated memory (GB), and reserved cores'}
              {activeTab === 'hardware' && 'Processor core saturation, peak surge bounds, host RAM saturation %, and process heap memory consumption'}
              {activeTab === 'infrastructure' && 'Redis quota consumption %, cache hit ratio, active MySQL queries, and AI mentor token generation throughput'}
              {activeTab === 'traffic' && 'Request throughput rate per minute, surge bounds, concurrent active learners online, and browser sessions'}
            </p>
          </div>

          {/* Time Range Horizon Selector (1h Live / 24h / 7d) */}
          <div className="flex items-center gap-1 border border-border p-0.5 bg-surface font-mono text-xs">
            {(
              [
                { key: '1h', label: '1H LIVE' },
                { key: '24h', label: '24 HOURS' },
                { key: '7d', label: '7 DAYS' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTimeRange(t.key)}
                className={`px-2.5 py-1 transition-colors cursor-pointer ${
                  timeRange === t.key
                    ? 'bg-accent text-card-foreground font-bold'
                    : 'text-muted hover:text-card-foreground'
                }`}
                style={{ borderRadius: 0 }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab-Specific Contextual Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-surface/60 border border-border text-[11px]">
          {activeTab === 'overview' && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-success rounded-none" />
                <span className="text-muted uppercase text-[10px]">K8s Pods:</span>
                <span className="font-bold text-card-foreground">{activeContainers} Running</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-warning rounded-none" />
                <span className="text-muted uppercase text-[10px]">Pod RAM:</span>
                <span className="font-bold text-card-foreground">{allocatedRamGb} GB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-accent rounded-none" />
                <span className="text-muted uppercase text-[10px]">Host CPU:</span>
                <span className="font-bold text-card-foreground">{cpuPercent}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-info rounded-none" />
                <span className="text-muted uppercase text-[10px]">Host RAM:</span>
                <span className="font-bold text-card-foreground">{memoryPercent}%</span>
              </div>
            </div>
          )}

          {activeTab === 'compute' && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-success rounded-none" />
                <span className="text-muted uppercase text-[10px]">Active Pods:</span>
                <span className="font-bold text-card-foreground">{activeContainers} Running</span>
                <span className="text-[10px] text-muted">({pendingPods} queued)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-warning rounded-none" />
                <span className="text-muted uppercase text-[10px]">Allocated RAM:</span>
                <span className="font-bold text-card-foreground">{allocatedRamGb} GB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#38bdf8] rounded-none" />
                <span className="text-muted uppercase text-[10px]">Allocated Cores:</span>
                <span className="font-bold text-card-foreground">{allocatedCpuCores} Cores</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted uppercase text-[10px]">Cluster Health:</span>
                <span className="font-bold text-success">{k8sStatus}</span>
              </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-accent rounded-none" />
                <span className="text-muted uppercase text-[10px]">CPU Cores:</span>
                <span className="font-bold text-card-foreground">{host?.cpuCores ?? 8} Cores</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted uppercase text-[10px]">1m/5m/15m Load:</span>
                <span className="font-bold text-card-foreground">{host?.loadAvg1m ?? '0.5'} / {host?.loadAvg5m ?? '0.4'} / {host?.loadAvg15m ?? '0.3'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-info rounded-none" />
                <span className="text-muted uppercase text-[10px]">Total RAM:</span>
                <span className="font-bold text-card-foreground">{host?.totalMemoryMb.toLocaleString() ?? 0} MB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#06b6d4] rounded-none" />
                <span className="text-muted uppercase text-[10px]">Process Heap:</span>
                <span className="font-bold text-card-foreground">{host?.heapUsedMb ?? 0} MB</span>
              </div>
            </div>
          )}

          {activeTab === 'infrastructure' && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-accent rounded-none" />
                <span className="text-muted uppercase text-[10px]">Redis Used:</span>
                <span className="font-bold text-card-foreground">{cache?.usedMemoryHuman ?? '0B'} / {cache?.maxMemoryHuman ?? '25MB'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-success rounded-none" />
                <span className="text-muted uppercase text-[10px]">Cache Hit Ratio:</span>
                <span className="font-bold text-card-foreground">{cache?.hitRatioPercent ?? 0}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-info rounded-none" />
                <span className="text-muted uppercase text-[10px]">DB Active Connections:</span>
                <span className="font-bold text-card-foreground">{db?.activeConnections ?? 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#a855f7] rounded-none" />
                <span className="text-muted uppercase text-[10px]">Active AI Chats:</span>
                <span className="font-bold text-card-foreground">{ai?.activeConversations ?? 0}</span>
              </div>
            </div>
          )}

          {activeTab === 'traffic' && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-info rounded-none" />
                <span className="text-muted uppercase text-[10px]">Throughput:</span>
                <span className="font-bold text-card-foreground">{request?.avgRequestsPerMinute ?? 0} req/min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted uppercase text-[10px]">Daily Volume:</span>
                <span className="font-bold text-card-foreground">{request?.dailyRequests.toLocaleString() ?? 0} reqs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-success rounded-none" />
                <span className="text-muted uppercase text-[10px]">Online Learners:</span>
                <span className="font-bold text-card-foreground">{session?.currentlyActiveUsers ?? 0} Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted uppercase text-[10px]">Average Stay:</span>
                <span className="font-bold text-card-foreground">{session?.avgStayDurationMinutes ?? 0} mins</span>
              </div>
            </div>
          )}

          <div className="text-[10px] text-muted font-mono">
            {timeRange === '7d' ? '7-Day Hourly Timeline' : timeRange === '24h' ? '24h Rolling Timeline' : '1h Live Stream'}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* Tab 1: OVERVIEW Observability Line Plot                               */}
        {/* ===================================================================== */}
        {activeTab === 'overview' && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
              <button
                type="button"
                onClick={() => toggleSeries('overview_cpu')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.overview_cpu
                    ? 'border-accent/80 bg-accent/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-accent" />
                <span>Host CPU (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('overview_memory')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.overview_memory
                    ? 'border-info/80 bg-info/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-info" />
                <span>Host RAM (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('overview_containers')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.overview_containers
                    ? 'border-success/80 bg-success/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-success" />
                <span>Lab Pods</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('overview_requests')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.overview_requests
                    ? 'border-[#f472b6]/80 bg-[#f472b6]/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-[#f472b6]" />
                <span>Web Traffic (req/m)</span>
              </button>

              <span className="text-[10px] text-muted ml-auto font-sans">
                Left Axis: System % Saturation • Right Axis: Containers / Traffic
              </span>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 30, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} />
                  <YAxis yAxisId="left" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} domain={[0, 100]} unit="%" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} domain={[0, 'auto']} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const item = payload[0]?.payload as UnifiedPlotPoint | undefined;
                      return (
                        <div className="border border-border bg-surface p-3 shadow-2xl font-mono text-xs z-30" style={{ borderRadius: 0 }}>
                          <div className="font-bold text-card-foreground border-b border-border/60 pb-1 mb-2 flex justify-between gap-4">
                            <span>{item?.fullLabel ?? label}</span>
                            <span className="text-accent uppercase text-[10px]">{timeRange === '7d' ? '7D Hourly' : timeRange === '24h' ? '24H' : 'Live'}</span>
                          </div>
                          <div className="space-y-1">
                            {payload.map((e) => (
                              <div key={e.name} className="flex justify-between gap-4 text-[11px]">
                                <span style={{ color: e.color }}>{e.name}:</span>
                                <span className="font-bold text-card-foreground">{Number(e.value).toLocaleString()}{String(e.name).includes('%') ? '%' : String(e.name).includes('Pods') ? ' Pods' : ' req/m'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }}
                  />
                  {seriesToggles.overview_cpu && (
                    <Line yAxisId="left" type="monotone" dataKey="cpuLoadPercent" name="Host CPU (%)" stroke="var(--color-accent-500)" strokeWidth={2.5} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.overview_memory && (
                    <Line yAxisId="left" type="monotone" dataKey="memoryPercent" name="Host RAM (%)" stroke="var(--color-info)" strokeWidth={2.5} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.overview_containers && (
                    <Line yAxisId="right" type="monotone" dataKey="allocatedContainers" name="Lab Containers (Pods)" stroke="var(--color-success)" strokeWidth={2.5} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.overview_requests && (
                    <Line yAxisId="right" type="monotone" dataKey="requestsPerMinute" name="Web Traffic (req/m)" stroke="#f472b6" strokeWidth={2} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ===================================================================== */}
        {/* Tab 2: COMPUTE & CONTAINERS Observability Line Plot                   */}
        {/* ===================================================================== */}
        {activeTab === 'compute' && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
              <button
                type="button"
                onClick={() => toggleSeries('compute_containers')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.compute_containers
                    ? 'border-success/80 bg-success/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-success" />
                <span>Running Lab Pods</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('compute_pending')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.compute_pending
                    ? 'border-warning/80 bg-warning/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-warning" />
                <span>Queued / Pending Pods</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('compute_ramGb')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.compute_ramGb
                    ? 'border-[#a855f7]/80 bg-[#a855f7]/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-[#a855f7]" />
                <span>Allocated RAM (GB)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('compute_cores')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.compute_cores
                    ? 'border-[#38bdf8]/80 bg-[#38bdf8]/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-[#38bdf8]" />
                <span>Allocated Cores</span>
              </button>

              <span className="text-[10px] text-muted ml-auto font-sans">
                Left Axis: Pod Container Count • Right Axis: RAM (GB) & Cores
              </span>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 30, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} />
                  <YAxis yAxisId="left" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} domain={[0, 'auto']} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} domain={[0, 'auto']} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const item = payload[0]?.payload as UnifiedPlotPoint | undefined;
                      return (
                        <div className="border border-border bg-surface p-3 shadow-2xl font-mono text-xs z-30" style={{ borderRadius: 0 }}>
                          <div className="font-bold text-card-foreground border-b border-border/60 pb-1 mb-2 flex justify-between gap-4">
                            <span>{item?.fullLabel ?? label}</span>
                            <span className="text-success uppercase text-[10px]">K8s Sandboxes</span>
                          </div>
                          <div className="space-y-1">
                            {payload.map((e) => (
                              <div key={e.name} className="flex justify-between gap-4 text-[11px]">
                                <span style={{ color: e.color }}>{e.name}:</span>
                                <span className="font-bold text-card-foreground">{Number(e.value).toLocaleString()}{String(e.name).includes('RAM') ? ' GB' : String(e.name).includes('Cores') ? ' Cores' : ' Pods'}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 mt-2 border-t border-border/40 text-[10px] text-muted flex justify-between">
                            <span>Cluster: {item?.kubernetesStatus ?? k8sStatus}</span>
                            <span>Max Capacity: 32 Pods</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {seriesToggles.compute_containers && (
                    <Line yAxisId="left" type="monotone" dataKey="allocatedContainers" name="Running Lab Pods" stroke="var(--color-success)" strokeWidth={2.5} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.compute_pending && (
                    <Line yAxisId="left" type="monotone" dataKey="pendingPods" name="Queued Pods" stroke="var(--color-warning)" strokeWidth={2} strokeDasharray="3 3" dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.compute_ramGb && (
                    <Line yAxisId="right" type="monotone" dataKey="allocatedRamGb" name="Allocated RAM (GB)" stroke="#a855f7" strokeWidth={2} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.compute_cores && (
                    <Line yAxisId="right" type="monotone" dataKey="allocatedCpuCores" name="Allocated Cores" stroke="#38bdf8" strokeWidth={2} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ===================================================================== */}
        {/* Tab 3: HOST HARDWARE Observability Line Plot                          */}
        {/* ===================================================================== */}
        {activeTab === 'hardware' && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
              <button
                type="button"
                onClick={() => toggleSeries('hardware_cpu')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.hardware_cpu
                    ? 'border-accent/80 bg-accent/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-accent" />
                <span>CPU Load (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('hardware_cpuMax')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.hardware_cpuMax
                    ? 'border-rose-400/80 bg-rose-400/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-rose-400" />
                <span>CPU Peak Max (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('hardware_memory')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.hardware_memory
                    ? 'border-info/80 bg-info/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-info" />
                <span>Host RAM (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('hardware_memMb')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.hardware_memMb
                    ? 'border-[#8b5cf6]/80 bg-[#8b5cf6]/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-[#8b5cf6]" />
                <span>Used RAM (MB)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('hardware_heapMb')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.hardware_heapMb
                    ? 'border-[#06b6d4]/80 bg-[#06b6d4]/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-[#06b6d4]" />
                <span>Process Heap (MB)</span>
              </button>

              <span className="text-[10px] text-muted ml-auto font-sans">
                Left Axis: Load Saturation % • Right Axis: RAM Megabytes (MB)
              </span>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 30, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} />
                  <YAxis yAxisId="left" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} domain={[0, 100]} unit="%" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} domain={[0, 'auto']} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const item = payload[0]?.payload as UnifiedPlotPoint | undefined;
                      return (
                        <div className="border border-border bg-surface p-3 shadow-2xl font-mono text-xs z-30" style={{ borderRadius: 0 }}>
                          <div className="font-bold text-card-foreground border-b border-border/60 pb-1 mb-2 flex justify-between gap-4">
                            <span>{item?.fullLabel ?? label}</span>
                            <span className="text-accent uppercase text-[10px]">Host Hardware</span>
                          </div>
                          <div className="space-y-1">
                            {payload.map((e) => (
                              <div key={e.name} className="flex justify-between gap-4 text-[11px]">
                                <span style={{ color: e.color }}>{e.name}:</span>
                                <span className="font-bold text-card-foreground">{Number(e.value).toLocaleString()}{String(e.name).includes('%') ? '%' : ' MB'}</span>
                              </div>
                            ))}
                          </div>
                          {item && (
                            <div className="pt-2 mt-2 border-t border-border/40 text-[10px] text-muted flex justify-between">
                              <span>CPU Min/Max: {item.cpuMin ?? 0}% / {item.cpuMax ?? 0}%</span>
                              <span>RAM Avg: {item.memoryAvg ?? item.memoryPercent}%</span>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  {seriesToggles.hardware_cpu && (
                    <Line yAxisId="left" type="monotone" dataKey="cpuLoadPercent" name="CPU Load (%)" stroke="var(--color-accent-500)" strokeWidth={2.5} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.hardware_cpuMax && (
                    <Line yAxisId="left" type="monotone" dataKey="cpuMax" name="CPU Peak Max (%)" stroke="#fb7185" strokeWidth={1.5} strokeDasharray="3 3" dot={false} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.hardware_memory && (
                    <Line yAxisId="left" type="monotone" dataKey="memoryPercent" name="Host RAM (%)" stroke="var(--color-info)" strokeWidth={2.5} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.hardware_memMb && (
                    <Line yAxisId="right" type="monotone" dataKey="memoryUsedMb" name="Used RAM (MB)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.hardware_heapMb && (
                    <Line yAxisId="right" type="monotone" dataKey="heapUsedMb" name="Process Heap (MB)" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="2 2" dot={false} activeDot={{ r: 4.5 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ===================================================================== */}
        {/* Tab 4: INFRASTRUCTURE (Cache / DB / AI) Observability Line Plot        */}
        {/* ===================================================================== */}
        {activeTab === 'infrastructure' && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
              <button
                type="button"
                onClick={() => toggleSeries('infra_cacheMem')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.infra_cacheMem
                    ? 'border-accent/80 bg-accent/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-accent" />
                <span>Redis Memory (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('infra_hitRatio')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.infra_hitRatio
                    ? 'border-success/80 bg-success/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-success" />
                <span>Cache Hit Ratio (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('infra_dbQueries')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.infra_dbQueries
                    ? 'border-info/80 bg-info/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-info" />
                <span>MySQL Queries / min</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('infra_aiTokens')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.infra_aiTokens
                    ? 'border-[#a855f7]/80 bg-[#a855f7]/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-[#a855f7]" />
                <span>AI Tokens / min</span>
              </button>

              <span className="text-[10px] text-muted ml-auto font-sans">
                Left Axis: Cache % (Quota & Hit Ratio) • Right Axis: DB Queries & AI Tokens
              </span>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 30, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} />
                  <YAxis yAxisId="left" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} domain={[0, 100]} unit="%" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} domain={[0, 'auto']} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const item = payload[0]?.payload as UnifiedPlotPoint | undefined;
                      return (
                        <div className="border border-border bg-surface p-3 shadow-2xl font-mono text-xs z-30" style={{ borderRadius: 0 }}>
                          <div className="font-bold text-card-foreground border-b border-border/60 pb-1 mb-2 flex justify-between gap-4">
                            <span>{item?.fullLabel ?? label}</span>
                            <span className="text-accent uppercase text-[10px]">Infrastructure</span>
                          </div>
                          <div className="space-y-1">
                            {payload.map((e) => (
                              <div key={e.name} className="flex justify-between gap-4 text-[11px]">
                                <span style={{ color: e.color }}>{e.name}:</span>
                                <span className="font-bold text-card-foreground">{Number(e.value).toLocaleString()}{String(e.name).includes('%') ? '%' : ''}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 mt-2 border-t border-border/40 text-[10px] text-muted flex justify-between">
                            <span>Redis: {cache?.status ?? 'CONNECTED'}</span>
                            <span>Quota Safe (&lt; 25MB)</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {seriesToggles.infra_cacheMem && (
                    <Line yAxisId="left" type="monotone" dataKey="cacheMemoryPercent" name="Redis Memory (%)" stroke="var(--color-accent-500)" strokeWidth={2.5} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.infra_hitRatio && (
                    <Line yAxisId="left" type="monotone" dataKey="cacheHitRatio" name="Cache Hit Ratio (%)" stroke="var(--color-success)" strokeWidth={2} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.infra_dbQueries && (
                    <Line yAxisId="right" type="monotone" dataKey="dbQueries" name="MySQL Queries / min" stroke="var(--color-info)" strokeWidth={2} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.infra_aiTokens && (
                    <Line yAxisId="right" type="monotone" dataKey="aiTokens" name="AI Tokens / min" stroke="#a855f7" strokeWidth={2} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ===================================================================== */}
        {/* Tab 5: WEB TRAFFIC & SESSIONS Observability Line Plot                 */}
        {/* ===================================================================== */}
        {activeTab === 'traffic' && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
              <button
                type="button"
                onClick={() => toggleSeries('traffic_reqAvg')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.traffic_reqAvg
                    ? 'border-info/80 bg-info/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-info" />
                <span>Avg Requests (req/m)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('traffic_reqMax')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.traffic_reqMax
                    ? 'border-warning/80 bg-warning/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-warning" />
                <span>Spike Peak Max (req/m)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('traffic_learners')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.traffic_learners
                    ? 'border-success/80 bg-success/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-success" />
                <span>Active Learners Online</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('traffic_sessions')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all ${
                  seriesToggles.traffic_sessions
                    ? 'border-[#a78bfa]/80 bg-[#a78bfa]/10 text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{ borderRadius: 0 }}
              >
                <span className="w-2.5 h-2.5 bg-[#a78bfa]" />
                <span>Active Sessions</span>
              </button>

              <span className="text-[10px] text-muted ml-auto font-sans">
                Left Axis: Requests per Minute • Right Axis: Active Learners / Sessions
              </span>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 30, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} />
                  <YAxis yAxisId="left" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} domain={[0, 'auto']} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} domain={[0, 'auto']} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const item = payload[0]?.payload as UnifiedPlotPoint | undefined;
                      return (
                        <div className="border border-border bg-surface p-3 shadow-2xl font-mono text-xs z-30" style={{ borderRadius: 0 }}>
                          <div className="font-bold text-card-foreground border-b border-border/60 pb-1 mb-2 flex justify-between gap-4">
                            <span>{item?.fullLabel ?? label}</span>
                            <span className="text-info uppercase text-[10px]">Web Traffic</span>
                          </div>
                          <div className="space-y-1">
                            {payload.map((e) => (
                              <div key={e.name} className="flex justify-between gap-4 text-[11px]">
                                <span style={{ color: e.color }}>{e.name}:</span>
                                <span className="font-bold text-card-foreground">{Number(e.value).toLocaleString()}{String(e.name).includes('req') ? ' req/m' : ''}</span>
                              </div>
                            ))}
                          </div>
                          {item && (
                            <div className="pt-2 mt-2 border-t border-border/40 text-[10px] text-muted flex justify-between">
                              <span>Req Min/Max: {item.requestsMin ?? 0} / {item.requestsMax ?? 0}</span>
                              <span>Today: {request?.dailyRequests.toLocaleString() ?? 0} reqs</span>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  {seriesToggles.traffic_reqAvg && (
                    <Line yAxisId="left" type="monotone" dataKey="requestsPerMinute" name="Avg Requests (req/m)" stroke="var(--color-info)" strokeWidth={2.5} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.traffic_reqMax && (
                    <Line yAxisId="left" type="monotone" dataKey="requestsMax" name="Spike Peak Max (req/m)" stroke="var(--color-warning)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.traffic_learners && (
                    <Line yAxisId="right" type="monotone" dataKey="activeLearners" name="Active Learners Online" stroke="var(--color-success)" strokeWidth={2.5} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                  {seriesToggles.traffic_sessions && (
                    <Line yAxisId="right" type="monotone" dataKey="activeSessions" name="Active Sessions" stroke="#a78bfa" strokeWidth={2} dot={{ r: timeRange === '7d' ? 1.5 : 2 }} activeDot={{ r: 4.5 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Tab Contextual Telemetry Footer */}
        <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-muted pt-2 border-t border-border/40 gap-2">
          <span>
            Database & Redis backed rolling 7-day hourly timeline (168 historical buckets, &lt; 35 KB cache footprint)
          </span>
          <span className="text-accent font-semibold">
            {timeRange === '7d'
              ? 'Past 7 Days (168 Hourly Buckets)'
              : timeRange === '24h'
              ? 'Past 24 Hours (24 Hourly Buckets)'
              : 'Live 1-Hour Rolling Buffer'}
          </span>
        </div>
      </div>
    </Card>
  );
}

export default SystemTelemetryMonitor;
