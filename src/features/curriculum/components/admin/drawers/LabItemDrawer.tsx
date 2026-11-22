import { useEffect, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
  SearchInput,
  TabSwitcher,
  toast,
  type TabSwitcherItem,
} from '@/shared/components';
import {
  getErrorMessage,
  getFieldErrors,
  getStatusCode,
  hasCode,
} from '@/shared/services/apiError';
import { cn } from '@/shared/utils';
import {
  useAdminLesson,
  useAdminModule,
  useCreateItem,
  useUpdateItemTitle,
} from '../../../hooks/useAdminCurriculum';
import type { AdminModuleItemLabDto } from '../../../types/admin';
import {
  useAdminLabCatalog,
  useAdminLabs,
  useImportCatalogLab,
} from '@/features/labs/hooks/useAdminLabs';
import type { AdminLabDto, CatalogLabDto } from '@/features/labs/types/admin';

// Lab item create and edit. Create picks a lab from the Labs library, or imports one
// from the Labs catalog first (`POST /admin/labs/import` through
// `adminLabsService.importFromCatalog`). Edit changes the item title only
// (`PATCH /admin/curriculum/items/:itemId`); steps are edited in the lab spec drawer.

const MANAGE_PERMISSION = 'platform.curriculum.manage';
const LABS_PERMISSION = 'platform.labs.manage';
const FORM_ID = 'lab-item-drawer-form';

type LabFilter = 'ready' | 'all';

const FILTER_ITEMS: ReadonlyArray<TabSwitcherItem<LabFilter>> = [
  { id: 'ready', label: 'Ready' },
  { id: 'all', label: 'All' },
];

const titleRule = z
  .string()
  .trim()
  .min(3, 'Use at least 3 characters.')
  .max(255, 'Use at most 255 characters.');

const createSchema = z.object({
  labId: z.number().int().min(1, 'Choose a lab to add.'),
  /** Empty keeps the lab name as the item title. */
  title: z.union([z.literal(''), titleRule]),
});

const editSchema = z.object({ title: titleRule });

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

const CREATE_EMPTY: CreateValues = { labId: 0, title: '' };

/** A lab can be published in a module once its spec is v2 and the lab is active. */
function isLabReady(lab: Pick<AdminLabDto, 'specStatus' | 'isActive'>): boolean {
  return lab.specStatus === 'v2' && lab.isActive;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function usePermission(permission: string): boolean {
  return useAuthStore((state) => state.user?.permissions?.includes(permission) ?? false);
}

function LabReadiness({ lab }: { lab: Pick<AdminLabDto, 'specStatus' | 'isActive'> }) {
  const ready = isLabReady(lab);
  const reason = ready
    ? 'Ready'
    : lab.specStatus !== 'v2'
      ? 'Steps not configured'
      : 'Lab is inactive';
  return (
    <span className="has-tooltip inline-flex shrink-0" data-tooltip={reason}>
      <Icon
        name={ready ? 'check-circle' : 'warning'}
        size={18}
        title={reason}
        className={ready ? 'text-success' : 'text-warning'}
      />
    </span>
  );
}

export interface LabItemDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  /** Lab item (lesson row) id in edit mode. */
  id: number | null;
  /** Module id in create mode (the item is appended to it). */
  parentId?: number;
  onClose: () => void;
  /** Called with the new item id; without it the drawer closes after a create. */
  onCreated?: (id: number) => void;
  /** Opens the lab spec drawer (steps, hints, checks) for the lab. */
  onOpenLabSpec?: (labId: number) => void;
}

export function LabItemDrawer(props: LabItemDrawerProps) {
  return props.mode === 'edit' && props.id !== null ? (
    <EditLabItemDrawer {...props} itemId={props.id} />
  ) : (
    <CreateLabItemDrawer {...props} />
  );
}

/* ── Create ────────────────────────────────────────────────────────────── */

function CreateLabItemDrawer({ open, parentId, onClose, onCreated }: LabItemDrawerProps) {
  const moduleId = parentId ?? 0;
  const canManage = usePermission(MANAGE_PERMISSION);
  const canManageLabs = usePermission(LABS_PERMISSION);

  const labsQuery = useAdminLabs();
  const catalogQuery = useAdminLabCatalog(true, open && canManageLabs);
  const importLab = useImportCatalogLab();
  const createItem = useCreateItem(moduleId);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LabFilter>('ready');
  const [formError, setFormError] = useState<string | null>(null);
  const [importFailure, setImportFailure] = useState<{ slug: string; error: unknown } | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: CREATE_EMPTY,
  });
  const selectedLabId = useWatch({ control, name: 'labId' });

  const saving = createItem.isPending;

  function handleClose() {
    setSearch('');
    setFilter('ready');
    setFormError(null);
    setImportFailure(null);
    reset(CREATE_EMPTY);
    onClose();
  }

  function selectLab(labId: number) {
    setValue('labId', labId, { shouldDirty: true, shouldValidate: true });
  }

  async function handleImport(slug: string) {
    setImportFailure(null);
    try {
      const result = await importLab.mutateAsync(slug);
      toast.success(result.created ? 'Lab imported.' : 'Lab updated from the catalog.');
      // Imported labs start inactive, so they only show under All.
      setFilter('all');
      selectLab(result.lab.labId);
    } catch (error) {
      if (hasCode(error, 'CATALOG_LAB_NOT_FOUND')) {
        toast.error(error);
        void catalogQuery.refetch();
      } else if (hasCode(error, 'CATALOG_UNAVAILABLE')) {
        setImportFailure({ slug, error });
      } else {
        toast.error(error);
      }
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const created = await createItem.mutateAsync({
        kind: 'lab',
        labId: values.labId,
        title: values.title || undefined,
      });
      toast.success('Lab added.');
      if (onCreated) onCreated(created.itemId);
      else handleClose();
    } catch (error) {
      const fields = getFieldErrors(error);
      if (fields.title) setError('title', { type: 'server', message: fields.title });
      else if (fields.labId) setError('labId', { type: 'server', message: fields.labId });
      else setFormError(getErrorMessage(error));
    }
  });

  const labs = labsQuery.data ?? [];
  const query = search.trim().toLowerCase();
  const visibleLabs = labs.filter(
    (lab) =>
      (filter === 'all' || isLabReady(lab) || lab.labId === selectedLabId) &&
      (query === '' ||
        lab.slug.toLowerCase().includes(query) ||
        lab.labName.toLowerCase().includes(query)),
  );

  let body: ReactNode;
  let formReady = false;
  if (moduleId === 0) {
    body = <ErrorState message="Open the lab from its module." />;
  } else if (labsQuery.isPending) {
    body = <DrawerFormSkeleton fields={4} />;
  } else if (labsQuery.isError) {
    body = (
      <ErrorState
        error={labsQuery.error}
        onRetry={() => void labsQuery.refetch()}
        retrying={labsQuery.isFetching}
      />
    );
  } else {
    formReady = true;
    let labList: ReactNode;
    if (labs.length === 0) {
      labList = <EmptyState title="No labs in the library yet" icon="lab" />;
    } else if (visibleLabs.length === 0) {
      labList = <EmptyState title={query ? 'No labs match' : 'No ready labs'} icon="lab" />;
    } else {
      labList = (
        <ul aria-label="Labs" className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {visibleLabs.map((lab) => {
            const selected = lab.labId === selectedLabId;
            return (
              <li key={lab.labId}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectLab(lab.labId)}
                  className={cn(
                    'flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-2 text-left transition-colors focus-visible:outline-none',
                    selected ? 'bg-pearl-200' : 'hover:bg-pearl-200 focus-visible:bg-pearl-200',
                  )}
                >
                  <Icon name="lab" size={18} selected={selected} className="shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                      <span className="font-mono text-sm text-muted">{lab.slug}</span>
                      <span className="min-w-0 truncate text-sm font-medium">{lab.labName}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                      {lab.difficultyName ? <span>{lab.difficultyName}</span> : null}
                      <span>{plural(lab.stepCount, 'step')}</span>
                      <span>{`Used in ${plural(lab.usage.itemIds.length, 'module')}`}</span>
                    </span>
                  </span>
                  <LabReadiness lab={lab} />
                </button>
              </li>
            );
          })}
        </ul>
      );
    }

    body = (
      <fieldset disabled={!canManage || saving} className="flex min-w-0 flex-col gap-6">
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                label="Search labs"
                value={search}
                onValueChange={setSearch}
                className="min-w-0 flex-1"
              />
              <TabSwitcher
                size="sm"
                items={FILTER_ITEMS}
                value={filter}
                onChange={setFilter}
                ariaLabel="Lab filter"
              />
            </div>
            {labList}
            <FieldError id="lab-item-lab-error" message={errors.labId?.message} />
          </section>

          <Input
            label="Title"
            placeholder="Lab name"
            error={errors.title?.message}
            {...register('title')}
          />
          <FieldError id="lab-item-drawer-error" message={formError} />
        </form>

        {canManageLabs ? (
          <section className="flex flex-col gap-3">
            <h3 className="text-base font-medium">Import from catalog</h3>
            {catalogQuery.isPending ? (
              <DrawerFormSkeleton fields={2} />
            ) : catalogQuery.isError ? (
              <ErrorState
                compact
                error={catalogQuery.error}
                onRetry={() => void catalogQuery.refetch()}
                retrying={catalogQuery.isFetching}
              />
            ) : (
              <CatalogList
                labs={catalogQuery.data}
                importingSlug={importLab.isPending ? importLab.variables : undefined}
                onImport={(slug) => void handleImport(slug)}
              />
            )}
            {importFailure ? (
              <ErrorState
                compact
                error={importFailure.error}
                onRetry={() => void handleImport(importFailure.slug)}
                retrying={importLab.isPending}
              />
            ) : null}
          </section>
        ) : null}
      </fieldset>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Add lab"
      size="lg"
      dirty={isDirty && canManage}
      busy={saving || importLab.isPending}
      footer={(requestClose) => (
        <>
          <Button variant="ghost" onClick={requestClose} disabled={saving}>
            Cancel
          </Button>
          {formReady && canManage ? (
            <Button type="submit" form={FORM_ID} isLoading={saving} disabled={importLab.isPending}>
              Add lab
            </Button>
          ) : null}
        </>
      )}
    >
      {body}
    </Drawer>
  );
}

interface CatalogListProps {
  labs: CatalogLabDto[];
  importingSlug: string | undefined;
  onImport: (slug: string) => void;
}

function CatalogList({ labs, importingSlug, onImport }: CatalogListProps) {
  if (labs.length === 0) {
    return <EmptyState title="Every catalog lab is imported" icon="lab" />;
  }
  return (
    <ul aria-label="Catalog labs" className="flex flex-col gap-1">
      {labs.map((lab) => (
        <li key={lab.slug} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="min-w-0 truncate text-sm">
              <span className="font-mono text-muted">{lab.slug}</span> <span>{lab.title}</span>
            </span>
            <span className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
              <span>{lab.difficulty}</span>
              <span>{plural(lab.stepCount, 'step')}</span>
            </span>
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            iconName="download"
            isLoading={importingSlug === lab.slug}
            disabled={importingSlug !== undefined}
            onClick={() => onImport(lab.slug)}
          >
            Import
          </Button>
        </li>
      ))}
    </ul>
  );
}

/* ── Edit ──────────────────────────────────────────────────────────────── */

function EditLabItemDrawer({
  open,
  itemId,
  parentId,
  onClose,
  onOpenLabSpec,
}: LabItemDrawerProps & { itemId: number }) {
  const canManage = usePermission(MANAGE_PERMISSION);
  const canManageLabs = usePermission(LABS_PERMISSION);

  // The URL carries only the item id; the lesson row names its module.
  const lessonQuery = useAdminLesson(itemId, open && parentId === undefined);
  const moduleId = parentId ?? lessonQuery.data?.moduleId ?? 0;
  const moduleQuery = useAdminModule(moduleId, open && moduleId > 0);
  const item = moduleQuery.data?.items.find((existing) => existing.itemId === itemId);
  const lab: AdminModuleItemLabDto | null = item?.lab ?? null;

  const updateTitle = useUpdateItemTitle(moduleId);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { title: '' },
  });

  const loadedKey = item ? item.itemId : null;
  useEffect(() => {
    if (!open || !item) return;
    reset({ title: item.title });
    // Refetches of the module must not clobber an unsaved title, so `item` is read once per id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loadedKey, reset]);

  const saving = updateTitle.isPending;

  function handleClose() {
    setFormError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await updateTitle.mutateAsync({ itemId, title: values.title });
      reset(values);
    } catch (error) {
      const fields = getFieldErrors(error);
      if (fields.title) setError('title', { type: 'server', message: fields.title });
      else setFormError(getErrorMessage(error));
    }
  });

  const lessonMissing =
    parentId === undefined && lessonQuery.isError && getStatusCode(lessonQuery.error) === 404;
  const moduleMissing = moduleQuery.isError && getStatusCode(moduleQuery.error) === 404;
  const loadError = parentId === undefined && lessonQuery.isError ? lessonQuery : moduleQuery;

  let body: ReactNode;
  let formReady = false;
  if (lessonMissing || moduleMissing || (moduleQuery.isSuccess && (!item || !lab))) {
    body = (
      <EmptyState
        title="This item no longer exists"
        icon="lab"
        action={
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Close
          </Button>
        }
      />
    );
  } else if (loadError.isError) {
    body = (
      <ErrorState
        error={loadError.error}
        onRetry={() => void loadError.refetch()}
        retrying={loadError.isFetching}
      />
    );
  } else if (!item || !lab) {
    body = <DrawerFormSkeleton fields={3} />;
  } else {
    formReady = true;
    body = (
      <fieldset disabled={!canManage || saving} className="flex min-w-0 flex-col gap-6">
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <FieldError id="lab-item-drawer-error" message={formError} />
        </form>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className="input-label">Lab</dt>
            <dd className="flex min-w-0 items-center gap-2 text-sm">
              <span className="font-mono text-muted">{lab.slug}</span>
              <span className="min-w-0 truncate">{lab.labName}</span>
              <LabReadiness lab={lab} />
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="input-label">Item</dt>
            <dd className="font-mono text-sm text-muted">{item.slug ?? 'Not assigned'}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="input-label">Difficulty</dt>
            <dd className="text-sm">{lab.difficultyName ?? 'None'}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="input-label">Steps</dt>
            <dd className="text-sm">{lab.stepCount}</dd>
          </div>
        </dl>

        {canManageLabs && onOpenLabSpec ? (
          <div>
            <Button
              type="button"
              variant="secondary"
              iconName="checklist"
              onClick={() => onOpenLabSpec(lab.labId)}
            >
              Edit steps
            </Button>
          </div>
        ) : null}
      </fieldset>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Edit lab item"
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
              isSuccess={updateTitle.isSuccess && !saving}
            >
              Save
            </Button>
          ) : null}
        </>
      )}
    >
      {body}
    </Drawer>
  );
}

export default LabItemDrawer;
