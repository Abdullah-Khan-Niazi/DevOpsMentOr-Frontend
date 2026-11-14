import { useState } from 'react';
import {
  Button,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  EmptyState,
  toast,
} from '@/shared/components';
import { CourseMetaCard } from './CourseMetaCard';
import { CurriculumDrawerShell } from './CurriculumDrawerShell';
import { LabConfigForm } from './LabConfigForm';
import { LessonForm } from './LessonForm';
import { ModuleForm } from './ModuleForm';
import { PublishToggle } from './PublishToggle';
import { QuizBuilderPanel } from './QuizBuilderPanel';
import {
  useAdminCourse,
  useAdminLessonEditor,
  useAdminModuleEditor,
  useAdminModules,
  useAdminModuleMutations,
  useAdminQuizEditor,
} from '../hooks';
import type { CourseDto } from '../types';
import type { CreateAction, TreeNodeSelection } from './CurriculumTree';

interface CurriculumDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Edit task. Ignored while a create task is present (one task per drawer). */
  selectedNode: TreeNodeSelection | null;
  /**
   * Create task. A create drawer only creates: on success it closes and the
   * form state resets, it never flips into edit mode.
   */
  createAction: CreateAction | null;
  /** Canonical course fallback while the admin course query resolves. */
  course: CourseDto | null;
}

const CREATE_TITLES: Record<CreateAction['type'], string> = {
  module: 'New Curriculum Module',
  lesson: 'New Theory Lesson',
  lab: 'Configure Hands-On Lab Sandbox',
  quiz: 'New Knowledge Quiz',
};

function editTitle(selection: TreeNodeSelection): string {
  switch (selection.type) {
    case 'course':
      return 'Course Settings & Architecture';
    case 'module':
      return 'Module Settings';
    case 'lab':
      return 'Lab Sandbox Configuration';
    case 'quiz':
      return 'Quiz Builder';
    default:
      return 'Lesson Editor';
  }
}

/**
 * The single curriculum task drawer. It renders exactly one task at a time
 * (create OR edit), keyed by task identity so switching nodes remounts the
 * form instead of leaking stale field state. On a successful create/edit the
 * drawer closes immediately; only the matching lists are invalidated.
 */
export function CurriculumDrawer({
  isOpen,
  onClose,
  selectedNode,
  createAction,
  course,
}: CurriculumDrawerProps) {
  if (!isOpen) return null;

  const activeCreate = createAction;
  const activeSelection = activeCreate ? null : selectedNode;

  if (!activeCreate && !activeSelection) return null;

  const taskKey = activeCreate
    ? `create-${activeCreate.type}-${activeCreate.type === 'module' ? 'root' : activeCreate.moduleId}`
    : activeSelection
      ? `edit-${activeSelection.type}-${activeSelection.id}`
      : '';
  const eyebrow = activeCreate
    ? `CREATE · ${activeCreate.type.toUpperCase()}`
    : activeSelection
      ? `EDIT · ${activeSelection.type.toUpperCase()}`
      : '';
  const title = activeCreate
    ? CREATE_TITLES[activeCreate.type]
    : activeSelection
      ? editTitle(activeSelection)
      : '';

  return (
    <CurriculumDrawerShell isOpen={isOpen} onClose={onClose} eyebrow={eyebrow} title={title}>
      {/* Key by task identity: a new task always starts from fresh form state. */}
      <div key={taskKey}>
        {activeCreate ? (
          <CreateActionContent action={activeCreate} onClose={onClose} />
        ) : activeSelection ? (
          <SelectedNodeContent selectedNode={activeSelection} course={course} onClose={onClose} />
        ) : null}
      </div>
    </CurriculumDrawerShell>
  );
}

/* ─── Selected node (edit tasks) ─────────────────────────────────────────── */

function SelectedNodeContent({
  selectedNode,
  course,
  onClose,
}: {
  selectedNode: TreeNodeSelection;
  course: CourseDto | null;
  onClose: () => void;
}) {
  const courseManager = useAdminCourse();

  if (selectedNode.type === 'course') {
    if (courseManager.query.isLoading && !course && !courseManager.query.data) {
      return <LoadingState label="Loading course settings…" />;
    }
    if (courseManager.query.isError && !courseManager.query.data && !course) {
      return (
        <ErrorState
          title="Could not load the course"
          message={courseManager.query.error?.message ?? 'The canonical course is unavailable.'}
          onRetry={() => void courseManager.query.refetch()}
        />
      );
    }
    const courseData = courseManager.query.data ?? course;
    if (!courseData) {
      return (
        <ErrorState
          title="Course unavailable"
          message="The canonical course has not been configured yet."
          onRetry={() => void courseManager.query.refetch()}
        />
      );
    }
    return (
      <CourseMetaCard
        course={courseData}
        moduleCount={0}
        canManage
        saving={courseManager.update.isPending}
        onSave={(payload) =>
          courseManager.update.mutate(payload, {
            onSuccess: () => {
              toast.success('Course updated.');
              onClose();
            },
            onError: (error) => toast.error(error.message),
          })
        }
        onCancel={onClose}
      />
    );
  }

  if (selectedNode.type === 'module') {
    return <ModuleNodeDrawerContent moduleId={selectedNode.id} onClose={onClose} />;
  }

  if (selectedNode.type === 'lesson') {
    return (
      <LessonNodeDrawerContent
        lessonId={selectedNode.id}
        moduleId={selectedNode.moduleId}
        onClose={onClose}
      />
    );
  }

  if (selectedNode.type === 'lab') {
    return (
      <LabNodeDrawerContent
        lessonId={selectedNode.id}
        moduleId={selectedNode.moduleId}
        onClose={onClose}
      />
    );
  }

  if (selectedNode.type === 'quiz') {
    return <QuizNodeDrawerContent quizId={selectedNode.id} onClose={onClose} />;
  }

  return null;
}

/* ─── Module drawer content ──────────────────────────────────────────────── */

function ModuleNodeDrawerContent({ moduleId, onClose }: { moduleId: number; onClose: () => void }) {
  const editor = useAdminModuleEditor(moduleId);
  const [archiving, setArchiving] = useState(false);
  const [archiveTitle, setArchiveTitle] = useState('');

  if (editor.query.isLoading) {
    return <LoadingState label="Loading module details…" />;
  }

  if (editor.query.isError || !editor.query.data) {
    return (
      <ErrorState
        title="Could not load module"
        message={editor.query.error?.message ?? 'This module could not be loaded.'}
        onRetry={() => void editor.query.refetch()}
      />
    );
  }

  const module = editor.query.data;

  const confirmArchive = () => {
    if (archiveTitle.trim() !== module.title) {
      toast.error('Type the module title exactly to confirm archiving.');
      return;
    }
    editor.archive.mutate(undefined, {
      onSuccess: () => {
        toast.success('Module archived.');
        setArchiving(false);
        onClose();
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="space-y-6">
      {/* Publication & archive bar */}
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-paper p-3">
        <div>
          <p className="font-mono text-xs font-semibold text-card-foreground">Publication Status</p>
          <p className="text-xs text-muted">
            {module.isPublished ? 'Published and live' : 'Draft / Unpublished'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PublishToggle
            isPublished={module.isPublished}
            label={module.title}
            busy={editor.publish.isPending}
            onPublish={() =>
              editor.publish.mutate(undefined, {
                onSuccess: () => toast.success('Module published.'),
                onError: (error) => toast.error(error.message),
              })
            }
            onUnpublish={() => setArchiving(true)}
          />
          <Button variant="danger" size="sm" onClick={() => setArchiving(true)}>
            Archive
          </Button>
        </div>
      </div>

      {/* Module edit form — save closes the edit task. */}
      <ModuleForm
        initial={{
          title: module.title,
          description: module.description ?? '',
          estimatedMinutes: String(module.estimatedMinutes),
          moduleOrder: String(module.moduleOrder),
        }}
        submitLabel="Save Module Settings"
        saving={editor.update.isPending}
        onCancel={onClose}
        onSubmit={(values) =>
          editor.update.mutate(
            {
              title: values.title,
              description: values.description.trim() || null,
              estimatedMinutes: values.estimatedMinutes
                ? Number(values.estimatedMinutes)
                : undefined,
              moduleOrder: values.moduleOrder ? Number(values.moduleOrder) : undefined,
            },
            {
              onSuccess: () => {
                toast.success('Module saved.');
                onClose();
              },
              onError: (error) => toast.error(error.message),
            },
          )
        }
      />

      {/* Archive confirmation modal */}
      <Modal open={archiving} onClose={() => setArchiving(false)} title="Archive Module">
        <p className="modal-panel__body text-xs text-muted">
          Archiving will hide all lessons and quizzes within this module from enrolled learners.
          Type <span className="font-mono font-semibold text-card-foreground">{module.title}</span>{' '}
          to confirm.
        </p>
        <div className="mt-4">
          <Input
            label="Confirm Module Title"
            value={archiveTitle}
            onChange={(e) => setArchiveTitle(e.target.value)}
            placeholder={module.title}
          />
        </div>
        <div className="modal-panel__actions mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setArchiving(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmArchive} isLoading={editor.archive.isPending}>
            Archive Module
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ─── Lesson drawer content ───────────────────────────────────────────────── */

function LessonNodeDrawerContent({
  lessonId,
  moduleId,
  onClose,
}: {
  lessonId: number;
  moduleId: number;
  onClose: () => void;
}) {
  const editor = useAdminLessonEditor(lessonId);

  if (editor.query.isLoading) {
    return <LoadingState label="Loading lesson data…" />;
  }

  if (editor.query.isError || !editor.query.data) {
    return (
      <ErrorState
        title="Could not load lesson"
        message={editor.query.error?.message ?? 'This lesson could not be loaded.'}
        onRetry={() => void editor.query.refetch()}
      />
    );
  }

  const lesson = editor.query.data;

  return (
    <LessonForm
      initial={lesson}
      moduleId={moduleId}
      saving={editor.update.isPending}
      publishing={editor.publish.isPending}
      onPublishToggle={(published) => {
        if (published) {
          editor.publish.mutate(undefined, {
            onSuccess: () => toast.success('Lesson published.'),
            onError: (err) => toast.error(err.message),
          });
        } else {
          editor.update.mutate(
            { isPublished: false },
            {
              onSuccess: () => toast.success('Lesson unpublished.'),
              onError: (err) => toast.error(err.message),
            },
          );
        }
      }}
      onSubmit={(values) =>
        editor.update.mutate(
          {
            title: values.title,
            contentType: values.contentType,
            content: values.content.trim() || null,
            videoUrl: values.videoUrl.trim() || null,
            videoDurationSeconds: values.videoDurationSeconds
              ? Number(values.videoDurationSeconds)
              : null,
            lessonOrder: Number(values.lessonOrder),
            tagIds: values.tagIds,
          },
          {
            onSuccess: () => {
              toast.success('Lesson updated.');
              onClose();
            },
            onError: (err) => toast.error(err.message),
          },
        )
      }
      onCancel={onClose}
    />
  );
}

/* ─── Lab drawer content ─────────────────────────────────────────────────── */

function LabNodeDrawerContent({
  lessonId,
  moduleId,
  onClose,
}: {
  lessonId: number;
  moduleId: number;
  onClose: () => void;
}) {
  const editor = useAdminLessonEditor(lessonId);

  if (editor.query.isLoading) {
    return <LoadingState label="Loading lab sandbox configuration…" />;
  }

  if (editor.query.isError || !editor.query.data) {
    return (
      <ErrorState
        title="Could not load the lab"
        message={editor.query.error?.message ?? 'This lab could not be loaded.'}
        onRetry={() => void editor.query.refetch()}
      />
    );
  }

  const lesson = editor.query.data;

  return (
    <LabConfigForm
      initial={{
        title: lesson.title,
        slug:
          lesson.slug ??
          lesson.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
        difficultyId: 2,
        labType: 'pro_lab',
        estimatedHours: 2,
        containerImage: 'devopsmentor/k8s-sandbox:v1',
        instructions: lesson.content ?? undefined,
        assertions: [
          'Verify node readiness in Kubernetes cluster',
          'Deploy web application pod with health checks',
          'Expose NodePort service on port 30080',
        ],
      }}
      moduleId={moduleId}
      saving={editor.update.isPending}
      onSubmit={(values) =>
        editor.update.mutate(
          {
            title: values.title,
            contentType: 'lab',
            content: values.instructions,
            lessonOrder: lesson.lessonOrder,
          },
          {
            onSuccess: () => {
              toast.success('Lab configuration saved.');
              onClose();
            },
            onError: (err) => toast.error(err.message),
          },
        )
      }
      onCancel={onClose}
    />
  );
}

/* ─── Quiz drawer content ────────────────────────────────────────────────── */

function QuizNodeDrawerContent({ quizId, onClose }: { quizId: number; onClose: () => void }) {
  const builder = useAdminQuizEditor(quizId);

  if (builder.query.isLoading) {
    return <LoadingState label="Loading quiz builder…" />;
  }

  if (builder.query.isError || !builder.query.data) {
    return (
      <ErrorState
        title="Could not load the quiz"
        message={builder.query.error?.message ?? 'This quiz could not be loaded.'}
        onRetry={() => void builder.query.refetch()}
      />
    );
  }

  const quiz = builder.query.data;

  return (
    <div className="space-y-4">
      <QuizBuilderPanel
        quiz={quiz}
        savingQuiz={builder.update.isPending}
        savingQuestion={builder.createQuestion.isPending || builder.updateQuestion.isPending}
        publishing={builder.update.isPending}
        onUpdateQuiz={(payload) =>
          builder.update.mutate(payload, {
            onSuccess: () => {
              toast.success('Quiz settings saved.');
              onClose();
            },
            onError: (err) => toast.error(err.message),
          })
        }
        onPublishChange={(isPublished) =>
          builder.update.mutate(
            { isPublished },
            {
              onSuccess: () => toast.success(isPublished ? 'Quiz published.' : 'Quiz unpublished.'),
              onError: (err) => toast.error(err.message),
            },
          )
        }
        onCreateQuestion={(payload) =>
          builder.createQuestion.mutate(payload, {
            onSuccess: () => toast.success('Question added.'),
            onError: (err) => toast.error(err.message),
          })
        }
        onUpdateQuestion={(questionId, payload) =>
          builder.updateQuestion.mutate(
            { questionId, data: payload },
            {
              onSuccess: () => toast.success('Question updated.'),
              onError: (err) => toast.error(err.message),
            },
          )
        }
      />
      <div className="flex justify-end border-t border-border pt-2">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

/* ─── Create tasks (create only, close on success) ───────────────────────── */

function CreateActionContent({ action, onClose }: { action: CreateAction; onClose: () => void }) {
  if (action.type === 'module') {
    return <CreateModuleContent onClose={onClose} />;
  }

  if (action.moduleId > 0) {
    return <CreateItemContent action={action} moduleId={action.moduleId} onClose={onClose} />;
  }

  // A `?create=lesson|lab|quiz` deep link without a module scope: let the
  // admin pick the target module instead of silently posting to module 0.
  return <ModuleScopePicker itemType={action.type} onClose={onClose} />;
}

function CreateModuleContent({ onClose }: { onClose: () => void }) {
  const moduleMutations = useAdminModuleMutations();

  return (
    <ModuleForm
      initial={{ title: '', description: '', estimatedMinutes: '120', moduleOrder: '1' }}
      submitLabel="Create Module"
      saving={moduleMutations.create.isPending}
      onCancel={onClose}
      onSubmit={(values) =>
        moduleMutations.create.mutate(
          {
            title: values.title,
            description: values.description.trim() || undefined,
            estimatedMinutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : undefined,
            moduleOrder: Number(values.moduleOrder) || 1,
          },
          {
            onSuccess: () => {
              toast.success('Module created.');
              onClose();
            },
            onError: (err) => toast.error(err.message),
          },
        )
      }
    />
  );
}

function ModuleScopePicker({
  itemType,
  onClose,
}: {
  itemType: 'lesson' | 'lab' | 'quiz';
  onClose: () => void;
}) {
  const modulesQuery = useAdminModules();
  const courseQuery = useAdminCourse();
  const [moduleId, setModuleId] = useState('');

  if (modulesQuery.isLoading || courseQuery.query.isLoading) {
    return <LoadingState label="Loading modules…" />;
  }

  if (modulesQuery.isError) {
    return (
      <ErrorState
        title="Could not load modules"
        message={modulesQuery.error?.message ?? 'The module list is unavailable.'}
        onRetry={() => void modulesQuery.refetch()}
      />
    );
  }

  if (courseQuery.query.isError || !courseQuery.query.data) {
    return (
      <ErrorState
        title="Could not load the canonical course"
        message={
          courseQuery.query.error?.message ??
          'The canonical course is required to pick a target module.'
        }
        onRetry={() => void courseQuery.query.refetch()}
      />
    );
  }

  // The admin API only writes modules of the canonical course, so the picker
  // never offers modules the create request would reject.
  const modules = (modulesQuery.data ?? []).filter(
    (module) => module.courseId === courseQuery.query.data?.courseId,
  );

  if (modules.length === 0) {
    return (
      <EmptyState
        title="No modules available"
        description="Create a module before adding lessons, labs or quizzes to it."
        action={
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        }
      />
    );
  }

  if (moduleId) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setModuleId('')}
          className="font-mono text-xs"
        >
          ← Change module
        </Button>
        <CreateItemContent
          key={moduleId}
          action={{ type: itemType, moduleId: Number(moduleId) }}
          moduleId={Number(moduleId)}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        This deep link does not name a module. Pick the module that should contain the new{' '}
        {itemType}:
      </p>
      <div className="space-y-2">
        {modules.map((module) => (
          <button
            key={module.moduleId}
            type="button"
            onClick={() => setModuleId(String(module.moduleId))}
            className="flex w-full items-center justify-between gap-2 rounded-sm border border-border/60 px-3 py-2.5 text-left transition-colors hover:border-paper-line-strong hover:bg-surface/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
          >
            <span className="min-w-0 truncate text-xs font-medium text-card-foreground">
              M{module.moduleOrder} · {module.title}
            </span>
            <span className="shrink-0 text-micro text-muted">
              {module.lessonCount} {module.lessonCount === 1 ? 'item' : 'items'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

type ItemCreateAction = Extract<CreateAction, { type: 'lesson' | 'lab' | 'quiz' }>;

function CreateItemContent({
  action,
  moduleId,
  onClose,
}: {
  action: ItemCreateAction;
  moduleId: number;
  onClose: () => void;
}) {
  if (action.type === 'lesson') {
    return <CreateLessonContent moduleId={moduleId} onClose={onClose} />;
  }
  if (action.type === 'lab') {
    return <CreateLabContent moduleId={moduleId} onClose={onClose} />;
  }
  return <CreateQuizContent moduleId={moduleId} onClose={onClose} />;
}

function CreateLessonContent({ moduleId, onClose }: { moduleId: number; onClose: () => void }) {
  const editor = useAdminModuleEditor(moduleId);

  if (editor.query.isLoading) {
    return <LoadingState label="Loading the target module…" />;
  }

  if (editor.query.isError || !editor.query.data) {
    return (
      <ErrorState
        title="Could not load the target module"
        message={
          editor.query.error?.message ??
          'The module for this new lesson does not exist or is not manageable.'
        }
        onRetry={() => void editor.query.refetch()}
      />
    );
  }

  return (
    <LessonForm
      moduleId={moduleId}
      saving={editor.createLesson.isPending}
      onCancel={onClose}
      onSubmit={(values) =>
        editor.createLesson.mutate(
          {
            title: values.title,
            contentType: values.contentType,
            content: values.content.trim() || undefined,
            videoUrl: values.videoUrl.trim() || null,
            videoDurationSeconds: values.videoDurationSeconds
              ? Number(values.videoDurationSeconds)
              : null,
            lessonOrder: Number(values.lessonOrder) || 1,
            tagIds: values.tagIds,
          },
          {
            onSuccess: () => {
              toast.success('Lesson created.');
              onClose();
            },
            onError: (err) => toast.error(err.message),
          },
        )
      }
    />
  );
}

function CreateLabContent({ moduleId, onClose }: { moduleId: number; onClose: () => void }) {
  const editor = useAdminModuleEditor(moduleId);

  if (editor.query.isLoading) {
    return <LoadingState label="Loading the target module…" />;
  }

  if (editor.query.isError || !editor.query.data) {
    return (
      <ErrorState
        title="Could not load the target module"
        message={
          editor.query.error?.message ??
          'The module for this new lab does not exist or is not manageable.'
        }
        onRetry={() => void editor.query.refetch()}
      />
    );
  }

  return (
    <LabConfigForm
      moduleId={moduleId}
      saving={editor.createLesson.isPending}
      onCancel={onClose}
      onSubmit={(values) =>
        editor.createLesson.mutate(
          {
            title: values.title,
            contentType: 'lab',
            content: values.instructions,
            lessonOrder: (editor.query.data?.lessons.length ?? 0) + 1,
          },
          {
            onSuccess: () => {
              toast.success('Hands-On Lab created.');
              onClose();
            },
            onError: (err) => toast.error(err.message),
          },
        )
      }
    />
  );
}

function CreateQuizContent({ moduleId, onClose }: { moduleId: number; onClose: () => void }) {
  const editor = useAdminModuleEditor(moduleId);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [passingScore, setPassingScore] = useState('70');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
  const [isRequired, setIsRequired] = useState(true);

  if (editor.query.isLoading) {
    return <LoadingState label="Loading the target module…" />;
  }

  if (editor.query.isError || !editor.query.data) {
    return (
      <ErrorState
        title="Could not load the target module"
        message={
          editor.query.error?.message ??
          'The module for this new quiz does not exist or is not manageable.'
        }
        onRetry={() => void editor.query.refetch()}
      />
    );
  }

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!val.trim()) {
      setTitleError('Quiz title is required');
    } else if (val.trim().length < 3) {
      setTitleError('Title must be at least 3 characters');
    } else {
      setTitleError(null);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setTitleError('Title must be at least 3 characters');
      return;
    }
    editor.createQuiz.mutate(
      {
        title: title.trim(),
        passingScore: Number(passingScore) || 70,
        timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
        isRequired,
      },
      {
        onSuccess: () => {
          toast.success('Quiz created.');
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Quiz Title *"
        placeholder="e.g. Container Networking Check"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        error={titleError ?? undefined}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Passing Score (%)"
          type="number"
          min={1}
          max={100}
          value={passingScore}
          onChange={(e) => setPassingScore(e.target.value)}
          required
        />
        <Input
          label="Time Limit (Minutes, optional)"
          type="number"
          min={1}
          max={180}
          value={timeLimitMinutes}
          onChange={(e) => setTimeLimitMinutes(e.target.value)}
          placeholder="e.g. 30"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          id="quiz-is-required"
          type="checkbox"
          checked={isRequired}
          onChange={(e) => setIsRequired(e.target.checked)}
          className="h-4 w-4 rounded-xs accent-brand-600"
        />
        <label htmlFor="quiz-is-required" className="font-mono text-xs text-card-foreground">
          Mandatory for module completion
        </label>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={onClose}
          disabled={editor.createQuiz.isPending}
        >
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" isLoading={editor.createQuiz.isPending}>
          Create Quiz
        </Button>
      </div>
    </form>
  );
}

export default CurriculumDrawer;
