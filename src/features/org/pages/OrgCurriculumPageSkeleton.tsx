import { PageSkeleton, Skeleton, TreeSkeleton } from '@/shared/components';

/** Org curriculum: page title, then the course tree with nested module rows. */
export function OrgCurriculumPageSkeleton() {
  return (
    <PageSkeleton label="Loading curriculum">
      <Skeleton className="h-8 w-56 rounded-md" />
      <div className="flex flex-col gap-1">
        <TreeSkeleton rows={3} depth={0} />
        <TreeSkeleton rows={2} depth={1} />
        <TreeSkeleton rows={3} depth={0} />
        <TreeSkeleton rows={2} depth={1} />
      </div>
    </PageSkeleton>
  );
}

export default OrgCurriculumPageSkeleton;
