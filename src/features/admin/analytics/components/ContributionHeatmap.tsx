import { useState } from 'react';
import { TabSwitcher } from '@/shared/components';
import type { ActivityHeatmapDayDto, MultiMetricHeatmapsDto } from '../types';

export type HeatmapMetricKey = 'activity' | 'logins' | 'labs' | 'signups' | 'orgs';

interface ContributionHeatmapProps {
  data?: ActivityHeatmapDayDto[];
  heatmaps?: MultiMetricHeatmapsDto;
  weeksCount?: number;
  className?: string;
}

interface MetricTabConfig {
  key: HeatmapMetricKey;
  label: string;
  nounSingle: string;
  nounPlural: string;
  description: string;
}

const METRIC_TABS: MetricTabConfig[] = [
  {
    key: 'activity',
    label: 'Platform Activity',
    nounSingle: 'interaction event',
    nounPlural: 'interaction events',
    description: 'Daily learning actions, lesson views, and quiz evaluations',
  },
  {
    key: 'logins',
    label: 'User Logins',
    nounSingle: 'learner login',
    nounPlural: 'learner logins',
    description: 'Successful authenticated sessions and portal accesses',
  },
  {
    key: 'labs',
    label: 'Labs Completed',
    nounSingle: 'lab session',
    nounPlural: 'lab sessions',
    description: 'Active Docker/K8s lab environment instances started',
  },
  {
    key: 'signups',
    label: 'New Signups',
    nounSingle: 'new account',
    nounPlural: 'new accounts',
    description: 'New learner and educator profile registrations',
  },
  {
    key: 'orgs',
    label: 'New Organizations',
    nounSingle: 'organization tenant',
    nounPlural: 'organization tenants',
    description: 'New university and enterprise workspace onboardings',
  },
];

export function ContributionHeatmap({
  data = [],
  heatmaps,
  weeksCount = 12,
  className = '',
}: ContributionHeatmapProps) {
  const [activeMetric, setActiveMetric] = useState<HeatmapMetricKey>('activity');
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  const currentTab = METRIC_TABS.find((t) => t.key === activeMetric) ?? METRIC_TABS[0]!;

  // Determine which data array to render based on activeMetric
  const activeData: ActivityHeatmapDayDto[] =
    heatmaps && heatmaps[activeMetric] && heatmaps[activeMetric].length > 0
      ? heatmaps[activeMetric]
      : data;

  // Map dates for fast O(1) lookup
  const dateMap = new Map<string, { count: number; level: number }>();
  let totalEventsInWindow = 0;
  let maxCount = 0;
  let peakDate = '';

  for (const item of activeData) {
    dateMap.set(item.date, { count: item.count, level: item.level });
    totalEventsInWindow += item.count;
    if (item.count > maxCount) {
      maxCount = item.count;
      peakDate = item.date;
    }
  }

  // Calculate day grid ending at today
  const totalDays = weeksCount * 7;
  const now = new Date();
  const dayCells: { date: string; count: number; level: number; dayOfWeek: number }[] = [];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const match = dateMap.get(key);
    dayCells.push({
      date: key,
      count: match?.count ?? 0,
      level: match?.level ?? 0,
      dayOfWeek: d.getDay(), // 0 = Sun, 1 = Mon, ..., 6 = Sat
    });
  }

  // Group into columns of 7 days (weeks)
  const weeks: (typeof dayCells)[] = [];
  for (let i = 0; i < dayCells.length; i += 7) {
    weeks.push(dayCells.slice(i, i + 7));
  }

  // Month label markers
  const monthLabels: { label: string; colIndex: number }[] = [];
  let lastMonth = '';
  weeks.forEach((week, wIdx) => {
    const firstDay = week[0];
    if (firstDay) {
      const monthStr = new Date(firstDay.date).toLocaleString('default', { month: 'short' });
      if (monthStr !== lastMonth) {
        monthLabels.push({ label: monthStr, colIndex: wIdx });
        lastMonth = monthStr;
      }
    }
  });

  const getCellColor = (level: number) => {
    // Paper & Ink heat ramp: pearl base deepening to full ink by intensity
    switch (level) {
      case 1:
        return 'color-mix(in srgb, var(--ink) 25%, var(--pearl-100))';
      case 2:
        return 'color-mix(in srgb, var(--ink) 50%, var(--pearl-100))';
      case 3:
        return 'color-mix(in srgb, var(--ink) 75%, var(--pearl-100))';
      case 4:
        return 'var(--ink)';
      default:
        return 'var(--pearl-200)';
    }
  };

  const formatReadableDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`flex flex-col gap-4 w-full min-w-0 max-w-full overflow-hidden ${className}`}>
      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabSwitcher<HeatmapMetricKey>
          ariaLabel="Heatmap metric"
          value={activeMetric}
          onChange={setActiveMetric}
          items={METRIC_TABS.map((tab) => ({
            id: tab.key,
            label: tab.label,
            icon:
              tab.key === 'activity'
                ? 'trending'
                : tab.key === 'logins'
                  ? 'login'
                  : tab.key === 'labs'
                    ? 'lab'
                    : tab.key === 'signups'
                      ? 'person-add'
                      : 'organization',
          }))}
        />

        <div className="flex items-center gap-3 text-[0.6875rem] font-mono text-muted">
          <span>
            Window Total:{' '}
            <strong className="text-card-foreground">{totalEventsInWindow.toLocaleString()}</strong>
          </span>
          {maxCount > 0 && (
            <span>
              Peak Day:{' '}
              <strong className="text-accent">
                {maxCount} ({peakDate})
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Matrix Canvas */}
      <div className="w-full max-w-full overflow-x-auto pb-1">
        <div className="min-w-[38.75rem]">
          {/* Month Headers */}
          <div className="flex items-center text-[0.6875rem] font-mono text-muted pl-8 gap-2 mb-1">
            {monthLabels.map((m, idx) => (
              <span key={idx} className="flex-1 truncate" style={{ minWidth: '2rem' }}>
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid Canvas with Day of Week Axis */}
          <div className="flex items-start gap-2">
            {/* Day of Week Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between h-[6.625rem] text-[0.625rem] font-mono text-muted py-0.5 select-none shrink-0">
              <span className="leading-none">Mon</span>
              <span className="leading-none">Wed</span>
              <span className="leading-none">Fri</span>
            </div>

            {/* Matrix Columns */}
            <div className="relative flex gap-[0.1875rem] flex-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[0.1875rem]">
                  {week.map((cell) => {
                    const isHovered = hoveredDay?.date === cell.date;
                    return (
                      <div
                        key={cell.date}
                        className={`relative w-[0.75rem] h-[0.75rem] transition-transform duration-75 cursor-pointer hover:scale-125 hover:z-20 ${
                          isHovered ? 'scale-125 z-20 ring-1 ring-accent' : ''
                        }`}
                        style={{
                          backgroundColor: getCellColor(cell.level),
                        }}
                        onMouseEnter={() => setHoveredDay({ date: cell.date, count: cell.count })}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Floating High-Precision Tooltip */}
              {hoveredDay && (
                <div className="absolute top-0 right-0 z-50 pointer-events-none px-3 py-2 text-[0.6875rem] font-mono border border-accent bg-surface text-card-foreground shadow-2xl">
                  <div className="font-bold text-card-foreground">
                    {hoveredDay.count.toLocaleString()}{' '}
                    {hoveredDay.count === 1 ? currentTab.nounSingle : currentTab.nounPlural}
                  </div>
                  <div className="text-[0.625rem] text-muted mt-0.5">
                    {formatReadableDate(hoveredDay.date)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer & Legend */}
      <div className="flex flex-wrap items-center justify-end text-[0.6875rem] font-mono text-muted pt-2">
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <div
              key={lvl}
              className="w-[0.625rem] h-[0.625rem]"
              style={{
                backgroundColor: getCellColor(lvl),
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export default ContributionHeatmap;
