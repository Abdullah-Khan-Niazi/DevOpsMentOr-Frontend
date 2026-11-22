import { useEffect, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  Button,
  Checkbox,
  Drawer,
  DrawerFormSkeleton,
  EmptyState,
  ErrorState,
  FieldError,
  Input,
  Markdown,
  NumberInput,
  Switch,
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
import { safeHttpUrl } from '@/shared/utils';
import { DeleteEntityDialog } from '../DeleteEntityDialog';
import { MarkdownField } from '../fields/MarkdownField';
import {
  useAdminLesson,
  useAdminModule,
  useAdminTags,
  useCreateItem,
  useDeleteItem,
  useSetItemPublished,
  useUpdateLesson,
} from '../../../hooks/useAdminCurriculum';
import type {
  AdminContentType,
  AdminLessonDto,
  LessonContentType,
  UpdateLessonPayload,
} from '../../../types/admin';

// Lesson item create and edit (C§6.1). The lesson row is the module item, so the
// lesson id is the item id used by the publish and delete routes. The slug
// (`CxxMxxLxx`) is server assigned and shown read only; there is no slug input.

const MANAGE_PERMISSION = 'platform.curriculum.manage';
const FORM_ID = 'lesson-drawer-form';
const CONTENT_MAX = 200000;
const VIDEO_URL_MAX = 255;
const DURATION_MAX = 86400;
const TAG_LIMIT = 20;
/** Slides mode splits the content into slides on this marker. */
const SLIDE_SEPARATOR = '<!-- slide -->';

const FORMAT_ITEMS: ReadonlyArray<TabSwitcherItem<LessonContentType>> = [
  { id: 'text', label: 'Text' },
  { id: 'video', label: 'Video' },
  { id: 'interactive', label: 'Slides' },
];

const lessonSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Use at least 3 characters.')
      .max(255, 'Use at most 255 characters.'),
    contentType: z.enum(['text', 'video', 'interactive']),
    content: z.string().max(CONTENT_MAX, `Use at most ${CONTENT_MAX} characters.`),
    videoUrl: z.string().trim(),
    videoDurationSeconds: z.number().nullable(),
    tagIds: z.array(z.number()).max(TAG_LIMIT, `Choose at most ${TAG_LIMIT} tags.`),
  })
  .superRefine((values, ctx) => {
    if (values.contentType !== 'video') return;
    const url = values.videoUrl;
    if (url && (url.length > VIDEO_URL_MAX || !safeHttpUrl(url))) {
      ctx.addIssue({
        code: 'custom',
        path: ['videoUrl'],
        message: `Use an http(s) URL of at most ${VIDEO_URL_MAX} characters.`,
      });
    }
    const duration = values.videoDurationSeconds;
    if (
      duration !== null &&
      (!Number.isInteger(duration) || duration < 1 || duration > DURATION_MAX)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['videoDurationSeconds'],
        message: `Use a whole number of seconds from 1 to ${DURATION_MAX}.`,
      });
    }
  });

type LessonFormValues = z.infer<typeof lessonSchema>;

const EMPTY_VALUES: LessonFormValues = {
  title: '',
  contentType: 'text',
  content: '',
  videoUrl: '',
  videoDurationSeconds: null,
  tagIds: [],
};

function lessonFormat(contentType: AdminContentType): LessonContentType {
  return contentType === 'video' || contentType === 'interactive' ? contentType : 'text';
}

function toFormValues(lesson: AdminLessonDto): LessonFormValues {
  return {
    title: lesson.title,
    contentType: lessonFormat(lesson.contentType),
    content: lesson.content ?? '',
    videoUrl: lesson.videoUrl ?? '',
    videoDurationSeconds: lesson.videoDurationSeconds,
    tagIds: lesson.tags.map((tag) => tag.tagId),
  };
}

/** Fields shared by the create and update payloads. */
type LessonPayload = Required<Omit<UpdateLessonPayload, 'content'>> & { content: string };

/** Video fields are cleared for the other content types. */
function toPayload(values: LessonFormValues): LessonPayload {
  const isVideo = values.contentType === 'video';
  return {
    title: values.title,
    contentType: values.contentType,
    content: values.content,
    videoUrl: isVideo && values.videoUrl ? values.videoUrl : null,
    videoDurationSeconds: isVideo ? values.videoDurationSeconds : null,
    tagIds: values.tagIds,
  };
}

function splitSlides(content: string): string[] {
  return content.split(SLIDE_SEPARATOR).map((slide) => slide.trim());
}

function appendSlide(content: string): string {
  const base = content.trimEnd();
  return base ? `${base}\n\n${SLIDE_SEPARATOR}\n\n` : `${SLIDE_SEPARATOR}\n\n`;
}

function publishErrorMessage(error: unknown): string {
  if (hasCode(error, 'PUBLISH_PARENT_FIRST')) return 'Publish the module first.';
  return getErrorMessage(error);
}

export interface LessonDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  /** Lesson (item) id in edit mode. */
  id: number | null;
  /** Module id in create mode (the lesson is appended to it). */
  parentId?: number;
  onClose: () => void;
  /** Called with the new item id; without it the drawer closes after a create. */
  onCreated?: (id: number) => void;
}

export function LessonDrawer({ open, mode, id, parentId, onClose, onCreated }: LessonDrawerProps) {
  const isEdit = mode === 'edit' && id !== null;
  const lessonId = id ?? 0;
  const createModuleId = parentId ?? 0;
  const canManage = useAuthStore(
    (state) => state.user?.permissions?.includes(MANAGE_PERMISSION) ?? false,
  );

  const lessonQuery = useAdminLesson(lessonId, open && isEdit);
  const lesson = isEdit ? lessonQuery.data : undefined;
  const moduleId = isEdit ? (lesson?.moduleId ?? 0) : createModuleId;
  // Publish state comes from the module items, which the publish hook updates optimistically.
  const moduleQuery = useAdminModule(moduleId, open && isEdit && moduleId > 0);
  const item = moduleQuery.data?.items.find((existing) => existing.itemId === lessonId);
  const isPublished = item?.isPublished ?? lesson?.isPublished ?? false;
  const tagsQuery = useAdminTags();

  const createItem = useCreateItem(createModuleId);
  const updateLesson = useUpdateLesson(lessonId);
  const deleteItem = useDeleteItem(moduleId);
  const [formError, setFormError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const setPublished = useSetItemPublished(moduleId, {
    errorMessage: false,
    onError: (error) => setPublishError(publishErrorMessage(error)),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: EMPTY_VALUES,
  });
  const contentType = useWatch({ control, name: 'contentType' });
  const content = useWatch({ control, name: 'content' });

  const loadedKey = lesson ? lesson.lessonId : null;
  // Each open starts from the stored lesson (edit) or empty values (create).
  useEffect(() => {
    if (!open) return;
    reset(lesson ? toFormValues(lesson) : EMPTY_VALUES);
    // Refetches of the same lesson must not clobber unsaved edits, so `lesson` is read once per id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, loadedKey, reset]);

  const saving = createItem.isPending || updateLesson.isPending;

  // Closing clears the drawer's transient state; the next open reloads the form.
  function handleClose() {
    setFormError(null);
    setPublishError(null);
    setDeleteOpen(false);
    setSlideIndex(0);
    onClose();
  }
  const notFound = isEdit && lessonQuery.isError && getStatusCode(lessonQuery.error) === 404;

  function reportSaveError(error: unknown) {
    const fields = Object.entries(getFieldErrors(error));
    if (fields.length === 0) {
      setFormError(getErrorMessage(error));
      return;
    }
    for (const [path, message] of fields) {
      const root = path.split('.')[0];
      if (root in EMPTY_VALUES)
        setError(root as keyof LessonFormValues, { type: 'server', message });
      else setFormError(message);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const payload = toPayload(values);
    try {
      if (isEdit) {
        await updateLesson.mutateAsync(payload);
        reset(values);
        return;
      }
      const created = await createItem.mutateAsync({ kind: 'lesson', ...payload });
      toast.success('Lesson created.');
      if (onCreated) onCreated(created.itemId);
      else handleClose();
    } catch (error) {
      reportSaveError(error);
    }
  });

  function handleAddSlide() {
    const next = appendSlide(getValues('content'));
    setValue('content', next, { shouldDirty: true, shouldValidate: true });
    setSlideIndex(splitSlides(next).length - 1);
  }

  function togglePublished(next: boolean) {
    setPublishError(null);
    setPublished.mutate({ itemId: lessonId, isPublished: next });
  }

  let body: ReactNode;
  let formReady = false;
  if (!isEdit && createModuleId === 0) {
    body = <ErrorState message="Open the lesson from its module." />;
  } else if (isEdit && lessonQuery.isPending) {
    body = <DrawerFormSkeleton fields={5} />;
  } else if (notFound) {
    body = (
      <EmptyState
        title="This item no longer exists"
        icon="lesson"
        action={
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Close
          </Button>
        }
      />
    );
  } else if (isEdit && lessonQuery.isError) {
    body = (
      <ErrorState
        error={lessonQuery.error}
        onRetry={() => void lessonQuery.refetch()}
        retrying={lessonQuery.isFetching}
      />
    );
  } else {
    formReady = true;
    const slides = splitSlides(content);
    const activeSlide = Math.min(slideIndex, slides.length - 1);
    const tags = tagsQuery.data ?? [];

    body = (
      <fieldset disabled={!canManage || saving} className="flex min-w-0 flex-col gap-6">
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          {lesson ? (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="input-label">Slug</span>
                <span className="font-mono text-sm text-muted">
                  {lesson.slug ?? 'Not assigned'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <Switch
                  label="Published"
                  checked={isPublished}
                  onCheckedChange={togglePublished}
                  isLoading={setPublished.isPending}
                  disabled={!canManage || item === undefined}
                />
                <FieldError id="lesson-publish-error" message={publishError} />
              </div>
            </div>
          ) : null}

          <Input label="Title" error={errors.title?.message} {...register('title')} />

          <div className="flex flex-col gap-2">
            <span className="input-label">Content type</span>
            <Controller
              name="contentType"
              control={control}
              render={({ field }) => (
                <TabSwitcher
                  size="sm"
                  items={FORMAT_ITEMS}
                  value={field.value}
                  onChange={field.onChange}
                  ariaLabel="Content type"
                />
              )}
            />
          </div>

          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <MarkdownField
                ref={field.ref}
                label="Content"
                value={field.value}
                onChange={field.onChange}
                maxLength={CONTENT_MAX}
                rows={12}
                error={errors.content?.message}
              />
            )}
          />

          {contentType === 'interactive' ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  iconName="plus"
                  onClick={handleAddSlide}
                >
                  Add slide
                </Button>
                <span className="text-sm text-muted">{`Slide ${activeSlide + 1} of ${slides.length}`}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconName="chevron-left"
                  disabled={activeSlide === 0}
                  onClick={() => setSlideIndex(activeSlide - 1)}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconName="chevron-right"
                  iconPosition="right"
                  disabled={activeSlide >= slides.length - 1}
                  onClick={() => setSlideIndex(activeSlide + 1)}
                >
                  Next
                </Button>
              </div>
              <div className="rounded-md bg-paper p-4">
                {slides[activeSlide] ? (
                  <Markdown variant="compact">{slides[activeSlide]}</Markdown>
                ) : (
                  <p className="text-sm text-muted">Empty slide</p>
                )}
              </div>
            </div>
          ) : null}

          {contentType === 'video' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Video URL"
                type="url"
                placeholder="https://"
                maxLength={VIDEO_URL_MAX}
                error={errors.videoUrl?.message}
                {...register('videoUrl')}
              />
              <Controller
                name="videoDurationSeconds"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    label="Duration (seconds)"
                    value={field.value}
                    onValueChange={field.onChange}
                    error={errors.videoDurationSeconds?.message}
                  />
                )}
              />
            </div>
          ) : null}

          <div
            className="flex min-w-0 flex-col gap-2"
            role="group"
            aria-labelledby="lesson-tags-label"
          >
            <span id="lesson-tags-label" className="input-label">
              Tags
            </span>
            {tagsQuery.isPending ? (
              <DrawerFormSkeleton fields={1} />
            ) : tagsQuery.isError ? (
              <ErrorState
                compact
                error={tagsQuery.error}
                onRetry={() => void tagsQuery.refetch()}
                retrying={tagsQuery.isFetching}
              />
            ) : tags.length === 0 ? (
              <p className="text-sm text-muted">No tags yet</p>
            ) : (
              <Controller
                name="tagIds"
                control={control}
                render={({ field }) => (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {tags.map((tag) => {
                      const checked = field.value.includes(tag.tagId);
                      return (
                        <Checkbox
                          key={tag.tagId}
                          label={tag.tagName}
                          checked={checked}
                          disabled={!checked && field.value.length >= TAG_LIMIT}
                          onChange={(event) =>
                            field.onChange(
                              event.target.checked
                                ? [...field.value, tag.tagId]
                                : field.value.filter((existing) => existing !== tag.tagId),
                            )
                          }
                        />
                      );
                    })}
                  </div>
                )}
              />
            )}
            <FieldError id="lesson-tags-error" message={errors.tagIds?.message} />
          </div>

          <FieldError id="lesson-drawer-error" message={formError} />
        </form>

        {lesson && canManage ? (
          <div className="flex flex-col items-start gap-2 pt-2">
            <Button variant="ghost" size="sm" iconName="delete" onClick={() => setDeleteOpen(true)}>
              Delete lesson
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
        title={isEdit ? 'Edit lesson' : 'New lesson'}
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
                isSuccess={updateLesson.isSuccess && !saving}
              >
                {isEdit ? 'Save' : 'Create lesson'}
              </Button>
            ) : null}
          </>
        )}
      >
        {body}
      </Drawer>
      <DeleteEntityDialog
        open={deleteOpen}
        entityLabel="lesson"
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteItem.mutateAsync(lessonId);
          toast.success('Lesson deleted.');
          handleClose();
        }}
        insteadAction={{
          label: 'Unpublish instead',
          onClick: async () => {
            await setPublished.mutateAsync({ itemId: lessonId, isPublished: false });
          },
        }}
      />
    </>
  );
}

export default LessonDrawer;
