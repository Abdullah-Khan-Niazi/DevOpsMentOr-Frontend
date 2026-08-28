import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, PageHeader, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { CourseMetaCard } from '../components/CourseMetaCard';
import { ModuleForm } from '../components/ModuleForm';
import { ModuleListPanel } from '../components/ModuleListPanel';
import { useAdminCourse, useAdminModuleMutations, useAdminModules } from '../hooks';

/** F4 SCR-F4-01: admin course and module manager (F4-API-07..14). */
export function AdminCurriculumPage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [publishFilter, setPublishFilter] = useState<'all' | 'true' | 'false'>('all');

  const course = useAdminCourse();
  const modulesQuery = useAdminModules(
    publishFilter === 'all' ? undefined : { isPublished: publishFilter === 'true' },
  );
  const mutations = useAdminModuleMutations();

  const busyModuleIds = useMemo(() => {
    const ids = new Set<number>();
    [mutations.publish, mutations.archive].forEach((mutation) => {
      if (mutation.isPending && mutation.variables) {
        ids.add(Number(mutation.variables));
      }
    });
    return ids;
  }, [mutations.publish, mutations.archive]);

  const handlePublish = (moduleId: number) => {
    mutations.publish.mutate(moduleId, {
      onSuccess: () => toast.success('Module published.'),
      onError: (error) => toast.error(error.message),
    });
  };

  const handleUnpublish = (moduleId: number) => {
    mutations.archive.mutate(moduleId, {
      onSuccess: () => toast.success('Module archived.'),
      onError: (error) => toast.error(error.message),
    });
  };

  const handleReorder = (moduleId: number, direction: -1 | 1) => {
    const modules = modulesQuery.data ?? [];
    const index = modules.findIndex((module) => module.moduleId === moduleId);
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Curriculum"
        description="Canonical course, modules, lessons and quizzes."
      />

      {course.query.isLoading ? (
        <Card className="space-y-3 p-6">
          <div className="h-6 w-1/3 rounded bg-border" />
          <div className="h-4 w-2/3 rounded bg-border" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="h-16 rounded-lg bg-border" />
            <div className="h-16 rounded-lg bg-border" />
            <div className="h-16 rounded-lg bg-border" />
          </div>
        </Card>
      ) : course.query.isError || !course.query.data ? (
        <Card className="p-6">
          <p className="text-sm text-muted">
            {course.query.error?.message ?? 'Unable to load the course.'}
          </p>
        </Card>
      ) : (
        <CourseMetaCard
          course={course.query.data}
          moduleCount={modulesQuery.data?.length ?? 0}
          canManage
          saving={course.update.isPending}
          onSave={(payload) =>
            course.update.mutate(payload, {
              onSuccess: () => toast.success('Course updated.'),
              onError: (error) => toast.error(error.message),
            })
          }
        />
      )}

      <Card className="flex items-center gap-3 p-4">
        <label htmlFor="module-publish-filter" className="text-sm text-muted">
          Publish state
        </label>
        <select
          id="module-publish-filter"
          className="input-field w-40"
          value={publishFilter}
          onChange={(e) => setPublishFilter(e.target.value as 'all' | 'true' | 'false')}
        >
          <option value="all">All</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </Card>

      {creating ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-card-foreground">New module</h3>
          <div className="mt-4">
            <ModuleForm
              initial={{
                title: '',
                description: '',
                estimatedMinutes: '',
                moduleOrder: String((modulesQuery.data?.length ?? 0) + 1),
              }}
              submitLabel="Create module"
              saving={mutations.create.isPending}
              onCancel={() => setCreating(false)}
              onSubmit={(values) =>
                mutations.create.mutate(
                  {
                    title: values.title,
                    description: values.description.trim() || undefined,
                    estimatedMinutes: values.estimatedMinutes
                      ? Number(values.estimatedMinutes)
                      : undefined,
                    moduleOrder: Number(values.moduleOrder),
                  },
                  {
                    onSuccess: (module) => {
                      toast.success('Module created.');
                      navigate(
                        ROUTES.ADMIN_CURRICULUM_MODULE.replace(
                          ':moduleId',
                          String(module.moduleId),
                        ),
                      );
                    },
                    onError: (error) => toast.error(error.message),
                  },
                )
              }
            />
          </div>
        </Card>
      ) : null}

      <ModuleListPanel
        modules={modulesQuery.data ?? []}
        isLoading={modulesQuery.isLoading}
        isError={modulesQuery.isError}
        errorMessage={modulesQuery.error?.message}
        onRetry={() => void modulesQuery.refetch()}
        busyModuleIds={busyModuleIds}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        onReorder={handleReorder}
        canManage
        onCreateModule={() => setCreating(true)}
      />
    </div>
  );
}

export default AdminCurriculumPage;
