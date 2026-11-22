import { useEffect, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type {
  AdminTrackDetailDto,
  CreateTrackPayload,
  UpdateTrackPayload,
} from '@/features/labs/types/admin';
import {
  Button,
  Drawer,
  DrawerFormSkeleton,
  EmptyState,
  ErrorState,
  FieldError,
  Icon,
  IconButton,
  Input,
  Select,
  Switch,
  Textarea,
  toast,
} from '@/shared/components';
import {
  getErrorMessage,
  getFieldErrors,
  getStatusCode,
  hasCode,
} from '@/shared/services/apiError';
import { ReorderList } from '../ReorderList';
import { useCurriculumReferenceData } from '../../../hooks/useAdminCurriculum';
import {
  useAdminTrack,
  useAdminTracks,
  useCreateTrack,
  useDetachCourse,
  useReorderTrackCourses,
  useSetCourseRequired,
  useUpdateTrack,
} from '../../../hooks/useAdminTracks';

// Track create (only while no track exists) and edit. Edit also manages the track's
// courses: Required per course, reorder (exact full set) and detach.

const MANAGE_PERMISSION = 'platform.curriculum.manage';
const FORM_ID = 'track-drawer-form';

const trackSchema = z.object({
  trackName: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters.')
    .max(100, 'Use at most 100 characters.'),
  slug: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters.')
    .max(100, 'Use at most 100 characters.')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes only.'),
  description: z.string().max(5000, 'Use at most 5000 characters.'),
  difficultyId: z.string().min(1, 'Choose a difficulty.'),
  categoryId: z.string(),
  isPremium: z.boolean(),
  isActive: z.boolean(),
});

type TrackFormValues = z.infer<typeof trackSchema>;

const EMPTY_VALUES: TrackFormValues = {
  trackName: '',
  slug: '',
  description: '',
  difficultyId: '',
  categoryId: '',
  isPremium: false,
  isActive: true,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toFormValues(track: AdminTrackDetailDto): TrackFormValues {
  return {
    trackName: track.trackName,
    slug: track.slug,
    description: track.description ?? '',
    difficultyId: String(track.difficultyId),
    categoryId: track.categoryId === null ? '' : String(track.categoryId),
    isPremium: track.isPremium,
    isActive: track.isActive,
  };
}

export interface TrackDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  /** Track id in edit mode. */
  id: number | null;
  parentId?: number;
  onClose: () => void;
  /** Called with the new track id; without it the drawer closes after a create. */
  onCreated?: (id: number) => void;
}

export function TrackDrawer({ open, mode, id, onClose, onCreated }: TrackDrawerProps) {
  const isEdit = mode === 'edit' && id !== null;
  const trackId = id ?? 0;
  const canManage = useAuthStore(
    (state) => state.user?.permissions?.includes(MANAGE_PERMISSION) ?? false,
  );

  const trackQuery = useAdminTrack(trackId, open && isEdit);
  const trackList = useAdminTracks();
  const references = useCurriculumReferenceData();
  const createTrack = useCreateTrack();
  const updateTrack = useUpdateTrack(trackId);
  const reorderCourses = useReorderTrackCourses(trackId);
  const setCourseRequired = useSetCourseRequired(trackId);
  const detachCourse = useDetachCourse(trackId);

  const track = isEdit ? trackQuery.data : undefined;
  const loadedKey = track ? track.trackId : null;
  // Slug follows the name until the admin edits the slug itself (create only).
  const [slugEdited, setSlugEdited] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<TrackFormValues>({
    resolver: zodResolver(trackSchema),
    defaultValues: EMPTY_VALUES,
  });

  // Each open starts from the stored track (edit) or empty values (create).
  useEffect(() => {
    if (!open) return;
    reset(track ? toFormValues(track) : EMPTY_VALUES);
    // `track` is read once per loaded id; later refetches must not clobber edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, loadedKey, reset]);

  const saving = createTrack.isPending || updateTrack.isPending;

  // Closing clears the drawer's transient state; the next open reloads the form.
  function handleClose() {
    setFormError(null);
    setSlugEdited(false);
    onClose();
  }
  const refetchTrack = () => void trackQuery.refetch();
  const notFound = isEdit && trackQuery.isError && getStatusCode(trackQuery.error) === 404;

  async function reportSaveError(error: unknown) {
    if (hasCode(error, 'SINGLE_TRACK_ONLY')) {
      // The platform has one track: switch to editing the existing one.
      const existing = (await trackList.refetch()).data?.[0];
      if (existing && onCreated) {
        toast.info(getErrorMessage(error));
        setSlugEdited(false);
        onCreated(existing.trackId);
        return;
      }
      setFormError(getErrorMessage(error));
      return;
    }
    if (hasCode(error, 'SLUG_TAKEN')) {
      setError('slug', { type: 'server', message: 'This slug is already used.' });
      return;
    }
    const fields = Object.entries(getFieldErrors(error));
    if (fields.length === 0) {
      setFormError(getErrorMessage(error));
      return;
    }
    for (const [path, message] of fields) {
      setError(path as keyof TrackFormValues, { type: 'server', message });
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const description = values.description.trim() || null;
    const categoryId = values.categoryId ? Number(values.categoryId) : null;
    try {
      if (isEdit) {
        const payload: UpdateTrackPayload = {
          trackName: values.trackName,
          slug: values.slug,
          description,
          difficultyId: Number(values.difficultyId),
          categoryId,
          isPremium: values.isPremium,
          isActive: values.isActive,
        };
        await updateTrack.mutateAsync(payload);
        reset(values);
        return;
      }
      const payload: CreateTrackPayload = {
        trackName: values.trackName,
        slug: values.slug,
        description: description ?? undefined,
        difficultyId: Number(values.difficultyId),
        categoryId: categoryId ?? undefined,
        isPremium: values.isPremium,
      };
      const created = await createTrack.mutateAsync(payload);
      if (onCreated) onCreated(created.trackId);
      else handleClose();
    } catch (error) {
      await reportSaveError(error);
    }
  });

  let body: ReactNode;
  let formReady = false;
  if (isEdit && trackQuery.isPending) {
    body = <DrawerFormSkeleton fields={5} />;
  } else if (notFound) {
    body = (
      <EmptyState
        title="This item no longer exists"
        icon="track"
        action={
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Close
          </Button>
        }
      />
    );
  } else if (isEdit && trackQuery.isError) {
    body = <ErrorState error={trackQuery.error} onRetry={refetchTrack} />;
  } else if (references.difficulties.isPending || references.categories.isPending) {
    body = <DrawerFormSkeleton fields={4} />;
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
    formReady = true;
    const difficultyOptions = (references.difficulties.data ?? []).map((option) => ({
      value: String(option.difficultyId),
      label: option.name,
    }));
    const categoryOptions = (references.categories.data ?? []).map((option) => ({
      value: String(option.categoryId),
      label: option.name,
    }));

    body = (
      <fieldset disabled={!canManage || saving} className="flex min-w-0 flex-col gap-6">
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <section className="flex flex-col gap-4">
            <h3 className="text-base font-medium">Details</h3>
            <Input
              label="Name"
              placeholder="End-to-End DevOps Engineering"
              error={errors.trackName?.message}
              {...register('trackName', {
                onChange: (event) => {
                  if (!isEdit && !slugEdited) {
                    setValue('slug', slugify(event.target.value), { shouldDirty: true });
                  }
                },
              })}
            />
            <Input
              label="Slug"
              placeholder="devops-engineering-track"
              error={errors.slug?.message}
              {...register('slug', {
                onChange: () => setSlugEdited(true),
              })}
            />
            <Textarea
              label="Description"
              rows={3}
              maxLength={5000}
              error={errors.description?.message}
              {...register('description')}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Difficulty"
                required
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
            <div className="flex flex-wrap items-center gap-6">
              <Controller
                name="isPremium"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} label="Premium" />
                )}
              />
              {isEdit ? (
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      label="Published"
                    />
                  )}
                />
              ) : null}
            </div>
            {track ? (
              <p className="inline-flex items-center gap-2 text-sm text-muted">
                <Icon name="lab" size={16} />
                <span>{track.totalLabs} labs in this track</span>
              </p>
            ) : null}
          </section>

          {track ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-base font-medium">Courses</h3>
              {track.content.length === 0 ? (
                <p className="text-sm text-muted">No courses attached yet.</p>
              ) : (
                <ReorderList
                  ariaLabel="Track courses"
                  items={track.content}
                  getId={(row) => row.courseId}
                  onReorder={(nextIds) =>
                    reorderCourses.mutate(nextIds.map(Number), { onError: refetchTrack })
                  }
                  renderItem={(row) => (
                    <div className="flex items-center gap-3 py-1">
                      <span className="min-w-0 flex-1 truncate text-sm">{row.title}</span>
                      <Switch
                        size="sm"
                        label="Required"
                        checked={row.required}
                        onCheckedChange={(next) =>
                          setCourseRequired.mutate(
                            { courseId: row.courseId, required: next },
                            { onError: refetchTrack },
                          )
                        }
                      />
                      <IconButton
                        icon="delete"
                        label="Detach course"
                        size="sm"
                        tone="danger"
                        onClick={() => detachCourse.mutate(row.courseId, { onError: refetchTrack })}
                      />
                    </div>
                  )}
                />
              )}
            </section>
          ) : null}

          <FieldError id="track-drawer-error" message={formError} />
        </form>
      </fieldset>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit track' : 'New track'}
      size="lg"
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
              isSuccess={updateTrack.isSuccess && !saving}
            >
              {isEdit ? 'Save' : 'Create track'}
            </Button>
          ) : null}
        </>
      )}
    >
      {body}
    </Drawer>
  );
}

export default TrackDrawer;
