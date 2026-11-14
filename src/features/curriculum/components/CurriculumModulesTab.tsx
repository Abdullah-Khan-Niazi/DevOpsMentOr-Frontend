import { useMemo } from 'react';
import { CurriculumSkeleton, ErrorState, toast } from '@/shared/components';
import { CurriculumTree } from './CurriculumTree';
import type { CreateAction, TreeNodeSelection } from './CurriculumTree';
import { useAdminCourse, useAdminModules, useAdminModuleMutations } from '../hooks';

interface CurriculumModulesTabProps {
  /** URL-selected entity highlighted in the tree; the drawer lives in the panel. */
  selectedNode: TreeNodeSelection | null;
  /** Select a node and deep-link to its editor drawer. */
  onSelectNode: (selection: TreeNodeSelection) => void;
  /** Open a create form (deep-linked drawer owned by the master panel). */
  onCreateAction: (action: CreateAction) => void;
}

/**
 * Modules tab: the canonical Course → Modules → Lessons/Labs/Quizzes manager
 * (interleaved sequence, publish state, quick create, reorder controls). The
 * task drawer itself is hosted once by the master panel so every tab shares
 * the same create/edit lifecycle.
 */
export function CurriculumModulesTab({
  selectedNode,
  onSelectNode,
  onCreateAction,
}: CurriculumModulesTabProps) {
  const course = useAdminCourse();
  const modulesQuery = useAdminModules();
  const mutations = useAdminModuleMutations();

  const busyModuleIds = useMemo(() => {
    const ids = new Set<number>();
    if (mutations.reorder.isPending) {
      for (const order of mutations.reorder.variables ?? []) {
        ids.add(order.moduleId);
      }
    }
    return ids;
  }, [mutations.reorder.isPending, mutations.reorder.variables]);

  const handleReorder = (id: number, direction: -1 | 1) => {
    const modules = modulesQuery.data ?? [];
    const index = modules.findIndex((module) => module.moduleId === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= modules.length) {
      return;
    }
    const next = [...modules];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    const orders = next.map((module, order) => ({
      moduleId: module.moduleId,
      moduleOrder: order + 1,
    }));
    mutations.reorder.mutate(orders, {
      onSuccess: () => toast.success('Module order updated.'),
      onError: (error) => toast.error(error.message),
    });
  };

  if (course.query.isLoading || modulesQuery.isLoading) {
    return <CurriculumSkeleton />;
  }

  if (course.query.isError || !course.query.data) {
    return (
      <ErrorState
        title="Could not load the course"
        message={course.query.error?.message ?? 'Unable to load course architecture.'}
        onRetry={() => void course.query.refetch()}
      />
    );
  }

  if (modulesQuery.isError) {
    return (
      <ErrorState
        title="Could not load modules"
        message={modulesQuery.error?.message ?? 'Unable to load curriculum modules.'}
        onRetry={() => void modulesQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <CurriculumTree
        course={course.query.data}
        modules={modulesQuery.data ?? []}
        selectedNode={selectedNode}
        onSelectNode={onSelectNode}
        onCreateAction={onCreateAction}
        onReorderModule={handleReorder}
        busyModuleIds={busyModuleIds}
      />
    </div>
  );
}

export default CurriculumModulesTab;
