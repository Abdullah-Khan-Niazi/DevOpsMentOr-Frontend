import { useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { DeleteEntityDialog } from '@/features/curriculum/components/admin/DeleteEntityDialog';
import { LabSpecDrawer } from '@/features/curriculum/components/admin/labSpec/LabSpecDrawer';
import { useCurriculumReferenceData } from '@/features/curriculum/hooks/useAdminCurriculum';
import {
  Button,
  ConfirmDialog,
  Drawer,
  DrawerFormSkeleton,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  Input,
  Modal,
  NumberInput,
  PageHeader,
  SearchInput,
  Select,
  Switch,
  Textarea,
  toast,
} from '@/shared/components';
import { getErrorMessage, getFieldErrors, hasCode } from '@/shared/services/apiError';
import { pluralize, safeHttpUrl } from '@/shared/utils';
import {
  useAdminLabCatalog,
  useAdminLabs,
  useDeleteLab,
  useImportCatalogLab,
  useSetLabActive,
  useUpdateAdminLab,
} from '../hooks/useAdminLabs';
import type { AdminLabDto, CatalogLabDto, UpdateAdminLabPayload } from '../types/admin';
import { AdminLabsPageSkeleton } from './AdminLabsPageSkeleton';

// Staff labs library. Labs are imported from the Labs catalog (no blank create): the
// catalog slug (`CxxMxxL01`) is the image key, so it is shown read-only everywhere.
// The step spec opens in `LabSpecDrawer` from `?drawer=lab-spec:<labId>`.

const LABS_PERMISSION = 'platform.labs.manage';
const LAB_SPEC_DRAWER = /^lab-spec:(\d+)$/;
const EDIT_FORM_ID = 'lab-edit-form';

/** Lab id of `?drawer=lab-spec:<id>`, else null. */
function labSpecIdFromParam(raw: string | null): number | null {
  const match = raw ? LAB_SPEC_DRAWER.exec(raw) : null;
  const id = match ? Number(match[1]) : 0;
  return id > 0 ? id : null;
}

function usePermission(permission: string): boolean {
  return useAuthStore((state) => state.user?.permissions?.includes(permission) ?? false);
}

function isOptionalHttpUrl(value: string): boolean {
  return value === '' || safeHttpUrl(value) !== null;
}

/* ── Metadata drawer ───────────────────────────────────────────────────── */

const labEditSchema = z.object({
  labName: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters.')
    .max(100, 'Use at most 100 characters.'),
  description: z.string().max(5000, 'Use at most 5000 characters.'),
  difficultyId: z.string().min(1, 'Choose a difficulty.'),
  categoryId: z.string(),
  isPremium: z.boolean(),
  estimatedHours: z
    .number({ error: 'Enter a number of hours.' })
    .int('Use whole hours.')
    .min(0, 'Use 0 or more hours.')
    .max(10000, 'Use at most 10000 hours.'),
  networkDiagramUrl: z.string().trim().refine(isOptionalHttpUrl, 'Use an http(s) URL.'),
});

type LabEditValues = z.infer<typeof labEditSchema>;

const EDIT_FIELDS: ReadonlyArray<keyof LabEditValues> = [
  'labName',
  'description',
  'difficultyId',
  'categoryId',
  'isPremium',
  'estimatedHours',
  'networkDiagramUrl',
];

function toEditValues(lab: AdminLabDto): LabEditValues {
  return {
    labName: lab.labName,
    description: lab.description ?? '',
    difficultyId: String(lab.difficultyId),
    categoryId: lab.categoryId === null ? '' : String(lab.categoryId),
    isPremium: lab.isPremium,
    estimatedHours: lab.estimatedHours,
    networkDiagramUrl: lab.networkDiagramUrl ?? '',
  };
}

interface LabEditDrawerProps {
  open: boolean;
  lab: AdminLabDto;
  canManage: boolean;
  onClose: () => void;
}

/** Lab metadata (`updateLabSchema` without flag values or type config). Slug is read-only. */
function LabEditDrawer({ open, lab, canManage, onClose }: LabEditDrawerProps) {
  const references = useCurriculumReferenceData();
  const updateLab = useUpdateAdminLab(lab.labId);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<LabEditValues>({
    resolver: zodResolver(labEditSchema),
    defaultValues: toEditValues(lab),
  });

  const saving = updateLab.isPending;

  // Closing clears the message and restores the saved values for the next open.
  function handleClose() {
    setFormError(null);
    reset(toEditValues(lab));
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const payload: UpdateAdminLabPayload = {
      labName: values.labName,
      description: values.description.trim() === '' ? null : values.description,
      difficultyId: Number(values.difficultyId),
      categoryId: values.categoryId === '' ? null : Number(values.categoryId),
      isPremium: values.isPremium,
      estimatedHours: values.estimatedHours,
      networkDiagramUrl: values.networkDiagramUrl === '' ? null : values.networkDiagramUrl,
    };
    try {
      await updateLab.mutateAsync(payload);
      reset(values);
      onClose();
    } catch (error) {
      const fields = getFieldErrors(error);
      let mapped = false;
      for (const name of EDIT_FIELDS) {
        const message = fields[name];
        if (message) {
          setError(name, { type: 'server', message });
          mapped = true;
        }
      }
      if (!mapped) setFormError(getErrorMessage(error));
    }
  });

  const difficultyOptions = (references.difficulties.data ?? []).map((option) => ({
    value: String(option.difficultyId),
    label: option.name,
  }));
  const categoryOptions = (references.categories.data ?? []).map((option) => ({
    value: String(option.categoryId),
    label: option.name,
  }));

  let body: ReactNode;
  if (references.difficulties.isPending || references.categories.isPending) {
    body = <DrawerFormSkeleton fields={5} />;
  } else if (references.difficulties.isError || references.categories.isError) {
    body = (
      <ErrorState
        error={references.difficulties.error ?? references.categories.error}
        onRetry={() => {
          void references.difficulties.refetch();
          void references.categories.refetch();
        }}
      />
    );
  } else {
    body = (
      <fieldset disabled={!canManage || saving} className="flex min-w-0 flex-col gap-4">
        <form id={EDIT_FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Input label="Lab name" error={errors.labName?.message} {...register('labName')} />
          <Input label="Slug" value={lab.slug} readOnly className="font-mono" />
          <Textarea
            label="Description"
            rows={4}
            maxLength={5000}
            error={errors.description?.message}
            {...register('description')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Difficulty"
              placeholder="Choose a difficulty"
              options={difficultyOptions}
              error={errors.difficultyId?.message}
              {...register('difficultyId')}
            />
            <Select
              label="Category"
              placeholder="No category"
              options={categoryOptions}
              error={errors.categoryId?.message}
              {...register('categoryId')}
            />
          </div>
          <Controller
            name="estimatedHours"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Estimated hours"
                value={field.value}
                onValueChange={field.onChange}
                error={errors.estimatedHours?.message}
              />
            )}
          />
          <Input
            label="Network diagram URL"
            placeholder="https://"
            error={errors.networkDiagramUrl?.message}
            {...register('networkDiagramUrl')}
          />
          <Controller
            name="isPremium"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} label="Premium lab" />
            )}
          />
          {formError ? (
            <p role="alert" className="text-sm text-error">
              {formError}
            </p>
          ) : null}
        </form>
      </fieldset>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Edit lab"
      dirty={isDirty && canManage}
      busy={saving}
      footer={
        canManage
          ? (requestClose) => (
              <>
                <Button variant="ghost" onClick={requestClose} disabled={saving}>
                  Cancel
                </Button>
                {references.difficulties.isSuccess && references.categories.isSuccess ? (
                  <Button type="submit" form={EDIT_FORM_ID} isLoading={saving}>
                    Save changes
                  </Button>
                ) : null}
              </>
            )
          : undefined
      }
    >
      {body}
    </Drawer>
  );
}

/* ── Catalog import drawer ─────────────────────────────────────────────── */

interface CatalogImportDrawerProps {
  open: boolean;
  canManage: boolean;
  onClose: () => void;
}

/** Labs catalog rows (`<slug> <title>`); importing creates or re-imports the lab. */
function CatalogImportDrawer({ open, canManage, onClose }: CatalogImportDrawerProps) {
  const catalog = useAdminLabCatalog(false, open);
  const importLab = useImportCatalogLab();
  const [query, setQuery] = useState('');
  const [reimportTarget, setReimportTarget] = useState<CatalogLabDto | null>(null);

  async function runImport(slug: string) {
    try {
      const result = await importLab.mutateAsync(slug);
      toast.success(result.created ? 'Lab imported.' : 'Lab re-imported.');
    } catch (error) {
      if (hasCode(error, 'CATALOG_LAB_NOT_FOUND')) {
        toast.error('No lab image exists for this slug.');
        void catalog.refetch();
      } else if (hasCode(error, 'CATALOG_UNAVAILABLE')) {
        toast.error('The labs catalog is unavailable.', {
          action: { label: 'Retry', onClick: () => void runImport(slug) },
        });
      } else {
        toast.error(error);
      }
    }
  }

  const needle = query.trim().toLowerCase();
  const entries = (catalog.data ?? []).filter(
    (entry) =>
      needle === '' ||
      entry.slug.toLowerCase().includes(needle) ||
      entry.title.toLowerCase().includes(needle),
  );

  let body: ReactNode;
  if (catalog.isPending) {
    body = <DrawerFormSkeleton fields={3} />;
  } else if (catalog.isError) {
    body = <ErrorState error={catalog.error} onRetry={() => void catalog.refetch()} />;
  } else if ((catalog.data ?? []).length === 0) {
    body = <EmptyState icon="lab" title="The labs catalog is empty" />;
  } else {
    body = (
      <div className="flex min-w-0 flex-col gap-4">
        <SearchInput label="Search catalog" value={query} onValueChange={setQuery} />
        {entries.length === 0 ? (
          <EmptyState icon="lab" title="No catalog labs match" />
        ) : (
          <ul aria-label="Catalog labs" className="flex flex-col gap-1">
            {entries.map((entry) => {
              const pending = importLab.isPending && importLab.variables === entry.slug;
              return (
                <li
                  key={entry.slug}
                  className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-pearl-200"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      <span className="font-mono text-xs text-muted">{entry.slug}</span>{' '}
                      <span className="font-medium">{entry.title}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {entry.difficulty}, {entry.stepCount}{' '}
                      {pluralize(entry.stepCount, 'step', 'steps')}
                    </p>
                  </div>
                  {canManage ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={pending}
                      disabled={importLab.isPending && !pending}
                      onClick={() => {
                        if (entry.importedLabId !== null) setReimportTarget(entry);
                        else void runImport(entry.slug);
                      }}
                    >
                      {entry.importedLabId !== null ? 'Re-import' : 'Import'}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <>
      <Drawer open={open} onClose={onClose} title="Import from catalog" size="lg">
        {body}
      </Drawer>
      <ConfirmDialog
        open={reimportTarget !== null}
        title="Re-import lab?"
        message="Re-importing replaces the steps, hints and checks stored for this lab with the catalog version."
        confirmLabel="Re-import"
        tone="primary"
        onCancel={() => setReimportTarget(null)}
        onConfirm={() => {
          const target = reimportTarget;
          setReimportTarget(null);
          if (target) void runImport(target.slug);
        }}
      />
    </>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export function AdminLabsPage() {
  const labs = useAdminLabs();
  const setActive = useSetLabActive();
  const deleteLab = useDeleteLab();
  const canManage = usePermission(LABS_PERMISSION);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<{ lab: AdminLabDto; key: number } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminLabDto | null>(null);

  // The spec drawer follows the URL; the last lab id is kept so its exit animation plays.
  const specLabId = labSpecIdFromParam(searchParams.get('drawer'));
  const [lastSpecLabId, setLastSpecLabId] = useState(specLabId ?? 0);
  if (specLabId !== null && specLabId !== lastSpecLabId) {
    setLastSpecLabId(specLabId);
  }

  function openSpec(labId: number) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('drawer', `lab-spec:${labId}`);
      return next;
    });
  }

  function closeSpec() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('drawer');
      return next;
    });
  }

  function openEdit(lab: AdminLabDto) {
    setEditing({ lab, key: (editing?.key ?? 0) + 1 });
    setEditOpen(true);
  }

  function setLabActive(lab: AdminLabDto, isActive: boolean) {
    setActive.mutate(
      { labId: lab.labId, isActive },
      {
        onError: (error) => {
          if (hasCode(error, 'LAB_NOT_READY')) {
            toast.error('Save a valid step spec first.', {
              action: { label: 'Edit steps', onClick: () => openSpec(lab.labId) },
            });
          } else if (hasCode(error, 'CATALOG_LAB_NOT_FOUND')) {
            toast.error('No lab image exists for this slug.');
          } else if (hasCode(error, 'CATALOG_UNAVAILABLE')) {
            toast.error('The labs catalog is unavailable.', {
              action: { label: 'Retry', onClick: () => setLabActive(lab, isActive) },
            });
          } else {
            toast.error(error);
          }
        },
      },
    );
  }

  if (labs.isPending) {
    return <AdminLabsPageSkeleton />;
  }

  const allLabs = labs.data ?? [];
  const needle = search.trim().toLowerCase();
  const visibleLabs = allLabs.filter(
    (lab) =>
      needle === '' ||
      lab.labName.toLowerCase().includes(needle) ||
      lab.slug.toLowerCase().includes(needle),
  );

  const importAction = canManage ? (
    <Button variant="primary" size="sm" iconName="upload" onClick={() => setImportOpen(true)}>
      Import from catalog
    </Button>
  ) : null;

  const deleteInUse = deleteTarget !== null && deleteTarget.usage.itemIds.length > 0;

  let content: ReactNode;
  if (labs.isError) {
    content = <ErrorState error={labs.error} onRetry={() => void labs.refetch()} />;
  } else if (allLabs.length === 0) {
    content = (
      <EmptyState
        icon="lab"
        title="No labs imported yet"
        action={
          canManage ? (
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Import from catalog
            </Button>
          ) : undefined
        }
      />
    );
  } else {
    content = (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="max-w-sm">
          <SearchInput label="Search labs" value={search} onValueChange={setSearch} size="sm" />
        </div>
        {visibleLabs.length === 0 ? (
          <EmptyState icon="search" title="No labs match" />
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
              <thead>
                <tr className="font-mono text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Lab</th>
                  <th className="px-3 py-2 font-medium">Difficulty</th>
                  <th className="px-3 py-2 font-medium">Steps</th>
                  <th className="px-3 py-2 font-medium">Readiness</th>
                  <th className="px-3 py-2 font-medium">Usage</th>
                  <th className="px-3 py-2 font-medium">Active</th>
                  <th className="px-3 py-2 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleLabs.map((lab) => {
                  const ready = lab.specStatus === 'v2' && lab.stepCount > 0;
                  const moduleCount = lab.usage.itemIds.length;
                  const switchPending =
                    setActive.isPending && setActive.variables?.labId === lab.labId;
                  return (
                    <tr key={lab.labId} className="transition-colors hover:bg-pearl-100">
                      <td className="px-3 py-2.5">
                        <div className="font-medium">{lab.labName}</div>
                        <div className="font-mono text-xs text-muted">{lab.slug}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                        {lab.difficultyName ?? 'Not set'}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{lab.stepCount}</td>
                      <td className="px-3 py-2.5">
                        <Icon
                          name={ready ? 'check-circle' : 'warning'}
                          size={18}
                          title={ready ? 'Steps configured' : 'Steps not configured'}
                          className={ready ? 'text-success' : 'text-warning'}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                        {moduleCount} {pluralize(moduleCount, 'module', 'modules')}
                      </td>
                      <td className="px-3 py-2.5">
                        <Switch
                          hideLabel
                          label={`Active: ${lab.labName}`}
                          checked={lab.isActive}
                          disabled={!canManage}
                          isLoading={switchPending}
                          onCheckedChange={(next) => setLabActive(lab, next)}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-1">
                            <IconButton
                              icon="edit"
                              label={`Edit ${lab.labName}`}
                              onClick={() => openEdit(lab)}
                            />
                            <IconButton
                              icon="checklist"
                              label={`Edit steps for ${lab.labName}`}
                              onClick={() => openSpec(lab.labId)}
                            />
                            <IconButton
                              icon="delete"
                              tone="danger"
                              label={`Delete ${lab.labName}`}
                              onClick={() => setDeleteTarget(lab)}
                            />
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <PageHeader title="Labs" actions={importAction} />

      {content}

      {editing ? (
        <LabEditDrawer
          key={editing.key}
          open={editOpen}
          lab={editing.lab}
          canManage={canManage}
          onClose={() => setEditOpen(false)}
        />
      ) : null}

      {lastSpecLabId > 0 ? (
        <LabSpecDrawer
          open={specLabId !== null}
          labId={specLabId ?? lastSpecLabId}
          onClose={closeSpec}
        />
      ) : null}

      <CatalogImportDrawer
        open={importOpen}
        canManage={canManage}
        onClose={() => setImportOpen(false)}
      />

      <Modal
        open={deleteInUse}
        onClose={() => setDeleteTarget(null)}
        title="Lab in use"
        size="sm"
        footer={
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Close
          </Button>
        }
      >
        {deleteTarget ? (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              {deleteTarget.labName} is used by {deleteTarget.usage.itemIds.length}{' '}
              {pluralize(deleteTarget.usage.itemIds.length, 'module item', 'module items')}:
            </p>
            <ul className="font-mono text-xs text-muted">
              {deleteTarget.usage.itemIds.map((itemId) => (
                <li key={itemId}>Module item {itemId}</li>
              ))}
            </ul>
            <p>Remove the lab from those module items before deleting it.</p>
          </div>
        ) : null}
      </Modal>

      <DeleteEntityDialog
        open={deleteTarget !== null && !deleteInUse}
        entityLabel="lab"
        onConfirm={async () => {
          if (deleteTarget) await deleteLab.mutateAsync(deleteTarget.labId);
        }}
        onClose={() => setDeleteTarget(null)}
        insteadAction={
          deleteTarget
            ? {
                label: 'Deactivate instead',
                onClick: () =>
                  setActive.mutateAsync({ labId: deleteTarget.labId, isActive: false }),
              }
            : undefined
        }
      />
    </div>
  );
}

export default AdminLabsPage;
