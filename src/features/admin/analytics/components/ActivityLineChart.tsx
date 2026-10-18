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
import { TELEMETRY_TOKENS } from '@/shared/constants';

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
        </div>

        <div className="flex items-center gap-2">
          {onDaysChange && (
            <div className="tab-switcher shrink-0">
              {ranges.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDaysChange(d)}
                  className={`tab-switcher__tab ${
                    days === d ? 'tab-switcher__tab--active' : ''
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Series Toggle Filters with Circular Indicators */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
        <button
          type="button"
          onClick={() =>
            setVisibleSeries((prev) => ({ ...prev, activeUsers: !prev.activeUsers }))
          }
          className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
            visibleSeries.activeUsers ? 'opacity-100' : 'opacity-40 line-through'
          }`}
        >
          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: TELEMETRY_TOKENS.activeLearners }} />
          <span className="text-card-foreground font-medium">Active Learners</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setVisibleSeries((prev) => ({ ...prev, newSignups: !prev.newSignups }))
          }
          className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
            visibleSeries.newSignups ? 'opacity-100' : 'opacity-40 line-through'
          }`}
        >
          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: TELEMETRY_TOKENS.newSignups }} />
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
            className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
              visibleSeries.courseCompletions ? 'opacity-100' : 'opacity-40 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: TELEMETRY_TOKENS.completions }} />
            <span className="text-card-foreground font-medium">Completions</span>
          </button>
        )}
      </div>

      {/* Main Pixelated Line Chart Canvas */}
      <div className="w-full min-w-0 max-w-full overflow-hidden" style={{ height }}>
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
                    className="border border-border bg-surface p-2.5 shadow-xl font-mono text-xs rounded-lg"
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
                stroke={TELEMETRY_TOKENS.activeLearners}
                strokeWidth={2}
                dot={{ r: 2.5, strokeWidth: 1.5, fill: TELEMETRY_TOKENS.activeLearners, stroke: TELEMETRY_TOKENS.activeLearners }}
                activeDot={{ r: 5, strokeWidth: 2, fill: TELEMETRY_TOKENS.activeLearners, stroke: 'var(--color-bg-surface, #FAF9F6)' }}
              />
            )}

            {visibleSeries.newSignups && (
              <Line
                type="monotone"
                dataKey="newSignups"
                name="New Signups"
                stroke={TELEMETRY_TOKENS.newSignups}
                strokeWidth={1.75}
                dot={{ r: 2.5, strokeWidth: 1.5, fill: TELEMETRY_TOKENS.newSignups, stroke: TELEMETRY_TOKENS.newSignups }}
                activeDot={{ r: 5, strokeWidth: 2, fill: TELEMETRY_TOKENS.newSignups, stroke: 'var(--color-bg-surface, #FAF9F6)' }}
              />
            )}

            {visibleSeries.courseCompletions && data.some((d) => d.courseCompletions !== undefined) && (
              <Line
                type="monotone"
                dataKey="courseCompletions"
                name="Completions"
                stroke={TELEMETRY_TOKENS.completions}
                strokeWidth={1.75}
                dot={{ r: 2.5, strokeWidth: 1.5, fill: TELEMETRY_TOKENS.completions, stroke: TELEMETRY_TOKENS.completions }}
                activeDot={{ r: 5, strokeWidth: 2, fill: TELEMETRY_TOKENS.completions, stroke: 'var(--color-bg-surface, #FAF9F6)' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ActivityLineChart;
