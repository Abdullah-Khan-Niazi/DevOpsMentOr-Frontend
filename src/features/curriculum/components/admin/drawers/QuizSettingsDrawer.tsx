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
  Input,
  NumberInput,
  Switch,
  toast,
} from '@/shared/components';
import {
  getErrorMessage,
  getFieldErrors,
  getStatusCode,
  hasCode,
} from '@/shared/services/apiError';
import { DeleteEntityDialog } from '../DeleteEntityDialog';
import { MarkdownField } from '../fields/MarkdownField';
import {
  useAdminModule,
  useAdminQuiz,
  useCreateItem,
  useDeleteItem,
  useSetItemPublished,
  useUpdateQuiz,
} from '../../../hooks/useAdminCurriculum';
import type { AdminQuizDetailDto } from '../../../types/admin';

// Quiz settings create and edit. Questions are edited in the quiz builder drawer.
// The drawer is keyed by the quiz id; publish and delete go through the module item
// route, so the item is resolved from the quiz's module.

const MANAGE_PERMISSION = 'platform.curriculum.manage';
const FORM_ID = 'quiz-settings-drawer-form';
const DESCRIPTION_MAX = 2000;
const PASSING_SCORE_DEFAULT = 70;

const quizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters.')
    .max(255, 'Use at most 255 characters.'),
  description: z.string().max(DESCRIPTION_MAX, `Use at most ${DESCRIPTION_MAX} characters.`),
  passingScore: z
    .number({ error: 'Enter a passing score.' })
    .int('Use a whole number.')
    .min(0, 'Use 0 or more.')
    .max(100, 'Use at most 100.'),
  timeLimitMinutes: z
    .number()
    .int('Use whole minutes.')
    .min(1, 'Use at least 1 minute, or leave empty for no limit.')
    .max(600, 'Use at most 600 minutes.')
    .nullable(),
  isRequired: z.boolean(),
});

type QuizFormValues = z.infer<typeof quizSchema>;

const EMPTY_VALUES: QuizFormValues = {
  title: '',
  description: '',
  passingScore: PASSING_SCORE_DEFAULT,
  timeLimitMinutes: null,
  isRequired: true,
};

function toFormValues(quiz: AdminQuizDetailDto): QuizFormValues {
  return {
    title: quiz.title,
    description: quiz.description ?? '',
    passingScore: quiz.passingScore,
    timeLimitMinutes: quiz.timeLimitMinutes,
    isRequired: quiz.isRequired,
  };
}

function publishErrorMessage(error: unknown): string {
  if (hasCode(error, 'QUIZ_EMPTY')) return 'Add at least one active question.';
  if (hasCode(error, 'PUBLISH_PARENT_FIRST')) return 'Publish the module first.';
  return getErrorMessage(error);
}

export interface QuizSettingsDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  /** Quiz id in edit mode. */
  id: number | null;
  /** Module id in create mode (the quiz is appended to it). */
  parentId?: number;
  onClose: () => void;
  /** Called with the new quiz id; without it the drawer closes after a create. */
  onCreated?: (id: number) => void;
  /** Opens the quiz builder drawer for the quiz. */
  onOpenQuestions?: (quizId: number) => void;
}

export function QuizSettingsDrawer({
  open,
  mode,
  id,
  parentId,
  onClose,
  onCreated,
  onOpenQuestions,
}: QuizSettingsDrawerProps) {
  const isEdit = mode === 'edit' && id !== null;
  const quizId = id ?? 0;
  const createModuleId = parentId ?? 0;
  const canManage = useAuthStore(
    (state) => state.user?.permissions?.includes(MANAGE_PERMISSION) ?? false,
  );

  const quizQuery = useAdminQuiz(quizId, open && isEdit);
  const quiz = isEdit ? quizQuery.data : undefined;
  const moduleId = isEdit ? (quiz?.moduleId ?? 0) : createModuleId;
  // The module item carries the item id and the publish state (updated optimistically).
  const moduleQuery = useAdminModule(moduleId, open && isEdit && moduleId > 0);
  const item = moduleQuery.data?.items.find((existing) => existing.quiz?.quizId === quizId);
  const itemId = item?.itemId ?? 0;
  const isPublished = item?.isPublished ?? quiz?.isPublished ?? false;

  const createItem = useCreateItem(createModuleId);
  const updateQuiz = useUpdateQuiz(quizId);
  const deleteItem = useDeleteItem(moduleId);
  const [formError, setFormError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
    formState: { errors, isDirty },
  } = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: EMPTY_VALUES,
  });

  const loadedKey = quiz ? quiz.quizId : null;
  // Each open starts from the stored quiz (edit) or the defaults (create).
  useEffect(() => {
    if (!open) return;
    reset(quiz ? toFormValues(quiz) : EMPTY_VALUES);
    // Refetches of the same quiz must not clobber unsaved edits, so `quiz` is read once per id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, loadedKey, reset]);

  const saving = createItem.isPending || updateQuiz.isPending;

  function handleClose() {
    setFormError(null);
    setPublishError(null);
    setDeleteOpen(false);
    onClose();
  }
  const notFound = isEdit && quizQuery.isError && getStatusCode(quizQuery.error) === 404;

  function reportSaveError(error: unknown) {
    const fields = Object.entries(getFieldErrors(error));
    if (fields.length === 0) {
      setFormError(getErrorMessage(error));
      return;
    }
    for (const [path, message] of fields) {
      const root = path.split('.')[0];
      if (root in EMPTY_VALUES) setError(root as keyof QuizFormValues, { type: 'server', message });
      else setFormError(message);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const description = values.description.trim();
    try {
      if (isEdit) {
        await updateQuiz.mutateAsync({
          title: values.title,
          description: description || null,
          passingScore: values.passingScore,
          timeLimitMinutes: values.timeLimitMinutes,
          isRequired: values.isRequired,
        });
        reset(values);
        return;
      }
      const created = await createItem.mutateAsync({
        kind: 'quiz',
        title: values.title,
        description: description || undefined,
        passingScore: values.passingScore,
        timeLimitMinutes: values.timeLimitMinutes,
        isRequired: values.isRequired,
      });
      const createdQuizId = created.quiz?.quizId;
      if (createdQuizId === undefined) {
        // The item exists; without its quiz id the builder cannot be opened from here.
        toast.success('Quiz created');
        handleClose();
        return;
      }
      toast.success(
        'Quiz created',
        onOpenQuestions
          ? { action: { label: 'Add questions', onClick: () => onOpenQuestions(createdQuizId) } }
          : undefined,
      );
      if (onCreated) onCreated(createdQuizId);
      else handleClose();
    } catch (error) {
      reportSaveError(error);
    }
  });

  function togglePublished(next: boolean) {
    setPublishError(null);
    setPublished.mutate({ itemId, isPublished: next });
  }

  let body: ReactNode;
  let formReady = false;
  if (!isEdit && createModuleId === 0) {
    body = <ErrorState message="Open the quiz from its module." />;
  } else if (isEdit && quizQuery.isPending) {
    body = <DrawerFormSkeleton fields={5} />;
  } else if (notFound) {
    body = (
      <EmptyState
        title="This item no longer exists"
        icon="quiz"
        action={
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Close
          </Button>
        }
      />
    );
  } else if (isEdit && quizQuery.isError) {
    body = (
      <ErrorState
        error={quizQuery.error}
        onRetry={() => void quizQuery.refetch()}
        retrying={quizQuery.isFetching}
      />
    );
  } else {
    formReady = true;
    body = (
      <fieldset disabled={!canManage || saving} className="flex min-w-0 flex-col gap-6">
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          {quiz ? (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Switch
                  label="Published"
                  checked={isPublished}
                  onCheckedChange={togglePublished}
                  isLoading={setPublished.isPending}
                  disabled={!canManage || itemId === 0}
                />
                <FieldError id="quiz-publish-error" message={publishError} />
              </div>
              {onOpenQuestions ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  iconName="checklist"
                  onClick={() => onOpenQuestions(quiz.quizId)}
                >
                  {`Questions (${quiz.questionCount})`}
                </Button>
              ) : null}
            </div>
          ) : null}

          <Input label="Title" error={errors.title?.message} {...register('title')} />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <MarkdownField
                ref={field.ref}
                label="Description"
                value={field.value}
                onChange={field.onChange}
                maxLength={DESCRIPTION_MAX}
                rows={5}
                error={errors.description?.message}
              />
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="passingScore"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Passing score (%)"
                  value={field.value}
                  onValueChange={(next) => field.onChange(next ?? Number.NaN)}
                  error={errors.passingScore?.message}
                />
              )}
            />
            <Controller
              name="timeLimitMinutes"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Time limit (minutes)"
                  placeholder="No limit"
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.timeLimitMinutes?.message}
                />
              )}
            />
          </div>

          <Controller
            name="isRequired"
            control={control}
            render={({ field }) => (
              <Switch label="Required" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />

          <FieldError id="quiz-settings-drawer-error" message={formError} />
        </form>

        {quiz && canManage ? (
          <div className="flex flex-col items-start gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              iconName="delete"
              disabled={itemId === 0}
              onClick={() => setDeleteOpen(true)}
            >
              Delete quiz
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
        title={isEdit ? 'Edit quiz' : 'New quiz'}
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
                isSuccess={updateQuiz.isSuccess && !saving}
              >
                {isEdit ? 'Save' : 'Create quiz'}
              </Button>
            ) : null}
          </>
        )}
      >
        {body}
      </Drawer>
      <DeleteEntityDialog
        open={deleteOpen}
        entityLabel="quiz"
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteItem.mutateAsync(itemId);
          toast.success('Quiz deleted.');
          handleClose();
        }}
        insteadAction={{
          label: 'Unpublish instead',
          onClick: async () => {
            await setPublished.mutateAsync({ itemId, isPublished: false });
          },
        }}
      />
    </>
  );
}

export default QuizSettingsDrawer;
