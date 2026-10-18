import { useState } from 'react';

export interface PixelatedBarPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface PixelatedBarChartProps {
  data: PixelatedBarPoint[];
  height?: number;
  segments?: number;
  color?: string;
  secondaryColor?: string;
  emptySegmentColor?: string;
}

export function PixelatedBarChart({
  data,
  height = 220,
  segments = 14,
  color = 'var(--color-accent-500)',
  secondaryColor = 'var(--color-text-primary)',
  emptySegmentColor = 'var(--color-border-subtle)',
}: PixelatedBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-border text-xs text-muted font-mono"
        style={{ height }}
      >
        No activity recorded for this period.
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => (d.secondaryValue ? d.value + d.secondaryValue : d.value)),
    1,
  );

  return (
    <div className="flex flex-col justify-end w-full min-w-0 max-w-full overflow-hidden" style={{ height }}>
      {/* Chart Canvas */}
      <div className="relative flex items-end justify-between gap-0.5 sm:gap-2 flex-1 pb-2 w-full min-w-0">
        {data.map((point, idx) => {
          const totalVal = point.secondaryValue ? point.value + point.secondaryValue : point.value;
          const filledTotalSegments = Math.round((totalVal / maxValue) * segments);
          const filledPrimarySegments = Math.round((point.value / maxValue) * segments);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={`${point.label}-${idx}`}
              className="relative flex flex-col items-center flex-1 min-w-0 h-full justify-end cursor-pointer group"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Floating Tooltip */}
              {isHovered && (
                <div
                  className="absolute bottom-full mb-2 z-50 pointer-events-none px-2 py-1 text-[11px] font-mono border border-border bg-surface text-card-foreground shadow-md whitespace-nowrap"
                 
                >
                  <p className="font-semibold">{point.label}</p>
                  <p style={{ color }}>Value: {point.value.toLocaleString()}</p>
                  {point.secondaryValue !== undefined && (
                    <p style={{ color: secondaryColor }}>
                      Secondary: {point.secondaryValue.toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Stacked Vertical Segment Blocks */}
              <div className="flex flex-col-reverse gap-[2px] w-full max-w-[20px] transition-opacity duration-150">
                {Array.from({ length: segments }).map((_, segIdx) => {
                  const isPrimaryFilled = segIdx < filledPrimarySegments;
                  const isTotalFilled = segIdx < filledTotalSegments;

                  let bg = emptySegmentColor;
                  if (isPrimaryFilled) {
                    bg = color;
                  } else if (isTotalFilled) {
                    bg = secondaryColor;
                  }

                  return (
                    <div
                      key={segIdx}
                      className="w-full h-[6px] transition-colors duration-100"
                      style={{
                        backgroundColor: bg,
                        opacity: isTotalFilled ? (isHovered ? 1 : 0.9) : 0.35,
                        
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Monospace X-Axis Labels */}
      <div className="flex items-center justify-between border-t border-border pt-2 text-[10px] font-mono text-muted uppercase tracking-wider w-full min-w-0 overflow-hidden">
        {data.map((point, idx) => {
          const showOnMobile = data.length <= 10 || idx === 0 || idx === data.length - 1 || idx % 4 === 0;
          return (
            <span
              key={`${point.label}-lbl-${idx}`}
              className={`flex-1 min-w-0 text-center truncate ${
                hoveredIdx === idx ? 'text-card-foreground font-semibold' : ''
              } ${showOnMobile ? 'block' : 'hidden sm:block'}`}
            >
              {point.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default PixelatedBarChart;
