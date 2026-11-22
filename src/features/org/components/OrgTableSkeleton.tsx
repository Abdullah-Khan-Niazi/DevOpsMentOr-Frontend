import { Skeleton } from '@/shared/components';

/** Table-shaped skeleton for roster and invitation lists: header row plus body rows. */
export function OrgTableSkeleton({
  label,
  columns = 4,
  rows = 5,
}: {
  label: string;
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="flex w-full flex-col gap-4 py-2" role="status" aria-label={label}>
      <div className="flex gap-4 px-3">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1 rounded-xs" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 px-3">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className="h-4 flex-1 rounded-xs" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default OrgTableSkeleton;
