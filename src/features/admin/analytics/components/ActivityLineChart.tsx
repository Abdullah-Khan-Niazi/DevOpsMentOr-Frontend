import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface ActivityTrendPoint {
  date: string;
  activeUsers: number;
  newSignups: number;
  courseCompletions?: number;
}

interface ActivityLineChartProps {
  data: ActivityTrendPoint[];
  height?: number;
  days?: number;
  ranges?: readonly number[];
  onDaysChange?: (days: number) => void;
  className?: string;
}

export function ActivityLineChart({
  data,
  height = 270,
  days = 14,
  ranges = [7, 14, 30, 90],
  onDaysChange,
  className = '',
}: ActivityLineChartProps) {
  const [visibleSeries, setVisibleSeries] = useState({
    activeUsers: true,
    newSignups: true,
    courseCompletions: true,
  });

  const avgActiveUsers = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, d) => acc + d.activeUsers, 0);
    return Math.round((sum / data.length) * 10) / 10;
  }, [data]);

  const maxVal = useMemo(() => {
    if (!data || data.length === 0) return 10;
    return Math.max(
      ...data.map((d) => Math.max(d.activeUsers, d.newSignups, d.courseCompletions ?? 0)),
      10,
    );
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-border text-xs text-muted font-mono ${className}`}
        style={{ height }}
      >
        No activity trend recorded for this period.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* Header with Title & Range Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-card-foreground">
            Platform Activity Trajectory
          </h2>
          <p className="text-xs text-muted">
            Continuous trend showing active learners, registrations, and completions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onDaysChange && (
            <div className="flex items-center gap-1 border border-border p-0.5 bg-surface font-mono text-xs">
              {ranges.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDaysChange(d)}
                  className={`px-2 py-0.5 transition-colors cursor-pointer ${
                    days === d
                      ? 'bg-accent text-card-foreground font-bold'
                      : 'text-muted hover:text-card-foreground'
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {d}D
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Series Toggle Filters with Square Pixel Swatches */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
        <button
          type="button"
          onClick={() =>
            setVisibleSeries((prev) => ({ ...prev, activeUsers: !prev.activeUsers }))
          }
          className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
            visibleSeries.activeUsers ? 'opacity-100' : 'opacity-40 line-through'
          }`}
        >
          <span className="w-2.5 h-2.5 bg-accent" style={{ shapeRendering: 'crispEdges' }} />
          <span className="text-card-foreground font-medium">Active Learners</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setVisibleSeries((prev) => ({ ...prev, newSignups: !prev.newSignups }))
          }
          className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
            visibleSeries.newSignups ? 'opacity-100' : 'opacity-40 line-through'
          }`}
        >
          <span className="w-2.5 h-2.5 bg-info" style={{ shapeRendering: 'crispEdges' }} />
          <span className="text-card-foreground font-medium">New Signups</span>
        </button>

        {data.some((d) => d.courseCompletions !== undefined) && (
          <button
            type="button"
            onClick={() =>
              setVisibleSeries((prev) => ({
                ...prev,
                courseCompletions: !prev.courseCompletions,
              }))
            }
            className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
              visibleSeries.courseCompletions ? 'opacity-100' : 'opacity-40 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 bg-warning" style={{ shapeRendering: 'crispEdges' }} />
            <span className="text-card-foreground font-medium">Completions</span>
          </button>
        )}

        <span className="text-muted text-[11px] ml-auto">
          Baseline Avg: <span className="font-bold text-card-foreground">{avgActiveUsers}</span>
        </span>
      </div>

      {/* Main Pixelated Line Chart Canvas */}
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            {/* LED Matrix Dotted Grid Lines */}
            <CartesianGrid strokeDasharray="1 3" stroke="var(--color-border-subtle)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="var(--color-text-tertiary)"
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border-default)' }}
            />
            <YAxis
              stroke="var(--color-text-tertiary)"
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border-default)' }}
              domain={[0, Math.ceil(maxVal * 1.15)]}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                return (
                  <div
                    className="border border-border bg-surface p-2.5 shadow-xl font-mono text-xs"
                    style={{ borderRadius: 0 }}
                  >
                    <div className="font-bold text-card-foreground border-b border-border/60 pb-1 mb-1.5 flex items-center justify-between gap-4">
                      <span>Date: {label}</span>
                      <span className="text-[10px] text-muted font-normal">Daily Total</span>
                    </div>
                    <div className="space-y-1">
                      {payload.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between gap-4 text-[11px]"
                        >
                          <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                            <span
                              className="w-2 h-2"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}:
                          </span>
                          <span className="font-bold text-card-foreground">
                            {Number(entry.value).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between gap-4 text-[10px] text-muted pt-1 border-t border-border/40">
                        <span>Window Avg:</span>
                        <span>{avgActiveUsers}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            {visibleSeries.activeUsers && (
              <Line
                type="monotone"
                dataKey="activeUsers"
                name="Active Learners"
                stroke="var(--color-accent-500)"
                strokeWidth={2}
                dot={{ r: 2.5, strokeWidth: 1.5 }}
                activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--color-bg-surface, #12141a)' }}
              />
            )}

            {visibleSeries.newSignups && (
              <Line
                type="monotone"
                dataKey="newSignups"
                name="New Signups"
                stroke="var(--color-info)"
                strokeWidth={1.75}
                dot={{ r: 2.5, strokeWidth: 1.5 }}
                activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--color-bg-surface, #12141a)' }}
              />
            )}

            {visibleSeries.courseCompletions && data.some((d) => d.courseCompletions !== undefined) && (
              <Line
                type="monotone"
                dataKey="courseCompletions"
                name="Completions"
                stroke="var(--color-warning)"
                strokeWidth={1.75}
                dot={{ r: 2.5, strokeWidth: 1.5 }}
                activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--color-bg-surface, #12141a)' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ActivityLineChart;
