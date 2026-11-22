import { useEffect, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  Button,
  Drawer,
  DrawerFormSkeleton,
  EmptyState,
  ErrorState,
  FieldError,
  Icon,
  Input,
  NumberInput,
  Switch,
  Textarea,
} from '@/shared/components';
import type { IconName } from '@/shared/components';
import { getErrorMessage, getFieldErrors, getStatusCode } from '@/shared/services/apiError';
import { DeleteEntityDialog } from '../DeleteEntityDialog';
import { ReorderList } from '../ReorderList';
import {
  useAdminModule,
  useCreateModule,
  useDeleteModule,
  useReorderItems,
  useSetModulePublished,
  useUpdateModule,
} from '../../../hooks/useAdminCurriculum';
import type {
  AdminModuleDetailDto,
  AdminModuleItemDto,
  CreateModulePayload,
  UpdateModulePayload,
} from '../../../types/admin';

// Module create and edit. A module has no slug input: its code (`CxxMxx`) is assigned by the
// server from its position and shown read only. Edit also orders the module's items
// (lesson, lab and quiz rows) and handles publish and delete.

const MANAGE_PERMISSION = 'platform.curriculum.manage';
const FORM_ID = 'module-drawer-form';

const moduleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters.')
    .max(255, 'Use at most 255 characters.'),
  description: z.string().max(2000, 'Use at most 2000 characters.'),
  estimatedMinutes: z
    .number({ error: 'Enter a number of minutes.' })
    .int('Use whole minutes.')
    .min(1, 'Use at least 1 minute.')
    .max(600, 'Use at most 600 minutes.'),
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

const EMPTY_VALUES: ModuleFormValues = {
  title: '',
  description: '',
  estimatedMinutes: 30,
};

const ITEM_ICON: Record<AdminModuleItemDto['kind'], IconName> = {
  lesson: 'lesson',
  lab: 'lab',
  quiz: 'quiz',
};

function toFormValues(detail: AdminModuleDetailDto): ModuleFormValues {
  return {
    title: detail.module.title,
    description: detail.module.description ?? '',
    estimatedMinutes: detail.module.estimatedMinutes,
  };
}

export interface ModuleDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  /** Module id in edit mode. */
  id: number | null;
  /** Course id in create mode (the module is appended to it). */
  parentId?: number;
  onClose: () => void;
  /** Called with the new module id; without it the drawer closes after a create. */
  onCreated?: (id: number) => void;
}

export function ModuleDrawer({ open, mode, id, parentId, onClose, onCreated }: ModuleDrawerProps) {
  const isEdit = mode === 'edit' && id !== null;
  const moduleId = id ?? 0;
  const createCourseId = parentId ?? 0;
  const canManage = useAuthStore(
    (state) => state.user?.permissions?.includes(MANAGE_PERMISSION) ?? false,
  );

  const detailQuery = useAdminModule(moduleId, open && isEdit);
  const detail = isEdit ? detailQuery.data : undefined;
  const loadedKey = detail ? detail.module.moduleId : null;
  // The course id comes from the loaded module (edit) or the parent (create).
  const courseId = detail ? detail.module.courseId : createCourseId;

  const createModule = useCreateModule(createCourseId);
  const updateModule = useUpdateModule(moduleId);
  const reorderItems = useReorderItems(moduleId);
  const setPublished = useSetModulePublished(courseId, moduleId);
  const deleteModule = useDeleteModule(courseId);

  const [formError, setFormError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: EMPTY_VALUES,
  });

  // Each open starts from the stored module (edit) or empty values (create).
  useEffect(() => {
    if (!open) return;
    reset(detail ? toFormValues(detail) : EMPTY_VALUES);
    // Refetches of the same module must not clobber unsaved edits, so `detail` is read once per id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, loadedKey, reset]);

  const saving = createModule.isPending || updateModule.isPending;

  // Closing clears the drawer's transient messages; the next open reloads the form.
  function handleClose() {
    setFormError(null);
    setDeleteOpen(false);
    onClose();
  }
  const refetchDetail = () => void detailQuery.refetch();
  const notFound = isEdit && detailQuery.isError && getStatusCode(detailQuery.error) === 404;

  function reportSaveError(error: unknown) {
    const fields = Object.entries(getFieldErrors(error));
    if (fields.length === 0) {
      setFormError(getErrorMessage(error));
      return;
    }
    for (const [path, message] of fields) {
      const root = path.split('.')[0];
      if (root in EMPTY_VALUES) {
        setError(root as keyof ModuleFormValues, { type: 'server', message });
      } else {
        setFormError(message);
      }
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const description = values.description.trim();
    try {
      if (isEdit) {
        const payload: UpdateModulePayload = {
          title: values.title,
          description: description || null,
          estimatedMinutes: values.estimatedMinutes,
        };
        await updateModule.mutateAsync(payload);
        reset(values);
        return;
      }
      const payload: CreateModulePayload = {
        title: values.title,
        description: description || undefined,
        estimatedMinutes: values.estimatedMinutes,
      };
      const created = await createModule.mutateAsync(payload);
      if (onCreated) onCreated(created.moduleId);
      else handleClose();
    } catch (error) {
      reportSaveError(error);
    }
  });

  let body: ReactNode;
  let formReady = false;
  if (isEdit && detailQuery.isPending) {
    body = <DrawerFormSkeleton fields={3} />;
  } else if (notFound) {
    body = (
      <EmptyState
        title="This item no longer exists"
        icon="module"
        action={
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Close
          </Button>
        }
      />
    );
  } else if (isEdit && detailQuery.isError) {
    body = <ErrorState error={detailQuery.error} onRetry={refetchDetail} />;
  } else {
    formReady = true;
    const items = detail?.items ?? [];

    body = (
      <fieldset disabled={!canManage || saving} className="flex min-w-0 flex-col gap-6">
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <section className="flex flex-col gap-4">
            <h3 className="text-base font-medium">Details</h3>
            {detail ? (
              <div className="flex flex-col gap-1">
                <span className="input-label">Code</span>
                <span className="font-mono text-sm text-muted">{detail.module.slug}</span>
              </div>
            ) : null}
            {detail ? (
              <Switch
                checked={
                  setPublished.isPending ? !detail.module.isPublished : detail.module.isPublished
                }
                isLoading={setPublished.isPending}
                onCheckedChange={(next) => setPublished.mutate(next)}
                label="Published"
              />
            ) : null}
            <Input
              label="Title"
              placeholder="CLI Fundamentals"
              error={errors.title?.message}
              {...register('title')}
            />
            <Textarea
              label="Description"
              rows={3}
              maxLength={2000}
              error={errors.description?.message}
              {...register('description')}
            />
            <Controller
              name="estimatedMinutes"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Estimated minutes"
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.estimatedMinutes?.message}
                />
              )}
            />
          </section>

          {detail ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-base font-medium">Items</h3>
              {items.length === 0 ? (
                <p className="text-sm text-muted">No items yet.</p>
              ) : (
                <ReorderList
                  ariaLabel="Module items"
                  items={items}
                  getId={(item) => item.itemId}
                  onReorder={(nextIds) =>
                    // Item slugs follow the position, so the server copy is reloaded either way.
                    reorderItems.mutate(nextIds.map(Number), { onSettled: refetchDetail })
                  }
                  renderItem={(item) => (
                    <div className="flex items-center gap-3 py-1">
                      <Icon name={ITEM_ICON[item.kind]} size={18} className="shrink-0 text-muted" />
                      <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                      {item.slug ? (
                        <span className="shrink-0 font-mono text-xs text-muted">{item.slug}</span>
                      ) : null}
                    </div>
                  )}
                />
              )}
            </section>
          ) : null}

          <FieldError id="module-drawer-error" message={formError} />
        </form>

        {detail && canManage ? (
          <div className="flex flex-col items-start gap-2 pt-2">
            <Button variant="ghost" size="sm" iconName="delete" onClick={() => setDeleteOpen(true)}>
              Delete module
            </Button>
          </div>
        ) : null}
      </fieldset>
    );
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={handleClose}
        title={isEdit ? 'Edit module' : 'New module'}
        dirty={isDirty && canManage}
        busy={saving}
        footer={(requestClose) => (
          <>
            <Button variant="ghost" onClick={requestClose} disabled={saving}>
              Cancel
            </Button>
            {formReady && canManage ? (
              <Button
                type="submit"
                form={FORM_ID}
                isLoading={saving}
                isSuccess={updateModule.isSuccess && !saving}
              >
                {isEdit ? 'Save' : 'Create module'}
              </Button>
            ) : null}
          </>
        )}
      >
        {body}
      </Drawer>
      <DeleteEntityDialog
        open={deleteOpen}
        entityLabel="module"
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteModule.mutateAsync(moduleId);
          handleClose();
        }}
        insteadAction={{
          label: 'Unpublish instead',
          onClick: async () => {
            await setPublished.mutateAsync(false);
          },
        }}
      />
    </>
  );
}

export default ModuleDrawer;
