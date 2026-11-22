import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
  Select,
  Switch,
  Textarea,
} from '@/shared/components';
import {
  getErrorMessage,
  getFieldErrors,
  getStatusCode,
  hasCode,
} from '@/shared/services/apiError';
import { StringListField } from '../fields/StringListField';
import { DeleteEntityDialog } from '../DeleteEntityDialog';
import { ReorderList } from '../ReorderList';
import {
  useAdminCourse,
  useAdminCourses,
  useCreateCourse,
  useCurriculumReferenceData,
  useDeleteCourse,
  useReorderModules,
  useSetCoursePublished,
  useUpdateCourse,
} from '../../../hooks/useAdminCurriculum';
import type {
  AdminCourseDetailDto,
  CreateCoursePayload,
  UpdateCoursePayload,
} from '../../../types/admin';

// Course create and edit. Course codes are `C01`..`C99`: create prefills the lowest unused
// code (never derived from the title); edit keeps the stored code. Edit also manages the
// course's module order, publish state and delete (archive instead when it has learner data).

const MANAGE_PERMISSION = 'platform.curriculum.manage';
const FORM_ID = 'course-drawer-form';
const COURSE_CODE_PATTERN = /^C\d{2}$/;
const MAX_LIST_ITEMS = 50;

const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters.')
    .max(255, 'Use at most 255 characters.'),
  slug: z.string().regex(COURSE_CODE_PATTERN, 'Use C followed by two digits, for example C01.'),
  description: z.string().max(2000, 'Use at most 2000 characters.'),
  difficultyId: z.string().min(1, 'Choose a difficulty.'),
  categoryId: z.string(),
  estimatedHours: z
    .number({ error: 'Enter a number of hours.' })
    .int('Use whole hours.')
    .min(0, 'Use 0 or more hours.')
    .max(10000, 'Use at most 10000 hours.'),
  isPremium: z.boolean(),
  coverImageUrl: z.string().trim().refine(isOptionalHttpUrl, 'Use an http(s) URL.'),
  videoTrailerUrl: z.string().trim().refine(isOptionalHttpUrl, 'Use an http(s) URL.'),
  prerequisites: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Enter text or remove this row.')
        .max(500, 'Use at most 500 characters.'),
    )
    .max(MAX_LIST_ITEMS, `Use at most ${MAX_LIST_ITEMS} items.`),
  learningObjectives: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Enter text or remove this row.')
        .max(500, 'Use at most 500 characters.'),
    )
    .max(MAX_LIST_ITEMS, `Use at most ${MAX_LIST_ITEMS} items.`),
});

type CourseFormValues = z.infer<typeof courseSchema>;

function isOptionalHttpUrl(value: string): boolean {
  if (value === '') return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const EMPTY_VALUES: CourseFormValues = {
  title: '',
  slug: '',
  description: '',
  difficultyId: '',
  categoryId: '',
  estimatedHours: 0,
  isPremium: false,
  coverImageUrl: '',
  videoTrailerUrl: '',
  prerequisites: [],
  learningObjectives: [],
};

/** Lowest unused `C01`..`C99` code, or null when all 99 are taken. */
function nextCourseCode(usedCodes: ReadonlyArray<string>): string | null {
  const used = new Set(usedCodes);
  for (let number = 1; number <= 99; number += 1) {
    const code = `C${String(number).padStart(2, '0')}`;
    if (!used.has(code)) return code;
  }
  return null;
}

function toFormValues(detail: AdminCourseDetailDto): CourseFormValues {
  const { course } = detail;
  return {
    title: course.title,
    slug: course.slug,
    description: course.description ?? '',
    difficultyId: String(course.difficultyId),
    categoryId: course.categoryId === null ? '' : String(course.categoryId),
    estimatedHours: course.estimatedHours,
    isPremium: course.isPremium ?? false,
    coverImageUrl: course.coverImageUrl ?? '',
    videoTrailerUrl: course.videoTrailerUrl ?? '',
    prerequisites: course.prerequisites ?? [],
    learningObjectives: course.learningObjectives ?? [],
  };
}

/** Per-row messages of a string array field (RHF keys row errors by index). */
function rowMessages(entry: unknown, count: number): Array<string | undefined> {
  const rows = entry as ArrayLike<{ message?: string } | undefined> | undefined;
  return Array.from({ length: count }, (_, index) => rows?.[index]?.message);
}

function toList(values: string[]): string[] | null {
  return values.length > 0 ? values : null;
}

export interface CourseDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  /** Course id in edit mode. */
  id: number | null;
  parentId?: number;
  onClose: () => void;
  /** Called with the new course id; without it the drawer closes after a create. */
  onCreated?: (id: number) => void;
}

export function CourseDrawer({ open, mode, id, onClose, onCreated }: CourseDrawerProps) {
  const isEdit = mode === 'edit' && id !== null;
  const courseId = id ?? 0;
  const canManage = useAuthStore(
    (state) => state.user?.permissions?.includes(MANAGE_PERMISSION) ?? false,
  );

  const detailQuery = useAdminCourse(courseId, open && isEdit);
  const courseList = useAdminCourses();
  const references = useCurriculumReferenceData();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse(courseId);
  const reorderModules = useReorderModules(courseId);
  const deleteCourse = useDeleteCourse();

  const [formError, setFormError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const setPublished = useSetCoursePublished(
    courseId,
    {},
    {
      errorMessage: false,
      onError: (error) => {
        setPublishError(
          hasCode(error, 'COURSE_EMPTY')
            ? 'Publish at least one module first.'
            : getErrorMessage(error),
        );
      },
    },
  );

  const detail = isEdit ? detailQuery.data : undefined;
  const loadedKey = detail ? detail.course.courseId : null;
  // Create prefills the lowest unused course code once the course list has loaded.
  const suggestedCode = useMemo(
    () =>
      isEdit || !courseList.data
        ? ''
        : (nextCourseCode(courseList.data.map((course) => course.slug)) ?? ''),
    [isEdit, courseList.data],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: EMPTY_VALUES,
  });

  // Each open starts from the stored course (edit) or the suggested code (create).
  useEffect(() => {
    if (!open) return;
    reset(detail ? toFormValues(detail) : { ...EMPTY_VALUES, slug: suggestedCode });
    // Refetches of the same course must not clobber unsaved edits, so `detail` is read once per id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, loadedKey, suggestedCode, reset]);

  const saving = createCourse.isPending || updateCourse.isPending;

  // Closing clears the drawer's transient messages; the next open reloads the form.
  function handleClose() {
    setFormError(null);
    setPublishError(null);
    setDeleteOpen(false);
    onClose();
  }
  const refetchDetail = () => void detailQuery.refetch();
  const notFound = isEdit && detailQuery.isError && getStatusCode(detailQuery.error) === 404;

  function reportSaveError(error: unknown) {
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
      const root = path.split('.')[0];
      if (root in EMPTY_VALUES) {
        setError(root as keyof CourseFormValues, { type: 'server', message });
      } else {
        setFormError(message);
      }
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const description = values.description.trim() || null;
    const difficultyId = Number(values.difficultyId);
    const categoryId = values.categoryId ? Number(values.categoryId) : null;
    const coverImageUrl = values.coverImageUrl || null;
    const videoTrailerUrl = values.videoTrailerUrl || null;
    try {
      if (isEdit) {
        const payload: UpdateCoursePayload = {
          title: values.title,
          slug: values.slug,
          description,
          difficultyId,
          categoryId,
          coverImageUrl,
          videoTrailerUrl,
          estimatedHours: values.estimatedHours,
          isPremium: values.isPremium,
          prerequisites: toList(values.prerequisites),
          learningObjectives: toList(values.learningObjectives),
        };
        await updateCourse.mutateAsync(payload);
        reset(values);
        return;
      }
      const payload: CreateCoursePayload = {
        title: values.title,
        slug: values.slug,
        description,
        difficultyId,
        categoryId,
        estimatedHours: values.estimatedHours,
        isPremium: values.isPremium,
      };
      const created = await createCourse.mutateAsync(payload);
      if (onCreated) onCreated(created.courseId);
      else handleClose();
    } catch (error) {
      reportSaveError(error);
    }
  });

  let body: ReactNode;
  let formReady = false;
  if (isEdit && detailQuery.isPending) {
    body = <DrawerFormSkeleton fields={6} />;
  } else if (notFound) {
    body = (
      <EmptyState
        title="This item no longer exists"
        icon="course"
        action={
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Close
          </Button>
        }
      />
    );
  } else if (isEdit && detailQuery.isError) {
    body = <ErrorState error={detailQuery.error} onRetry={refetchDetail} />;
  } else if (!isEdit && courseList.isPending) {
    body = <DrawerFormSkeleton fields={6} />;
  } else if (!isEdit && courseList.isError) {
    body = <ErrorState error={courseList.error} onRetry={() => void courseList.refetch()} />;
  } else if (references.difficulties.isPending || references.categories.isPending) {
    body = <DrawerFormSkeleton fields={6} />;
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
    const modules = detail?.modules ?? [];

    body = (
      <fieldset disabled={!canManage || saving} className="flex min-w-0 flex-col gap-6">
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <section className="flex flex-col gap-4">
            <h3 className="text-base font-medium">Details</h3>
            {detail ? (
              <div className="flex flex-col gap-1">
                <Switch
                  checked={
                    setPublished.isPending ? !detail.course.isPublished : detail.course.isPublished
                  }
                  isLoading={setPublished.isPending}
                  onCheckedChange={(next) => {
                    setPublishError(null);
                    setPublished.mutate(next);
                  }}
                  label="Published"
                />
                <FieldError id="course-publish-error" message={publishError} />
              </div>
            ) : null}
            <Controller
              name="isPremium"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} label="Premium" />
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Title"
                placeholder="Operating System & Linux Basics"
                error={errors.title?.message}
                {...register('title')}
              />
              <Input
                label="Code"
                placeholder="C01"
                className="font-mono"
                autoComplete="off"
                error={errors.slug?.message}
                {...register('slug')}
              />
            </div>
            <Textarea
              label="Description"
              rows={3}
              maxLength={2000}
              error={errors.description?.message}
              {...register('description')}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            </div>
          </section>

          {detail ? (
            <section className="flex flex-col gap-4">
              <h3 className="text-base font-medium">Media</h3>
              <Input
                label="Cover image URL"
                type="url"
                placeholder="https://"
                error={errors.coverImageUrl?.message}
                {...register('coverImageUrl')}
              />
              <Input
                label="Trailer video URL"
                type="url"
                placeholder="https://"
                error={errors.videoTrailerUrl?.message}
                {...register('videoTrailerUrl')}
              />
            </section>
          ) : null}

          {detail ? (
            <section className="flex flex-col gap-4">
              <h3 className="text-base font-medium">Learning</h3>
              <Controller
                name="prerequisites"
                control={control}
                render={({ field }) => (
                  <StringListField
                    label="Prerequisites"
                    values={field.value}
                    onChange={field.onChange}
                    maxItems={MAX_LIST_ITEMS}
                    maxLength={500}
                    addLabel="Add prerequisite"
                    errors={rowMessages(errors.prerequisites, field.value.length)}
                    error={errors.prerequisites?.message}
                  />
                )}
              />
              <Controller
                name="learningObjectives"
                control={control}
                render={({ field }) => (
                  <StringListField
                    label="Learning objectives"
                    values={field.value}
                    onChange={field.onChange}
                    maxItems={MAX_LIST_ITEMS}
                    maxLength={500}
                    addLabel="Add objective"
                    errors={rowMessages(errors.learningObjectives, field.value.length)}
                    error={errors.learningObjectives?.message}
                  />
                )}
              />
            </section>
          ) : null}

          {detail ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-base font-medium">Modules</h3>
              {modules.length === 0 ? (
                <p className="text-sm text-muted">No modules yet.</p>
              ) : (
                <ReorderList
                  ariaLabel="Course modules"
                  items={modules}
                  getId={(module) => module.moduleId}
                  onReorder={(nextIds) =>
                    reorderModules.mutate(nextIds.map(Number), { onError: refetchDetail })
                  }
                  renderItem={(module) => (
                    <div className="flex items-center gap-3 py-1">
                      <Icon name="module" size={18} className="shrink-0 text-muted" />
                      <span className="min-w-0 flex-1 truncate text-sm">{module.title}</span>
                      <span className="shrink-0 font-mono text-xs text-muted">{module.slug}</span>
                    </div>
                  )}
                />
              )}
            </section>
          ) : null}

          <FieldError id="course-drawer-error" message={formError} />
        </form>

        {detail && canManage ? (
          <div className="flex flex-col items-start gap-2 pt-2">
            <Button variant="ghost" size="sm" iconName="delete" onClick={() => setDeleteOpen(true)}>
              Delete course
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
        title={isEdit ? 'Edit course' : 'New course'}
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
                isSuccess={updateCourse.isSuccess && !saving}
              >
                {isEdit ? 'Save' : 'Create course'}
              </Button>
            ) : null}
          </>
        )}
      >
        {body}
      </Drawer>
      <DeleteEntityDialog
        open={deleteOpen}
        entityLabel="course"
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteCourse.mutateAsync(courseId);
          handleClose();
        }}
        insteadAction={{
          label: 'Archive instead',
          onClick: async () => {
            await setPublished.mutateAsync(false);
          },
        }}
      />
    </>
  );
}

export default CourseDrawer;
