interface PixelatedMiniSparklineProps {
  levels?: number[]; // Values 0..5 for each of 5 bars
  color?: string;
  emptyColor?: string;
}

export function PixelatedMiniSparkline({
  levels = [2, 3, 5, 4, 3],
  color = 'var(--color-accent-500)',
  emptyColor = 'var(--color-border-subtle)',
}: PixelatedMiniSparklineProps) {
  const bars = levels.slice(0, 5);
  const maxSegs = 5;

  return (
    <div className="flex items-end gap-[3px] h-7" aria-hidden="true">
      {bars.map((lvl, bIdx) => {
        const filled = Math.min(Math.max(lvl, 0), maxSegs);
        return (
          <div key={bIdx} className="flex flex-col-reverse gap-[2px] w-[5px]">
            {Array.from({ length: maxSegs }).map((_, sIdx) => {
              const isFilled = sIdx < filled;
              return (
                <div
                  key={sIdx}
                  className="w-full h-[3px]"
                  style={{
                    backgroundColor: isFilled ? color : emptyColor,
                    opacity: isFilled ? 0.9 : 0.3,
                    
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default PixelatedMiniSparkline;
