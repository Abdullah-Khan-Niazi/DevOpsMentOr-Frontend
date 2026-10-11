import { useId, useState } from 'react';

export interface HatchedPieItem {
  label: string;
  value: number;
  percentage?: number;
}

interface HatchedPieChartProps {
  data: HatchedPieItem[];
  size?: number;
  headlineValue?: string | number;
  headlineSubtext?: string;
  headlineGrowth?: string;
  className?: string;
}

export function HatchedPieChart({
  data,
  size = 200,
  headlineValue,
  headlineSubtext,
  headlineGrowth,
  className = '',
}: HatchedPieChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const uid = useId().replace(/:/g, '');

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {headlineValue && (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-card-foreground">
                {headlineValue}
              </span>
              {headlineGrowth && (
                <span className="text-xs font-mono text-success">{headlineGrowth}</span>
              )}
            </div>
            {headlineSubtext && <p className="text-xs text-muted mt-0.5">{headlineSubtext}</p>}
          </div>
        )}
        <div className="flex h-44 items-center justify-center border border-dashed border-border text-xs text-muted font-mono">
          No segmentation data recorded.
        </div>
      </div>
    );
  }

  // Pre-calculate angles and percentages
  const slices: Array<{
    item: HatchedPieItem;
    percentage: number;
    startAngle: number;
    endAngle: number;
    patternId: string;
    path: string;
    isFullCircle: boolean;
  }> = [];

  const cx = 100;
  const cy = 100;
  const r = 85;
  let currentAngle = -Math.PI / 2; // Start at 12 o'clock

  const patternKeys = ['diag-right', 'horizontal', 'diag-left', 'cross', 'vertical', 'dense'];

  data.forEach((item, idx) => {
    const val = item.value || 0;
    const pct = item.percentage ?? Math.round((val / total) * 1000) / 10;
    const angleDelta = (val / total) * (2 * Math.PI);
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleDelta;
    currentAngle = endAngle;

    const patternId = `${uid}-pattern-${patternKeys[idx % patternKeys.length]}`;
    const isFullCircle = angleDelta >= 2 * Math.PI - 0.001;

    let path = '';
    if (!isFullCircle) {
      const x0 = cx + r * Math.cos(startAngle);
      const y0 = cy + r * Math.sin(startAngle);
      const x1 = cx + r * Math.cos(endAngle);
      const y1 = cy + r * Math.sin(endAngle);
      const largeArc = angleDelta > Math.PI ? 1 : 0;
      path = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`;
    }

    slices.push({
      item,
      percentage: pct,
      startAngle,
      endAngle,
      patternId,
      path,
      isFullCircle,
    });
  });

  return (
    <div className={`flex flex-col gap-4 w-full ${className}`}>
      {/* Top Headline Section (matching Image 2) */}
      {(headlineValue || headlineSubtext) && (
        <div className="flex items-start justify-between">
          <div>
            {headlineValue && (
              <span className="text-2xl font-bold font-mono tracking-tight text-card-foreground">
                {headlineValue}
              </span>
            )}
            {headlineSubtext && <p className="text-xs text-muted mt-0.5">{headlineSubtext}</p>}
          </div>
          {headlineGrowth && (
            <span className="text-xs font-mono font-medium text-success">{headlineGrowth}</span>
          )}
        </div>
      )}

      {/* Main Visualization Canvas: SVG Pie on Left, Tabular Legend on Right */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 w-full">
        {/* SVG Circular Pie Canvas */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full overflow-visible"
            aria-label="Hatched Segmentation Pie Chart"
          >
            <defs>
              {/* Pattern 0: 45 degree diagonal stripes */}
              <pattern
                id={`${uid}-pattern-diag-right`}
                width="8"
                height="8"
                patternTransform="rotate(45)"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="2.2" />
              </pattern>

              {/* Pattern 1: Horizontal stripes */}
              <pattern
                id={`${uid}-pattern-horizontal`}
                width="8"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="3" x2="8" y2="3" stroke="currentColor" strokeWidth="2.2" />
              </pattern>

              {/* Pattern 2: -45 degree diagonal stripes */}
              <pattern
                id={`${uid}-pattern-diag-left`}
                width="8"
                height="8"
                patternTransform="rotate(-45)"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="2.2" />
              </pattern>

              {/* Pattern 3: Crosshatch grid */}
              <pattern
                id={`${uid}-pattern-cross`}
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="4" x2="8" y2="4" stroke="currentColor" strokeWidth="1.6" />
                <line x1="4" y1="0" x2="4" y2="8" stroke="currentColor" strokeWidth="1.6" />
              </pattern>

              {/* Pattern 4: Vertical stripes */}
              <pattern
                id={`${uid}-pattern-vertical`}
                width="6"
                height="8"
                patternUnits="userSpaceOnUse"
              >
                <line x1="3" y1="0" x2="3" y2="8" stroke="currentColor" strokeWidth="2.2" />
              </pattern>

              {/* Pattern 5: Dense checker / tight diagonal */}
              <pattern
                id={`${uid}-pattern-dense`}
                width="5"
                height="5"
                patternTransform="rotate(45)"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeWidth="2.5" />
              </pattern>
            </defs>

            {/* Render Pie Slices */}
            {slices.map((slice, idx) => {
              const isHovered = hoveredIdx === idx;
              if (slice.isFullCircle) {
                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={`url(#${slice.patternId})`}
                    stroke="var(--color-bg-raised)"
                    strokeWidth="2"
                    className="text-card-foreground transition-all duration-150"
                  />
                );
              }

              return (
                <path
                  key={idx}
                  d={slice.path}
                  fill={`url(#${slice.patternId})`}
                  stroke="var(--color-bg-raised)"
                  strokeWidth="2.5"
                  className={`text-card-foreground transition-all duration-150 cursor-pointer ${
                    isHovered ? 'filter brightness-125 stroke-accent' : ''
                  }`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}

            {/* Center Pin or Inner Ring if needed */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--color-border-default)"
              strokeWidth="1"
              pointerEvents="none"
            />
          </svg>
        </div>

        {/* Legend Stack (matching Image 2) */}
        <div className="flex flex-col gap-2.5 w-full flex-1">
          {slices.map((slice, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={slice.item.label}
                className={`flex items-center justify-between gap-3 text-xs font-mono py-1 px-1.5 transition-colors cursor-pointer border ${
                  isHovered
                    ? 'border-accent bg-accent/10 text-card-foreground'
                    : 'border-transparent hover:bg-surface/60 text-muted'
                }`}
                style={{ borderRadius: 0 }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Pattern Swatch Box */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <svg
                    width="14"
                    height="14"
                    className="shrink-0 text-card-foreground border border-border"
                    style={{ borderRadius: 0 }}
                  >
                    <rect
                      width="14"
                      height="14"
                      fill={`url(#${slice.patternId})`}
                      stroke="none"
                    />
                  </svg>
                  <span className="truncate text-card-foreground font-medium">
                    {slice.item.label}
                  </span>
                </div>

                {/* Percentage & Count Numbers */}
                <div className="flex items-center gap-3 shrink-0 ml-auto">
                  <span className="text-muted text-[11px]">{slice.percentage}%</span>
                  <span className="font-bold text-card-foreground text-xs min-w-[36px] text-right">
                    {slice.item.value.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HatchedPieChart;
