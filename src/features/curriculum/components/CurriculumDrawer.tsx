import { useState, useEffect } from 'react';
import { Button, ErrorState, Input, LoadingState, Modal, toast } from '@/shared/components';
import { CourseMetaCard } from './CourseMetaCard';
import { ModuleForm } from './ModuleForm';
import { LessonForm } from './LessonForm';
import { LabConfigForm } from './LabConfigForm';
import { QuizBuilderPanel } from './QuizBuilderPanel';
import { PublishToggle } from './PublishToggle';
import {
  useAdminCourse,
  useAdminLessonEditor,
  useAdminModuleEditor,
  useAdminModuleMutations,
  useAdminQuizEditor,
} from '../hooks';
import type { CourseDto } from '../types';
import type { CreateAction, TreeNodeSelection } from './CurriculumTree';

interface CurriculumDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: TreeNodeSelection | null;
  createAction: CreateAction | null;
  course: CourseDto;
  onNodeCreated?: (selection: TreeNodeSelection) => void;
}

export function CurriculumDrawer({
  isOpen,
  onClose,
  selectedNode,
  createAction,
  course,
  onNodeCreated,
}: CurriculumDrawerProps) {
  // ESC key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 rounded-l-md">
          <div className="space-y-6">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold block">
                  {createAction
                    ? `CREATE · ${createAction.type.toUpperCase()}`
                    : selectedNode
                      ? `INSPECT · ${selectedNode.type.toUpperCase()}`
                      : 'CURRICULUM NODE'}
                </span>
                <h2 className="text-lg font-bold text-card-foreground">
                  {createAction
                    ? createAction.type === 'module'
                      ? 'New Curriculum Module'
                      : createAction.type === 'lesson'
                        ? 'New Theory Lesson'
                        : createAction.type === 'lab'
                          ? 'Configure Hands-On Lab Sandbox'
                          : 'New Knowledge Quiz'
                    : selectedNode?.type === 'course'
                      ? 'Course Settings & Architecture'
                      : selectedNode?.type === 'module'
                        ? 'Module Settings'
                        : selectedNode?.type === 'lab'
                          ? 'Lab Sandbox Configuration'
                          : selectedNode?.type === 'quiz'
                            ? 'Quiz Builder'
                            : 'Lesson Editor'}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-muted hover:text-card-foreground transition-colors cursor-pointer rounded-xs"
                aria-label="Close drawer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Form Body */}
            <div>
              {/* 1. Create Actions */}
              {createAction && (
                <CreateActionContent
                  action={createAction}
                  onClose={onClose}
                  onNodeCreated={onNodeCreated}
                />
              )}

              {/* 2. Selected Node Views */}
              {!createAction && selectedNode && (
                <SelectedNodeContent
                  selectedNode={selectedNode}
                  course={course}
                  onClose={onClose}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component: Selected Node Content ──────────────────────────────────────────

function SelectedNodeContent({
  selectedNode,
  course,
  onClose,
}: {
  selectedNode: TreeNodeSelection;
  course: CourseDto;
  onClose: () => void;
}) {
  const courseManager = useAdminCourse();

  // Course Node Form
  if (selectedNode.type === 'course') {
    return (
      <div className="space-y-4">
        <CourseMetaCard
          course={courseManager.query.data ?? course}
          moduleCount={0}
          canManage
          saving={courseManager.update.isPending}
          onSave={(payload) =>
            courseManager.update.mutate(payload, {
              onSuccess: () => toast.success('Course updated successfully.'),
              onError: (error) => toast.error(error.message),
            })
          }
          onCancel={onClose}
        />
      </div>
    );
  }

  // Module Node Form
  if (selectedNode.type === 'module') {
    return <ModuleNodeDrawerContent moduleId={selectedNode.id} onClose={onClose} />;
  }

  // Lesson Node Form
  if (selectedNode.type === 'lesson') {
    return (
      <LessonNodeDrawerContent
        lessonId={selectedNode.id}
        moduleId={selectedNode.moduleId}
        onClose={onClose}
      />
    );
  }

  // Lab Node Form
  if (selectedNode.type === 'lab') {
    return (
      <LabNodeDrawerContent
        lessonId={selectedNode.id}
        moduleId={selectedNode.moduleId}
        onClose={onClose}
      />
    );
  }

  // Quiz Node Form
  if (selectedNode.type === 'quiz') {
    return (
      <QuizNodeDrawerContent
        quizId={selectedNode.id}
        moduleId={selectedNode.moduleId}
        onClose={onClose}
      />
    );
  }

  return null;
}

// ─── Module Drawer Content ───────────────────────────────────────────────────

function ModuleNodeDrawerContent({
  moduleId,
  onClose,
}: {
  moduleId: number;
  onClose: () => void;
}) {
  const editor = useAdminModuleEditor(moduleId);
  const [archiving, setArchiving] = useState(false);
  const [archiveTitle, setArchiveTitle] = useState('');

  if (editor.query.isLoading) {
    return <LoadingState label="Loading module details…" />;
  }

  if (editor.query.isError || !editor.query.data) {
    return (
      <ErrorState
        message={editor.query.error?.message ?? 'Unable to load module.'}
        onRetry={() => void editor.query.refetch()}
      />
    );
  }

  const module = editor.query.data;

  const confirmArchive = () => {
    if (archiveTitle.trim() !== module.title) {
      toast.error('Type the module title to confirm archiving.');
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
      {/* Publication & Archive bar */}
      <div className="flex items-center justify-between p-3 rounded-md bg-paper border border-border">
        <div>
          <p className="text-xs font-mono font-semibold text-card-foreground">Publication Status</p>
          <p className="text-xs text-muted">{module.isPublished ? 'Published and live' : 'Draft / Unpublished'}</p>
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

      {/* Module Edit Form */}
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
              estimatedMinutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : undefined,
              moduleOrder: values.moduleOrder ? Number(values.moduleOrder) : undefined,
            },
            {
              onSuccess: () => toast.success('Module saved.'),
              onError: (error) => toast.error(error.message),
            },
          )
        }
      />

      {/* Archive Confirmation Modal */}
      <Modal open={archiving} onClose={() => setArchiving(false)} title="Archive Module">
        <p className="modal-panel__body text-xs text-muted">
          Archiving will hide all lessons and quizzes within this module from enrolled learners.
          Type <span className="font-mono font-semibold text-card-foreground">{module.title}</span> to confirm.
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
          <Button variant="secondary" onClick={() => setArchiving(false)} disabled={editor.archive.isPending}>
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

// ─── Lesson Drawer Content ───────────────────────────────────────────────────

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
        message={editor.query.error?.message ?? 'Unable to load lesson.'}
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
            videoDurationSeconds: values.videoDurationSeconds ? Number(values.videoDurationSeconds) : null,
            lessonOrder: Number(values.lessonOrder),
            tagIds: values.tagIds,
          },
          {
            onSuccess: () => toast.success('Lesson updated.'),
            onError: (err) => toast.error(err.message),
          },
        )
      }
      onCancel={onClose}
    />
  );
}

// ─── Lab Drawer Content ──────────────────────────────────────────────────────

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
        message={editor.query.error?.message ?? 'Unable to load lab.'}
        onRetry={() => void editor.query.refetch()}
      />
    );
  }

  const lesson = editor.query.data;

  return (
    <LabConfigForm
      initial={{
        title: lesson.title,
        slug: lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
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
            onSuccess: () => toast.success('Lab configuration saved.'),
            onError: (err) => toast.error(err.message),
          },
        )
      }
      onCancel={onClose}
    />
  );
}

// ─── Quiz Drawer Content ─────────────────────────────────────────────────────

function QuizNodeDrawerContent({
  quizId,
  moduleId: _moduleId,
  onClose,
}: {
  quizId: number;
  moduleId: number;
  onClose: () => void;
}) {
  const builder = useAdminQuizEditor(quizId);

  if (builder.query.isLoading) {
    return <LoadingState label="Loading quiz builder…" />;
  }

  if (builder.query.isError || !builder.query.data) {
    return (
      <ErrorState
        message={builder.query.error?.message ?? 'Unable to load quiz.'}
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
            onSuccess: () => toast.success('Quiz settings saved.'),
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
      <div className="flex justify-end pt-2 border-t border-border">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

// ─── Create Action Content ───────────────────────────────────────────────────

function CreateActionContent({
  action,
  onClose,
  onNodeCreated,
}: {
  action: CreateAction;
  onClose: () => void;
  onNodeCreated?: (selection: TreeNodeSelection) => void;
}) {
  const moduleMutations = useAdminModuleMutations();

  // Create Module
  if (action.type === 'module') {
    return (
      <ModuleForm
        initial={{
          title: '',
          description: '',
          estimatedMinutes: '120',
          moduleOrder: '1',
        }}
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
              onSuccess: (created) => {
                toast.success('Module created.');
                if (onNodeCreated) {
                  onNodeCreated({ type: 'module', id: created.moduleId });
                } else {
                  onClose();
                }
              },
              onError: (err) => toast.error(err.message),
            },
          )
        }
      />
    );
  }

  // Create Lesson
  if (action.type === 'lesson') {
    return (
      <CreateLessonContent
        moduleId={action.moduleId}
        onClose={onClose}
        onNodeCreated={onNodeCreated}
      />
    );
  }

  // Create Lab
  if (action.type === 'lab') {
    return (
      <CreateLabContent
        moduleId={action.moduleId}
        onClose={onClose}
        onNodeCreated={onNodeCreated}
      />
    );
  }

  // Create Quiz
  if (action.type === 'quiz') {
    return (
      <CreateQuizContent
        moduleId={action.moduleId}
        onClose={onClose}
        onNodeCreated={onNodeCreated}
      />
    );
  }

  return null;
}

function CreateLessonContent({
  moduleId,
  onClose,
  onNodeCreated,
}: {
  moduleId: number;
  onClose: () => void;
  onNodeCreated?: (selection: TreeNodeSelection) => void;
}) {
  const editor = useAdminModuleEditor(moduleId);

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
            videoDurationSeconds: values.videoDurationSeconds ? Number(values.videoDurationSeconds) : null,
            lessonOrder: Number(values.lessonOrder) || 1,
            tagIds: values.tagIds,
          },
          {
            onSuccess: (created) => {
              toast.success('Lesson created.');
              if (onNodeCreated) {
                onNodeCreated({ type: 'lesson', id: created.lessonId, moduleId });
              } else {
                onClose();
              }
            },
            onError: (err) => toast.error(err.message),
          },
        )
      }
    />
  );
}

function CreateLabContent({
  moduleId,
  onClose,
  onNodeCreated,
}: {
  moduleId: number;
  onClose: () => void;
  onNodeCreated?: (selection: TreeNodeSelection) => void;
}) {
  const editor = useAdminModuleEditor(moduleId);

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
            onSuccess: (created) => {
              toast.success('Hands-On Lab created.');
              if (onNodeCreated) {
                onNodeCreated({ type: 'lab', id: created.lessonId, moduleId });
              } else {
                onClose();
              }
            },
            onError: (err) => toast.error(err.message),
          },
        )
      }
    />
  );
}

function CreateQuizContent({
  moduleId,
  onClose,
  onNodeCreated,
}: {
  moduleId: number;
  onClose: () => void;
  onNodeCreated?: (selection: TreeNodeSelection) => void;
}) {
  const editor = useAdminModuleEditor(moduleId);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [passingScore, setPassingScore] = useState('70');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
  const [isRequired, setIsRequired] = useState(true);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        onSuccess: (created) => {
          toast.success('Quiz created.');
          if (onNodeCreated) {
            onNodeCreated({ type: 'quiz', id: created.quizId, moduleId });
          } else {
            onClose();
          }
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          label="Quiz Title *"
          placeholder="e.g. Container Networking Check"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          error={titleError ?? undefined}
        />
        {titleError && (
          <p className="mt-1 text-xs text-rose-500 font-mono">{titleError}</p>
        )}
      </div>

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
          className="h-4 w-4 accent-brand-600 rounded-xs"
        />
        <label htmlFor="quiz-is-required" className="text-xs font-mono text-card-foreground">
          Mandatory for module completion
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={editor.createQuiz.isPending}>
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
