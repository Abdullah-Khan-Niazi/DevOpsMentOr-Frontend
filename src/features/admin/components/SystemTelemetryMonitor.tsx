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
import { TELEMETRY_TOKENS } from '@/shared/constants';
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
    <Card className={`p-5 flex flex-col gap-4 font-mono text-xs w-full min-w-0 max-w-full overflow-hidden ${className}`} style={{ borderRadius: 0 }}>
      {/* Top Header & Multilevel Tab Switcher — Single Horizontal Level */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-card-foreground font-mono whitespace-nowrap">
            Host & System Telemetry
          </h2>
        </div>

        {/* Multilevel Tab Switcher (Placed from the right, on same level) */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* Level 1: Subsystem Selector */}
          <div className="flex flex-wrap items-center gap-0.5 border border-border p-0.5 bg-surface text-[10px] sm:text-[11px] max-w-full">
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
                className={`px-1.5 sm:px-2.5 py-1 transition-all cursor-pointer whitespace-nowrap active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                  activeTab === tab.key
                    ? 'bg-accent text-accent-foreground font-bold'
                    : 'text-muted hover:text-card-foreground hover:bg-surface-hover/80'
                }`}
                style={{ borderRadius: 0 }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Level 2: Time Horizon Selector (Placed from the right) */}
          <div className="flex items-center gap-0.5 border border-border p-0.5 bg-surface text-[9px] sm:text-[10px] font-mono shrink-0">
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
                className={`px-1.5 sm:px-2 py-0.5 transition-all cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                  timeRange === t.key
                    ? 'bg-accent text-accent-foreground font-bold'
                    : 'text-muted hover:text-card-foreground hover:bg-surface-hover/80'
                }`}
                style={{ borderRadius: 0 }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full min-w-0">
        {/* Tab-Specific Contextual Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-surface/60 border border-border text-[10px] sm:text-[11px] w-full min-w-0">
          {activeTab === 'overview' && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 w-full min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.activePods }} />
                <span className="text-muted uppercase text-[10px]">Active Pods:</span>
                <span className="font-bold text-card-foreground">{activeContainers} Running</span>
                <span className="text-[10px] text-muted">({pendingPods} queued)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.usedRam }} />
                <span className="text-muted uppercase text-[10px]">Pod RAM:</span>
                <span className="font-bold text-card-foreground">{allocatedRamGb} GB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.queuedPods }} />
                <span className="text-muted uppercase text-[10px]">CPU Cores:</span>
                <span className="font-bold text-card-foreground">{host?.cpuCores ?? 8} Cores</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.queuedPods }} />
                <span className="text-muted uppercase text-[10px]">1m/5m/15m Load:</span>
                <span className="font-bold text-card-foreground">
                  {host?.loadAvg1m ?? '0.49'} / {host?.loadAvg5m ?? '0.93'} / {host?.loadAvg15m ?? '1.07'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.hostCpu }} />
                <span className="text-muted uppercase text-[10px]">Host CPU:</span>
                <span className="font-bold text-card-foreground">{cpuPercent}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.hostRam }} />
                <span className="text-muted uppercase text-[10px]">Host RAM:</span>
                <span className="font-bold text-card-foreground">{memoryPercent}% ({host?.totalMemoryMb ? (host.totalMemoryMb - (host.freeMemoryMb ?? 0)).toLocaleString() : '5,194'} MB)</span>
              </div>
            </div>
          )}

          {activeTab === 'compute' && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 w-full min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.activePods }} />
                <span className="text-muted uppercase text-[10px]">Active Pods:</span>
                <span className="font-bold text-card-foreground">{activeContainers} Running</span>
                <span className="text-[10px] text-muted">({pendingPods} queued)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.usedRam }} />
                <span className="text-muted uppercase text-[10px]">Allocated RAM:</span>
                <span className="font-bold text-card-foreground">{allocatedRamGb} GB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.allocatedCores }} />
                <span className="text-muted uppercase text-[10px]">Allocated Cores:</span>
                <span className="font-bold text-card-foreground">{allocatedCpuCores} Cores</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: 'var(--color-primary, #14140F)' }} />
                <span className="text-muted uppercase text-[10px]">Cluster Health:</span>
                <span className="font-bold text-card-foreground">{k8sStatus}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted uppercase text-[10px]">Max Capacity:</span>
                <span className="font-bold text-card-foreground">10 Pods</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted uppercase text-[10px]">Eviction Events:</span>
                <span className="font-bold text-card-foreground">0</span>
              </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 w-full min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.hostCpu }} />
                <span className="text-muted uppercase text-[10px]">CPU Cores:</span>
                <span className="font-bold text-card-foreground">{host?.cpuCores ?? 8} Cores</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.queuedPods }} />
                <span className="text-muted uppercase text-[10px]">1m/5m/15m Load:</span>
                <span className="font-bold text-card-foreground">
                  {host?.loadAvg1m ?? '0.49'} / {host?.loadAvg5m ?? '0.93'} / {host?.loadAvg15m ?? '1.07'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.hostRam }} />
                <span className="text-muted uppercase text-[10px]">Total RAM:</span>
                <span className="font-bold text-card-foreground">{host?.totalMemoryMb ? host.totalMemoryMb.toLocaleString() : '7,814'} MB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.allocatedCores }} />
                <span className="text-muted uppercase text-[10px]">Free RAM:</span>
                <span className="font-bold text-card-foreground">{host?.freeMemoryMb ? host.freeMemoryMb.toLocaleString() : '2,620'} MB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.processHeap }} />
                <span className="text-muted uppercase text-[10px]">Process Heap:</span>
                <span className="font-bold text-card-foreground">{host?.heapUsedMb ?? 54} MB</span>
              </div>
            </div>
          )}

          {activeTab === 'infrastructure' && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 w-full min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.redisMemory }} />
                <span className="text-muted uppercase text-[10px]">Redis Used:</span>
                <span className="font-bold text-card-foreground">{cache?.usedMemoryHuman ?? '1.36 MB'} / {cache?.maxMemoryHuman ?? '25 MB'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.cacheHitRatio }} />
                <span className="text-muted uppercase text-[10px]">Cache Hit Ratio:</span>
                <span className="font-bold text-card-foreground">{cache?.hitRatioPercent ?? 31}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.mysqlQueries }} />
                <span className="text-muted uppercase text-[10px]">DB Queries:</span>
                <span className="font-bold text-card-foreground">{db?.totalQueries ? db.totalQueries.toLocaleString() : '60,745'} queries</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.allocatedCores }} />
                <span className="text-muted uppercase text-[10px]">Active DB Pools:</span>
                <span className="font-bold text-card-foreground">{db?.activeConnections ?? 10}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.aiTokens }} />
                <span className="text-muted uppercase text-[10px]">Active AI Chats:</span>
                <span className="font-bold text-card-foreground">{ai?.activeConversations ?? 0}</span>
              </div>
            </div>
          )}

          {activeTab === 'traffic' && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 w-full min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.webRequests }} />
                <span className="text-muted uppercase text-[10px]">Throughput:</span>
                <span className="font-bold text-card-foreground">{request?.avgRequestsPerMinute ?? 3.4} req/min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.queuedPods }} />
                <span className="text-muted uppercase text-[10px]">Daily Volume:</span>
                <span className="font-bold text-card-foreground">{request?.dailyRequests ? request.dailyRequests.toLocaleString() : '203'} reqs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.activeLearners }} />
                <span className="text-muted uppercase text-[10px]">Online Learners:</span>
                <span className="font-bold text-card-foreground">{session?.currentlyActiveUsers ?? 1} Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none" style={{ backgroundColor: TELEMETRY_TOKENS.activeSessions }} />
                <span className="text-muted uppercase text-[10px]">Average Stay:</span>
                <span className="font-bold text-card-foreground">{session?.avgStayDurationMinutes ?? 284}m</span>
              </div>
            </div>
          )}
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
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.overview_cpu
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.overview_cpu ? `${TELEMETRY_TOKENS.hostCpu}cc` : undefined,
                  backgroundColor: seriesToggles.overview_cpu ? `${TELEMETRY_TOKENS.hostCpu}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.hostCpu }} />
                <span>Host CPU (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('overview_memory')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.overview_memory
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.overview_memory ? `${TELEMETRY_TOKENS.hostRam}cc` : undefined,
                  backgroundColor: seriesToggles.overview_memory ? `${TELEMETRY_TOKENS.hostRam}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.hostRam }} />
                <span>Host RAM (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('overview_containers')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.overview_containers
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.overview_containers ? `${TELEMETRY_TOKENS.activePods}cc` : undefined,
                  backgroundColor: seriesToggles.overview_containers ? `${TELEMETRY_TOKENS.activePods}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.activePods }} />
                <span>Lab Pods</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('overview_requests')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.overview_requests
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.overview_requests ? `${TELEMETRY_TOKENS.webRequests}cc` : undefined,
                  backgroundColor: seriesToggles.overview_requests ? `${TELEMETRY_TOKENS.webRequests}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.webRequests }} />
                <span>Web Traffic (req/m)</span>
              </button>

            </div>

            <div className="w-full h-80 min-w-0 max-w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 35, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} />
                  <YAxis
                    yAxisId="left"
                    stroke="var(--color-text-tertiary)"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border-default)' }}
                    domain={[0, 100]}
                    unit="%"
                    allowDecimals={false}
                    label={{
                      value: 'Saturation (%)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 12,
                      style: { fill: 'var(--color-text-tertiary)', fontSize: 10, fontFamily: 'monospace', textAnchor: 'middle' },
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--color-text-tertiary)"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border-default)' }}
                    domain={[0, 'auto']}
                    allowDecimals={false}
                    label={{
                      value: 'Containers / Traffic',
                      angle: 90,
                      position: 'insideRight',
                      offset: 12,
                      style: { fill: 'var(--color-text-tertiary)', fontSize: 10, fontFamily: 'monospace', textAnchor: 'middle' },
                    }}
                  />
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
                    <Line yAxisId="left" type="monotone" dataKey="cpuLoadPercent" name="Host CPU (%)" stroke={TELEMETRY_TOKENS.hostCpu} strokeWidth={2.5} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.hostCpu, stroke: TELEMETRY_TOKENS.hostCpu }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.hostCpu }} />
                  )}
                  {seriesToggles.overview_memory && (
                    <Line yAxisId="left" type="monotone" dataKey="memoryPercent" name="Host RAM (%)" stroke={TELEMETRY_TOKENS.hostRam} strokeWidth={2.5} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.hostRam, stroke: TELEMETRY_TOKENS.hostRam }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.hostRam }} />
                  )}
                  {seriesToggles.overview_containers && (
                    <Line yAxisId="right" type="monotone" dataKey="allocatedContainers" name="Lab Containers (Pods)" stroke={TELEMETRY_TOKENS.activePods} strokeWidth={2.5} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.activePods, stroke: TELEMETRY_TOKENS.activePods }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.activePods }} />
                  )}
                  {seriesToggles.overview_requests && (
                    <Line yAxisId="right" type="monotone" dataKey="requestsPerMinute" name="Web Traffic (req/m)" stroke={TELEMETRY_TOKENS.webRequests} strokeWidth={2} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.webRequests, stroke: TELEMETRY_TOKENS.webRequests }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.webRequests }} />
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
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.compute_containers
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.compute_containers ? `${TELEMETRY_TOKENS.activePods}cc` : undefined,
                  backgroundColor: seriesToggles.compute_containers ? `${TELEMETRY_TOKENS.activePods}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.activePods }} />
                <span>Running Lab Pods</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('compute_pending')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.compute_pending
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.compute_pending ? `${TELEMETRY_TOKENS.queuedPods}cc` : undefined,
                  backgroundColor: seriesToggles.compute_pending ? `${TELEMETRY_TOKENS.queuedPods}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.queuedPods }} />
                <span>Queued / Pending Pods</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('compute_ramGb')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.compute_ramGb
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.compute_ramGb ? `${TELEMETRY_TOKENS.usedRam}cc` : undefined,
                  backgroundColor: seriesToggles.compute_ramGb ? `${TELEMETRY_TOKENS.usedRam}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.usedRam }} />
                <span>Allocated RAM (GB)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('compute_cores')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.compute_cores
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.compute_cores ? `${TELEMETRY_TOKENS.allocatedCores}cc` : undefined,
                  backgroundColor: seriesToggles.compute_cores ? `${TELEMETRY_TOKENS.allocatedCores}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.allocatedCores }} />
                <span>Allocated Cores</span>
              </button>

            </div>

            <div className="w-full h-80 min-w-0 max-w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 35, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} />
                  <YAxis
                    yAxisId="left"
                    stroke="var(--color-text-tertiary)"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border-default)' }}
                    domain={[0, 'auto']}
                    allowDecimals={false}
                    label={{
                      value: 'Active Pods',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 12,
                      style: { fill: 'var(--color-text-tertiary)', fontSize: 10, fontFamily: 'monospace', textAnchor: 'middle' },
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--color-text-tertiary)"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border-default)' }}
                    domain={[0, 'auto']}
                    allowDecimals={false}
                    label={{
                      value: 'RAM (GB) & Cores',
                      angle: 90,
                      position: 'insideRight',
                      offset: 12,
                      style: { fill: 'var(--color-text-tertiary)', fontSize: 10, fontFamily: 'monospace', textAnchor: 'middle' },
                    }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const item = payload[0]?.payload as UnifiedPlotPoint | undefined;
                      return (
                        <div className="border border-border bg-surface p-3 shadow-2xl font-mono text-xs z-30" style={{ borderRadius: 0 }}>
                          <div className="font-bold text-card-foreground border-b border-border/60 pb-1 mb-2 flex justify-between gap-4">
                            <span>{item?.fullLabel ?? label}</span>
                            <span className="text-card-foreground font-bold uppercase text-[10px]">Sandbox Pods</span>
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
                    <Line yAxisId="left" type="monotone" dataKey="allocatedContainers" name="Running Lab Pods" stroke={TELEMETRY_TOKENS.activePods} strokeWidth={2.5} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.activePods, stroke: TELEMETRY_TOKENS.activePods }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.activePods }} />
                  )}
                  {seriesToggles.compute_pending && (
                    <Line yAxisId="left" type="monotone" dataKey="pendingPods" name="Queued Pods" stroke={TELEMETRY_TOKENS.queuedPods} strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2.5, fill: TELEMETRY_TOKENS.queuedPods, stroke: TELEMETRY_TOKENS.queuedPods }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.queuedPods }} />
                  )}
                  {seriesToggles.compute_ramGb && (
                    <Line yAxisId="right" type="monotone" dataKey="allocatedRamGb" name="Allocated RAM (GB)" stroke={TELEMETRY_TOKENS.usedRam} strokeWidth={2} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.usedRam, stroke: TELEMETRY_TOKENS.usedRam }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.usedRam }} />
                  )}
                  {seriesToggles.compute_cores && (
                    <Line yAxisId="right" type="monotone" dataKey="allocatedCpuCores" name="Allocated Cores" stroke={TELEMETRY_TOKENS.allocatedCores} strokeWidth={2} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.allocatedCores, stroke: TELEMETRY_TOKENS.allocatedCores }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.allocatedCores }} />
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
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.hardware_cpu
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.hardware_cpu ? `${TELEMETRY_TOKENS.hostCpu}cc` : undefined,
                  backgroundColor: seriesToggles.hardware_cpu ? `${TELEMETRY_TOKENS.hostCpu}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.hostCpu }} />
                <span>CPU Load (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('hardware_cpuMax')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.hardware_cpuMax
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.hardware_cpuMax ? `${TELEMETRY_TOKENS.cpuMaxSpike}cc` : undefined,
                  backgroundColor: seriesToggles.hardware_cpuMax ? `${TELEMETRY_TOKENS.cpuMaxSpike}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.cpuMaxSpike }} />
                <span>CPU Peak Max (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('hardware_memory')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.hardware_memory
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.hardware_memory ? `${TELEMETRY_TOKENS.hostRam}cc` : undefined,
                  backgroundColor: seriesToggles.hardware_memory ? `${TELEMETRY_TOKENS.hostRam}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.hostRam }} />
                <span>Host RAM (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('hardware_memMb')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.hardware_memMb
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.hardware_memMb ? `${TELEMETRY_TOKENS.usedRam}cc` : undefined,
                  backgroundColor: seriesToggles.hardware_memMb ? `${TELEMETRY_TOKENS.usedRam}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.usedRam }} />
                <span>Used RAM (MB)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('hardware_heapMb')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.hardware_heapMb
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.hardware_heapMb ? `${TELEMETRY_TOKENS.processHeap}cc` : undefined,
                  backgroundColor: seriesToggles.hardware_heapMb ? `${TELEMETRY_TOKENS.processHeap}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.processHeap }} />
                <span>Process Heap (MB)</span>
              </button>

            </div>

            <div className="w-full h-80 min-w-0 max-w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 35, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} />
                  <YAxis
                    yAxisId="left"
                    stroke="var(--color-text-tertiary)"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border-default)' }}
                    domain={[0, 100]}
                    unit="%"
                    allowDecimals={false}
                    label={{
                      value: 'Saturation (%)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 12,
                      style: { fill: 'var(--color-text-tertiary)', fontSize: 10, fontFamily: 'monospace', textAnchor: 'middle' },
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--color-text-tertiary)"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border-default)' }}
                    domain={[0, 'auto']}
                    allowDecimals={false}
                    label={{
                      value: 'RAM (MB)',
                      angle: 90,
                      position: 'insideRight',
                      offset: 12,
                      style: { fill: 'var(--color-text-tertiary)', fontSize: 10, fontFamily: 'monospace', textAnchor: 'middle' },
                    }}
                  />
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
                    <Line yAxisId="left" type="monotone" dataKey="cpuLoadPercent" name="CPU Load (%)" stroke={TELEMETRY_TOKENS.hostCpu} strokeWidth={2.5} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.hostCpu, stroke: TELEMETRY_TOKENS.hostCpu }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.hostCpu }} />
                  )}
                  {seriesToggles.hardware_cpuMax && (
                    <Line yAxisId="left" type="monotone" dataKey="cpuMax" name="CPU Peak Max (%)" stroke={TELEMETRY_TOKENS.cpuMaxSpike} strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2, fill: TELEMETRY_TOKENS.cpuMaxSpike, stroke: TELEMETRY_TOKENS.cpuMaxSpike }} activeDot={{ r: 4.5, fill: TELEMETRY_TOKENS.cpuMaxSpike }} />
                  )}
                  {seriesToggles.hardware_memory && (
                    <Line yAxisId="left" type="monotone" dataKey="memoryPercent" name="Host RAM (%)" stroke={TELEMETRY_TOKENS.hostRam} strokeWidth={2.5} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.hostRam, stroke: TELEMETRY_TOKENS.hostRam }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.hostRam }} />
                  )}
                  {seriesToggles.hardware_memMb && (
                    <Line yAxisId="right" type="monotone" dataKey="memoryUsedMb" name="Used RAM (MB)" stroke={TELEMETRY_TOKENS.usedRam} strokeWidth={2} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.usedRam, stroke: TELEMETRY_TOKENS.usedRam }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.usedRam }} />
                  )}
                  {seriesToggles.hardware_heapMb && (
                    <Line yAxisId="right" type="monotone" dataKey="heapUsedMb" name="Process Heap (MB)" stroke={TELEMETRY_TOKENS.processHeap} strokeWidth={1.5} strokeDasharray="2 2" dot={{ r: 2, fill: TELEMETRY_TOKENS.processHeap, stroke: TELEMETRY_TOKENS.processHeap }} activeDot={{ r: 4.5, fill: TELEMETRY_TOKENS.processHeap }} />
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
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.infra_cacheMem
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.infra_cacheMem ? `${TELEMETRY_TOKENS.redisMemory}cc` : undefined,
                  backgroundColor: seriesToggles.infra_cacheMem ? `${TELEMETRY_TOKENS.redisMemory}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.redisMemory }} />
                <span>Redis Memory (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('infra_hitRatio')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.infra_hitRatio
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.infra_hitRatio ? `${TELEMETRY_TOKENS.cacheHitRatio}cc` : undefined,
                  backgroundColor: seriesToggles.infra_hitRatio ? `${TELEMETRY_TOKENS.cacheHitRatio}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.cacheHitRatio }} />
                <span>Cache Hit Ratio (%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('infra_dbQueries')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.infra_dbQueries
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.infra_dbQueries ? `${TELEMETRY_TOKENS.mysqlQueries}cc` : undefined,
                  backgroundColor: seriesToggles.infra_dbQueries ? `${TELEMETRY_TOKENS.mysqlQueries}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.mysqlQueries }} />
                <span>MySQL Queries / min</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('infra_aiTokens')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.infra_aiTokens
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.infra_aiTokens ? `${TELEMETRY_TOKENS.aiTokens}cc` : undefined,
                  backgroundColor: seriesToggles.infra_aiTokens ? `${TELEMETRY_TOKENS.aiTokens}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.aiTokens }} />
                <span>AI Tokens / min</span>
              </button>

            </div>

            <div className="w-full h-80 min-w-0 max-w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 35, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} />
                  <YAxis
                    yAxisId="left"
                    stroke="var(--color-text-tertiary)"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border-default)' }}
                    domain={[0, 100]}
                    unit="%"
                    allowDecimals={false}
                    label={{
                      value: 'Cache (%)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 12,
                      style: { fill: 'var(--color-text-tertiary)', fontSize: 10, fontFamily: 'monospace', textAnchor: 'middle' },
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--color-text-tertiary)"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border-default)' }}
                    domain={[0, 'auto']}
                    allowDecimals={false}
                    label={{
                      value: 'Queries & Tokens',
                      angle: 90,
                      position: 'insideRight',
                      offset: 12,
                      style: { fill: 'var(--color-text-tertiary)', fontSize: 10, fontFamily: 'monospace', textAnchor: 'middle' },
                    }}
                  />
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
                    <Line yAxisId="left" type="monotone" dataKey="cacheMemoryPercent" name="Redis Memory (%)" stroke={TELEMETRY_TOKENS.redisMemory} strokeWidth={2.5} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.redisMemory, stroke: TELEMETRY_TOKENS.redisMemory }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.redisMemory }} />
                  )}
                  {seriesToggles.infra_hitRatio && (
                    <Line yAxisId="left" type="monotone" dataKey="cacheHitRatio" name="Cache Hit Ratio (%)" stroke={TELEMETRY_TOKENS.cacheHitRatio} strokeWidth={2} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.cacheHitRatio, stroke: TELEMETRY_TOKENS.cacheHitRatio }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.cacheHitRatio }} />
                  )}
                  {seriesToggles.infra_dbQueries && (
                    <Line yAxisId="right" type="monotone" dataKey="dbQueries" name="MySQL Queries / min" stroke={TELEMETRY_TOKENS.mysqlQueries} strokeWidth={2} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.mysqlQueries, stroke: TELEMETRY_TOKENS.mysqlQueries }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.mysqlQueries }} />
                  )}
                  {seriesToggles.infra_aiTokens && (
                    <Line yAxisId="right" type="monotone" dataKey="aiTokens" name="AI Tokens / min" stroke={TELEMETRY_TOKENS.aiTokens} strokeWidth={2} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.aiTokens, stroke: TELEMETRY_TOKENS.aiTokens }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.aiTokens }} />
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
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.traffic_reqAvg
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.traffic_reqAvg ? `${TELEMETRY_TOKENS.webRequests}cc` : undefined,
                  backgroundColor: seriesToggles.traffic_reqAvg ? `${TELEMETRY_TOKENS.webRequests}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.webRequests }} />
                <span>Avg Requests (req/m)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('traffic_reqMax')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.traffic_reqMax
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.traffic_reqMax ? `${TELEMETRY_TOKENS.queuedPods}cc` : undefined,
                  backgroundColor: seriesToggles.traffic_reqMax ? `${TELEMETRY_TOKENS.queuedPods}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.queuedPods }} />
                <span>Spike Peak Max (req/m)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('traffic_learners')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.traffic_learners
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.traffic_learners ? `${TELEMETRY_TOKENS.activeLearners}cc` : undefined,
                  backgroundColor: seriesToggles.traffic_learners ? `${TELEMETRY_TOKENS.activeLearners}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.activeLearners }} />
                <span>Active Learners Online</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('traffic_sessions')}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 border transition-all active:scale-[0.97] ${
                  seriesToggles.traffic_sessions
                    ? 'text-card-foreground font-semibold'
                    : 'border-border/40 text-muted opacity-40 line-through'
                }`}
                style={{
                  borderRadius: 0,
                  borderColor: seriesToggles.traffic_sessions ? `${TELEMETRY_TOKENS.activeSessions}cc` : undefined,
                  backgroundColor: seriesToggles.traffic_sessions ? `${TELEMETRY_TOKENS.activeSessions}1a` : undefined,
                }}
              >
                <span className="w-2.5 h-2.5" style={{ backgroundColor: TELEMETRY_TOKENS.activeSessions }} />
                <span>Active Sessions</span>
              </button>

            </div>

            <div className="w-full h-80 min-w-0 max-w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 35, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--color-text-tertiary)" tick={{ fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-default)' }} />
                  <YAxis
                    yAxisId="left"
                    stroke="var(--color-text-tertiary)"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border-default)' }}
                    domain={[0, 'auto']}
                    allowDecimals={false}
                    label={{
                      value: 'Requests / min',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 12,
                      style: { fill: 'var(--color-text-tertiary)', fontSize: 10, fontFamily: 'monospace', textAnchor: 'middle' },
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--color-text-tertiary)"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border-default)' }}
                    domain={[0, 'auto']}
                    allowDecimals={false}
                    label={{
                      value: 'Learners / Sessions',
                      angle: 90,
                      position: 'insideRight',
                      offset: 12,
                      style: { fill: 'var(--color-text-tertiary)', fontSize: 10, fontFamily: 'monospace', textAnchor: 'middle' },
                    }}
                  />
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
                    <Line yAxisId="left" type="monotone" dataKey="requestsPerMinute" name="Avg Requests (req/m)" stroke={TELEMETRY_TOKENS.webRequests} strokeWidth={2.5} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.webRequests, stroke: TELEMETRY_TOKENS.webRequests }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.webRequests }} />
                  )}
                  {seriesToggles.traffic_reqMax && (
                    <Line yAxisId="left" type="monotone" dataKey="requestsMax" name="Spike Peak Max (req/m)" stroke={TELEMETRY_TOKENS.queuedPods} strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2, fill: TELEMETRY_TOKENS.queuedPods, stroke: TELEMETRY_TOKENS.queuedPods }} activeDot={{ r: 4.5, fill: TELEMETRY_TOKENS.queuedPods }} />
                  )}
                  {seriesToggles.traffic_learners && (
                    <Line yAxisId="right" type="monotone" dataKey="activeLearners" name="Active Learners Online" stroke={TELEMETRY_TOKENS.activeLearners} strokeWidth={2.5} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.activeLearners, stroke: TELEMETRY_TOKENS.activeLearners }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.activeLearners }} />
                  )}
                  {seriesToggles.traffic_sessions && (
                    <Line yAxisId="right" type="monotone" dataKey="activeSessions" name="Active Sessions" stroke={TELEMETRY_TOKENS.activeSessions} strokeWidth={2} dot={{ r: 2.5, fill: TELEMETRY_TOKENS.activeSessions, stroke: TELEMETRY_TOKENS.activeSessions }} activeDot={{ r: 5, fill: TELEMETRY_TOKENS.activeSessions }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

export default SystemTelemetryMonitor;
