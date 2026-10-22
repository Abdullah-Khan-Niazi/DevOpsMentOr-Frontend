import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CurriculumSkeleton,
  ErrorState,
  PageHeader,
  toast,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { CurriculumTree } from '../components/CurriculumTree';
import type { CreateAction, TreeNodeSelection } from '../components/CurriculumTree';
import { CurriculumDrawer } from '../components/CurriculumDrawer';
import { useAdminCourse, useAdminModuleMutations, useAdminModules } from '../hooks';

/**
 * F4 SCR-F4-01 / REFACTOR: Unified Admin Curriculum Master View.
 * Unifies course metadata, interactive tree DAG (Course -> Modules -> Lessons/Labs/Quizzes),
 * and standard slide-over drawer for inspecting and editing any curriculum node.
 */
export function AdminCurriculumPage() {
  const navigate = useNavigate();
  const { moduleId, lessonId, quizId } = useParams<{
    moduleId?: string;
    lessonId?: string;
    quizId?: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected node state for drawer
  const [selectedNode, setSelectedNode] = useState<TreeNodeSelection | null>(null);
  const [createAction, setCreateAction] = useState<CreateAction | null>(null);

  // Queries & mutations
  const course = useAdminCourse();
  const modulesQuery = useAdminModules();
  const mutations = useAdminModuleMutations();

  // Sync route params with drawer selection
  useEffect(() => {
    if (moduleId) {
      setSelectedNode({ type: 'module', id: Number(moduleId) });
      setCreateAction(null);
    } else if (lessonId) {
      const isLab = searchParams.get('type') === 'lab';
      const mId = Number(searchParams.get('moduleId')) || 0;
      setSelectedNode(
        isLab
          ? { type: 'lab', id: Number(lessonId), moduleId: mId }
          : { type: 'lesson', id: Number(lessonId), moduleId: mId },
      );
      setCreateAction(null);
    } else if (quizId) {
      const mId = Number(searchParams.get('moduleId')) || 0;
      setSelectedNode({ type: 'quiz', id: Number(quizId), moduleId: mId });
      setCreateAction(null);
    } else if (searchParams.get('create')) {
      const actionType = searchParams.get('create') as 'module' | 'lesson' | 'lab' | 'quiz';
      const mId = Number(searchParams.get('moduleId')) || 0;
      if (actionType === 'module') {
        setCreateAction({ type: 'module' });
      } else if (actionType === 'lesson' || actionType === 'lab' || actionType === 'quiz') {
        setCreateAction({ type: actionType, moduleId: mId });
      }
      setSelectedNode(null);
    }
  }, [moduleId, lessonId, quizId, searchParams]);

  const busyModuleIds = useMemo(() => {
    const ids = new Set<number>();
    [mutations.publish, mutations.archive].forEach((mutation) => {
      if (mutation.isPending && mutation.variables) {
        ids.add(Number(mutation.variables));
      }
    });
    return ids;
  }, [mutations.publish, mutations.archive]);

  const handleSelectNode = (selection: TreeNodeSelection) => {
    setSelectedNode(selection);
    setCreateAction(null);

    // Update URL shallowly for deep linking
    if (selection.type === 'module') {
      navigate(ROUTES.ADMIN_CURRICULUM_MODULE.replace(':moduleId', String(selection.id)), {
        replace: true,
      });
    } else if (selection.type === 'lesson') {
      navigate(
        `${ROUTES.ADMIN_CURRICULUM_LESSON.replace(':lessonId', String(selection.id))}?moduleId=${selection.moduleId}`,
        { replace: true },
      );
    } else if (selection.type === 'lab') {
      navigate(
        `${ROUTES.ADMIN_CURRICULUM_LESSON.replace(':lessonId', String(selection.id))}?type=lab&moduleId=${selection.moduleId}`,
        { replace: true },
      );
    } else if (selection.type === 'quiz') {
      navigate(
        `${ROUTES.ADMIN_CURRICULUM_QUIZ.replace(':quizId', String(selection.id))}?moduleId=${selection.moduleId}`,
        { replace: true },
      );
    } else {
      navigate(ROUTES.ADMIN_CURRICULUM, { replace: true });
    }
  };

  const handleCreateAction = (action: CreateAction) => {
    setCreateAction(action);
    setSelectedNode(null);

    if (action.type === 'module') {
      setSearchParams({ create: 'module' });
    } else {
      setSearchParams({ create: action.type, moduleId: String(action.moduleId) });
    }
  };

  const handleCloseDrawer = () => {
    setSelectedNode(null);
    setCreateAction(null);
    navigate(ROUTES.ADMIN_CURRICULUM, { replace: true });
  };

  const handlePublish = (id: number) => {
    mutations.publish.mutate(id, {
      onSuccess: () => toast.success('Module published.'),
      onError: (error) => toast.error(error.message),
    });
  };

  const handleUnpublish = (id: number) => {
    mutations.archive.mutate(id, {
      onSuccess: () => toast.success('Module archived.'),
      onError: (error) => toast.error(error.message),
    });
  };

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
      <div className="space-y-6">
        <PageHeader title="Curriculum Architecture & Sandboxes" />
        <ErrorState
          message={course.query.error?.message ?? 'Unable to load course architecture.'}
          onRetry={() => void course.query.refetch()}
        />
      </div>
    );
  }

  const courseData = course.query.data;
  const modulesList = modulesQuery.data ?? [];
  const isDrawerOpen = Boolean(selectedNode || createAction);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title="Curriculum Architecture & Sandboxes"
        description="Manage canonical curriculum modules, video lessons, quizzes, and live Kubernetes lab environments."
      />

      {/* Main Interactive Tree / DAG View */}
      <CurriculumTree
        course={courseData}
        modules={modulesList}
        selectedNode={selectedNode}
        onSelectNode={handleSelectNode}
        onCreateAction={handleCreateAction}
        onReorderModule={handleReorder}
        onPublishModule={handlePublish}
        onUnpublishModule={handleUnpublish}
        busyModuleIds={busyModuleIds}
      />

      {/* Right Slide-Over Drawer for Inspecting & Editing Selected Nodes */}
      <CurriculumDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        selectedNode={selectedNode}
        createAction={createAction}
        course={courseData}
        onNodeCreated={(newSelection) => {
          handleSelectNode(newSelection);
        }}
      />
    </div>
  );
}

export default AdminCurriculumPage;
