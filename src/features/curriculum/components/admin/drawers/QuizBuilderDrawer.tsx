import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  Button,
  ConfirmDialog,
  Drawer,
  DrawerFormSkeleton,
  EmptyState,
  ErrorState,
  Icon,
  toast,
} from '@/shared/components';
import { getFieldErrors, getStatusCode } from '@/shared/services/apiError';
import { cn } from '@/shared/utils';
import {
  useAdminQuiz,
  useCreateQuestion,
  useDeleteQuestion,
  useReorderQuestions,
  useUpdateQuestion,
} from '@/features/curriculum/hooks';
import type { AdminQuestionDto, AdminQuestionType } from '@/features/curriculum/types/admin';
import { DeleteEntityDialog } from '../DeleteEntityDialog';
import { ReorderList } from '../ReorderList';
import { QUESTION_EDITORS, QUESTION_TYPES, getEditor } from '../question';
import { issuesToErrors, nextKey } from '../question/types';

// Quiz question builder. Left: the questions in order (drag or Alt+Arrow to reorder) and
// the "Add question" menu. Right: the editor for the selected question. The editor's form
// value is validated by the type's zod schema before every save; the server's field issues
// (`answers.N.*`, `config.*`) come back on the same paths and are shown on the same rows.

const MANAGE_PERMISSION = 'platform.curriculum.manage';

export interface QuizBuilderDrawerProps {
  open: boolean;
  quizId: number;
  onClose(): void;
}

/** The question open in the editor. `questionId` is null until the first save. */
interface Draft {
  /** React key of the editor instance (a new key per opened question). */
  key: string;
  questionId: number | null;
  questionType: AdminQuestionType;
  values: unknown;
  /** Serialized values at load or save; any other serialization is an unsaved change. */
  savedSnapshot: string;
}

function draftFrom(
  questionType: AdminQuestionType,
  values: unknown,
  questionId: number | null,
): Draft {
  return {
    key: nextKey(),
    questionId,
    questionType,
    values,
    savedSnapshot: JSON.stringify(values),
  };
}

function draftFromQuestion(question: AdminQuestionDto): Draft {
  const values = getEditor(question.questionType).fromDto(question);
  return draftFrom(question.questionType, values, question.questionId);
}

function newDraft(questionType: AdminQuestionType): Draft {
  return draftFrom(questionType, getEditor(questionType).empty(), null);
}

function isDirty(draft: Draft | null): boolean {
  return draft !== null && JSON.stringify(draft.values) !== draft.savedSnapshot;
}

/**
 * Server field messages mapped to form paths: `config.wrongPenalty` is `wrongPenalty`,
 * `config.terminal.check.command` is `check.command`.
 */
function serverFieldErrors(error: unknown): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [path, message] of Object.entries(getFieldErrors(error))) {
    const formPath = path.replace(/^config\./, '').replace(/^terminal\./, '');
    if (!(formPath in errors)) errors[formPath] = message;
  }
  return errors;
}

export function QuizBuilderDrawer({ open, quizId, onClose }: QuizBuilderDrawerProps) {
  const canManage = useAuthStore(
    (state) => state.user?.permissions?.includes(MANAGE_PERMISSION) ?? false,
  );
  const quizQuery = useAdminQuiz(quizId, open);
  const createQuestion = useCreateQuestion(quizId);
  const updateQuestion = useUpdateQuestion(quizId);
  const deleteQuestion = useDeleteQuestion(quizId);
  const reorderQuestions = useReorderQuestions(quizId);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // A pending action waiting for the discard decision (switching question, adding one).
  const [pendingSwitch, setPendingSwitch] = useState<(() => void) | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Drop the open question when the drawer is pointed at another quiz.
  const [loadedQuizId, setLoadedQuizId] = useState(quizId);
  if (quizId !== loadedQuizId) {
    setLoadedQuizId(quizId);
    setDraft(null);
    setErrors({});
    setPendingSwitch(null);
    setDeleteOpen(false);
  }

  const questions = quizQuery.data?.questions ?? [];
  const dirty = canManage && isDirty(draft);
  const notFound = quizQuery.isError && getStatusCode(quizQuery.error) === 404;
  const saving = createQuestion.isPending || updateQuestion.isPending;
  const definition = draft ? getEditor(draft.questionType) : null;

  function requestSwitch(action: () => void) {
    if (dirty) {
      setPendingSwitch(() => action);
      return;
    }
    action();
  }

  function loadDraft(next: Draft | null) {
    setDraft(next);
    setErrors({});
  }

  /** Re-reads a saved question into the open draft; the editor instance stays mounted. */
  function refreshDraft(saved: AdminQuestionDto) {
    setDraft((current) => ({ ...draftFromQuestion(saved), key: current?.key ?? nextKey() }));
    setErrors({});
  }

  function selectQuestion(question: AdminQuestionDto) {
    if (draft?.questionId === question.questionId) return;
    requestSwitch(() => loadDraft(draftFromQuestion(question)));
  }

  function addQuestion(type: AdminQuestionType) {
    requestSwitch(() => loadDraft(newDraft(type)));
  }

  function changeValues(values: unknown) {
    setDraft((current) => (current ? { ...current, values } : current));
    setErrors({});
  }

  async function handleSave() {
    if (!draft) return;
    const editor = getEditor(draft.questionType);
    const parsed = editor.schema.safeParse(draft.values);
    if (!parsed.success) {
      setErrors(issuesToErrors(parsed.error.issues));
      toast.error('Check the highlighted fields.');
      return;
    }
    const payload = editor.toPayload(draft.values);
    try {
      const saved =
        draft.questionId === null
          ? await createQuestion.mutateAsync(payload)
          : await updateQuestion.mutateAsync({ questionId: draft.questionId, payload });
      refreshDraft(saved);
      if (draft.questionId === null) toast.success('Question added.');
    } catch (error) {
      const fieldErrors = serverFieldErrors(error);
      setErrors(fieldErrors);
      toast.error(Object.keys(fieldErrors).length > 0 ? 'Check the highlighted fields.' : error);
    }
  }

  async function deleteSelected() {
    if (draft?.questionId == null) return;
    const questionId = draft.questionId;
    await deleteQuestion.mutateAsync(questionId);
    setDraft((current) => (current?.questionId === questionId ? null : current));
    toast.success('Question deleted.');
  }

  async function deactivateSelected() {
    if (draft?.questionId == null) return;
    const questionId = draft.questionId;
    const saved = await updateQuestion.mutateAsync({ questionId, payload: { isActive: false } });
    setDraft((current) =>
      current?.questionId === questionId
        ? { ...draftFromQuestion(saved), key: current.key }
        : current,
    );
    toast.success('Question deactivated.');
  }

  function renderQuestion(question: AdminQuestionDto) {
    const questionDefinition = getEditor(question.questionType);
    const selected = draft?.questionId === question.questionId;
    return (
      <button
        type="button"
        aria-current={selected ? 'true' : undefined}
        onClick={() => selectQuestion(question)}
        className={cn(
          'flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-pearl-200',
          selected && 'bg-pearl-200',
          !question.isActive && 'text-muted',
        )}
      >
        <Icon
          name={questionDefinition.icon}
          size={18}
          selected={selected}
          className="mt-0.5 shrink-0"
        />
        <span className="min-w-0 flex-1 line-clamp-2 text-sm">{question.questionText}</span>
        <span className="shrink-0 text-xs text-muted">{question.points} pts</span>
        {!question.isActive ? (
          <Icon name="visibility-off" size={16} title="Inactive" className="mt-0.5 shrink-0" />
        ) : null}
      </button>
    );
  }

  const newQuestionRow =
    draft !== null && draft.questionId === null && definition ? (
      <div className="flex items-center gap-2 rounded-md bg-pearl-200 px-2 py-2 text-sm">
        <Icon name={definition.icon} size={18} selected className="shrink-0" />
        <span className="min-w-0 flex-1">{definition.label}</span>
        <span className="shrink-0 text-xs text-muted">Not saved</span>
      </div>
    ) : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Quiz questions"
      size="xl"
      dirty={dirty}
      busy={saving}
      footer={(requestClose) => (
        <div className="flex w-full items-center justify-between gap-3">
          {canManage && draft !== null && draft.questionId !== null ? (
            <Button
              type="button"
              variant="ghost"
              iconName="delete"
              disabled={saving}
              onClick={() => setDeleteOpen(true)}
            >
              Delete question
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={requestClose} disabled={saving}>
              Close
            </Button>
            {canManage ? (
              <Button
                type="button"
                variant="primary"
                isLoading={saving}
                isSuccess={updateQuestion.isSuccess && !saving}
                disabled={draft === null}
                onClick={() => void handleSave()}
              >
                Save question
              </Button>
            ) : null}
          </div>
        </div>
      )}
    >
      {quizQuery.isPending ? (
        <DrawerFormSkeleton fields={4} />
      ) : notFound ? (
        <EmptyState
          title="This item no longer exists"
          icon="quiz"
          action={
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          }
        />
      ) : quizQuery.isError ? (
        <ErrorState error={quizQuery.error} onRetry={() => void quizQuery.refetch()} />
      ) : (
        <div className="flex flex-col gap-6 md:flex-row">
          <aside className="flex w-full min-w-0 flex-col gap-3 md:w-80 md:shrink-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-card-foreground">Questions</h3>
              {canManage ? (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button type="button" variant="secondary" size="sm" iconName="plus">
                      Add question
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={8}
                      className="z-(--z-dropdown) min-w-56 rounded-xl border border-border bg-card p-1.5 text-card-foreground shadow-xl"
                    >
                      {QUESTION_TYPES.map((type) => {
                        const typeDefinition = QUESTION_EDITORS[type];
                        return (
                          <DropdownMenu.Item
                            key={type}
                            onSelect={() => addQuestion(type)}
                            className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-surface-hover"
                          >
                            <Icon name={typeDefinition.icon} size={16} className="shrink-0" />
                            <span>{typeDefinition.label}</span>
                          </DropdownMenu.Item>
                        );
                      })}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ) : null}
            </div>

            {questions.length === 0 && draft === null ? (
              <EmptyState title="No questions yet" icon="quiz" />
            ) : null}

            <ReorderList
              ariaLabel="Questions"
              items={questions}
              getId={(question) => question.questionId}
              renderItem={renderQuestion}
              disabled={!canManage || reorderQuestions.isPending}
              onReorder={(ids) => reorderQuestions.mutate(ids.map((id) => Number(id)))}
            />
            {newQuestionRow}
          </aside>

          <section className="min-w-0 flex-1">
            {draft && definition ? (
              <definition.Editor
                key={draft.key}
                value={draft.values}
                onChange={changeValues}
                errors={errors}
              />
            ) : (
              <EmptyState title="Select a question or add one" />
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={pendingSwitch !== null}
        title="Discard changes?"
        message="Your unsaved changes to this question will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="danger"
        onCancel={() => setPendingSwitch(null)}
        onConfirm={() => {
          const action = pendingSwitch;
          setPendingSwitch(null);
          action?.();
        }}
      />

      <DeleteEntityDialog
        open={deleteOpen}
        entityLabel="question"
        onConfirm={deleteSelected}
        onClose={() => setDeleteOpen(false)}
        insteadAction={{ label: 'Deactivate instead', onClick: deactivateSelected }}
      />
    </Drawer>
  );
}
