import type { FunnelStageDto } from '../types';

interface ConversionFunnelProps {
  stages: FunnelStageDto[];
}

export function ConversionFunnel({ stages }: ConversionFunnelProps) {
  if (!stages || stages.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center border border-dashed border-border text-xs text-muted font-mono">
        No funnel data available yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="grid gap-2 sm:grid-cols-4">
        {stages.map((stage, idx) => {
          return (
            <div
              key={stage.stage}
              className="relative flex flex-col justify-between p-3.5 border border-border bg-surface/50"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                  Step 0{idx + 1}
                </span>
                <span className="text-xs font-mono font-bold text-accent">
                  {stage.percentage}%
                </span>
              </div>

              <div className="my-2">
                <p className="text-2xl font-bold font-mono tracking-tight text-card-foreground">
                  {stage.count.toLocaleString()}
                </p>
                <p className="text-xs text-muted truncate mt-0.5">{stage.stage}</p>
              </div>

              {/* Segmented Progress Indicator Bar */}
              <div className="w-full h-1.5 bg-border-subtle mt-1 overflow-hidden" style={{ borderRadius: 0 }}>
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${stage.percentage}%`, borderRadius: 0 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConversionFunnel;
