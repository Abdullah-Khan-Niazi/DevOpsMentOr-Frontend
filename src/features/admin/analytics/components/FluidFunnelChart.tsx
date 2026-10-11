export interface FunnelStageItem {
  stage: string;
  count: number;
  percentage?: number;
}

interface FluidFunnelChartProps {
  stages: FunnelStageItem[];
  headlineValue?: string | number;
  headlineSubtext?: string;
  headlineGrowth?: string;
  className?: string;
}

export function FluidFunnelChart({
  stages,
  headlineValue,
  headlineSubtext,
  headlineGrowth,
  className = '',
}: FluidFunnelChartProps) {
  if (!stages || stages.length === 0) {
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
          No funnel data recorded.
        </div>
      </div>
    );
  }

  const baseCount = Math.max(stages[0]?.count ?? 1, 1);
  const finalStage = stages[stages.length - 1];
  const overallRate =
    headlineValue ?? `${Math.round(((finalStage?.count ?? 0) / baseCount) * 1000) / 10}%`;

  // SVG coordinate dimensions
  const totalWidth = 640;
  const totalHeight = 220;
  const centerY = 110;
  const stageWidth = totalWidth / stages.length;

  // Compute half-height for each stage (clamped between 14px and 72px)
  const maxHalfHeight = 72;
  const minHalfHeight = 16;
  const halfHeights = stages.map((s) => {
    const pct = s.percentage ?? Math.round((s.count / baseCount) * 100);
    // Non-linear scaling so small tail stages remain clearly visible
    const ratio = Math.pow(Math.max(pct, 2) / 100, 0.6);
    return Math.max(minHalfHeight, Math.round(ratio * maxHalfHeight));
  });

  // Build outer ribbon path (translucent backdrop band)
  let outerPath = '';
  // Top boundary of outer ribbon
  stages.forEach((_, idx) => {
    const xStart = idx * stageWidth;
    const xEnd = (idx + 1) * stageWidth;
    const h = halfHeights[idx]! + 12; // 12px outer margin
    const yTop = centerY - h;

    if (idx === 0) {
      outerPath += `M ${xStart} ${yTop} `;
    }

    if (idx < stages.length - 1) {
      const nextH = halfHeights[idx + 1]! + 12;
      const nextYTop = centerY - nextH;
      const xMid = (xEnd + (idx + 1) * stageWidth) / 2;
      outerPath += `L ${xEnd} ${yTop} C ${xMid} ${yTop}, ${xMid} ${nextYTop}, ${(idx + 1) * stageWidth} ${nextYTop} `;
    } else {
      outerPath += `L ${xEnd} ${yTop} `;
    }
  });

  // Right edge
  const lastOuterH = halfHeights[stages.length - 1]! + 12;
  outerPath += `L ${totalWidth} ${centerY + lastOuterH} `;

  // Bottom boundary of outer ribbon (reverse order)
  for (let idx = stages.length - 1; idx >= 0; idx--) {
    const xStart = idx * stageWidth;
    const xEnd = (idx + 1) * stageWidth;
    const h = halfHeights[idx]! + 12;
    const yBot = centerY + h;

    outerPath += `L ${xEnd} ${yBot} `;
    if (idx > 0) {
      const prevH = halfHeights[idx - 1]! + 12;
      const prevYBot = centerY + prevH;
      const xMid = (xStart + idx * stageWidth) / 2;
      outerPath += `C ${xMid} ${yBot}, ${xMid} ${prevYBot}, ${xStart} ${prevYBot} `;
    } else {
      outerPath += `L ${xStart} ${yBot} `;
    }
  }
  outerPath += 'Z';

  // Build inner core ribbon path
  let innerPath = '';
  stages.forEach((_, idx) => {
    const xStart = idx * stageWidth;
    const xEnd = (idx + 1) * stageWidth;
    const h = halfHeights[idx]!;
    const yTop = centerY - h;

    if (idx === 0) {
      innerPath += `M ${xStart} ${yTop} `;
    }

    if (idx < stages.length - 1) {
      const nextH = halfHeights[idx + 1]!;
      const nextYTop = centerY - nextH;
      const xMid = (xEnd + (idx + 1) * stageWidth) / 2;
      innerPath += `L ${xEnd} ${yTop} C ${xMid} ${yTop}, ${xMid} ${nextYTop}, ${(idx + 1) * stageWidth} ${nextYTop} `;
    } else {
      innerPath += `L ${xEnd} ${yTop} `;
    }
  });

  const lastInnerH = halfHeights[stages.length - 1]!;
  innerPath += `L ${totalWidth} ${centerY + lastInnerH} `;

  for (let idx = stages.length - 1; idx >= 0; idx--) {
    const xStart = idx * stageWidth;
    const xEnd = (idx + 1) * stageWidth;
    const h = halfHeights[idx]!;
    const yBot = centerY + h;

    innerPath += `L ${xEnd} ${yBot} `;
    if (idx > 0) {
      const prevH = halfHeights[idx - 1]!;
      const prevYBot = centerY + prevH;
      const xMid = (xStart + idx * stageWidth) / 2;
      innerPath += `C ${xMid} ${yBot}, ${xMid} ${prevYBot}, ${xStart} ${prevYBot} `;
    } else {
      innerPath += `L ${xStart} ${yBot} `;
    }
  }
  innerPath += 'Z';

  return (
    <div className={`flex flex-col gap-4 w-full ${className}`}>
      {/* Top Headline Section (matching Image 2) */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-2xl font-bold font-mono tracking-tight text-card-foreground">
            {overallRate}
          </span>
          <p className="text-xs text-muted mt-0.5">
            {headlineSubtext ??
              `Progression rate across ${stages.length} core platform milestones`}
          </p>
        </div>
        {headlineGrowth && (
          <span className="text-xs font-mono font-medium text-success">{headlineGrowth}</span>
        )}
      </div>

      {/* SVG Fluid Horizontal Funnel Canvas */}
      <div className="w-full relative">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="w-full h-auto overflow-visible select-none"
          aria-label="Fluid Conversion Funnel Chart"
        >
          {/* Outer Layer: Translucent Ribbon */}
          <path
            d={outerPath}
            fill="currentColor"
            className="text-border-subtle/50 opacity-40 transition-all duration-300"
          />

          {/* Inner Layer: Lighter Core Stream */}
          <path
            d={innerPath}
            fill="currentColor"
            className="text-muted/40 transition-all duration-300"
          />

          {/* Vertical Separator Hairlines between Stages */}
          {stages.slice(1).map((_, idx) => {
            const x = (idx + 1) * stageWidth;
            return (
              <line
                key={idx}
                x1={x}
                y1={15}
                x2={x}
                y2={totalHeight - 20}
                stroke="var(--color-border-subtle)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            );
          })}

          {/* Column Contents: Metric, Center White Percentage Pill, Stage Label */}
          {stages.map((stage, idx) => {
            const xCenter = idx * stageWidth + stageWidth / 2;
            const pct = stage.percentage ?? Math.round((stage.count / baseCount) * 100);

            return (
              <g key={stage.stage} className="transition-all duration-200">
                {/* Metric Count at Top */}
                <text
                  x={xCenter}
                  y={22}
                  textAnchor="middle"
                  className="fill-card-foreground font-mono font-bold text-xs"
                >
                  {stage.count >= 1000
                    ? `${(stage.count / 1000).toFixed(1)}K`
                    : stage.count.toLocaleString()}
                </text>

                {/* White Rounded Badge Pill in Center with Black Text (Image 2) */}
                <g transform={`translate(${xCenter - 22}, ${centerY - 11})`}>
                  <rect
                    width="44"
                    height="22"
                    rx="11"
                    ry="11"
                    fill="#FFFFFF"
                    stroke="#DBDAD3"
                    strokeWidth="1"
                    className="filter drop-shadow-sm"
                  />
                  <text
                    x="22"
                    y="15"
                    textAnchor="middle"
                    fill="#0A0B0D"
                    className="font-mono font-bold text-[11px]"
                  >
                    {pct}%
                  </text>
                </g>

                {/* Stage Title at Bottom */}
                <text
                  x={xCenter}
                  y={totalHeight - 10}
                  textAnchor="middle"
                  className="fill-muted font-mono text-[11px]"
                >
                  {stage.stage}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default FluidFunnelChart;
