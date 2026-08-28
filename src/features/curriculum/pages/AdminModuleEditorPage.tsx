import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  toast,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { LessonListPanel } from '../components/LessonListPanel';
import { ModuleForm } from '../components/ModuleForm';
import { PublishToggle } from '../components/PublishToggle';
import { QuizListPanel } from '../components/QuizListPanel';
import { useAdminModuleEditor } from '../hooks';

/** F4 SCR-F4-02: module editor with lesson and quiz management (F4-API-11..19). */
export function AdminModuleEditorPage() {
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [archiving, setArchiving] = useState(false);
  const [archiveTitle, setArchiveTitle] = useState('');
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');

  const editor = useAdminModuleEditor(moduleId);

  const busyLessonIds = useMemo(() => {
    const ids = new Set<number>();
    if (editor.publishLesson.isPending && editor.publishLesson.variables) {
      ids.add(editor.publishLesson.variables);
    }
    return ids;
  }, [editor.publishLesson.isPending, editor.publishLesson.variables]);

  if (editor.query.isLoading) {
    return (
      <div>
        <PageHeader title="Module editor" />
        <LoadingState label="Loading module…" />
      </div>
    );
  }

  if (editor.query.isError || !editor.query.data) {
    return (
      <div>
        <PageHeader title="Module editor" />
        <ErrorState
          message={editor.query.error?.message ?? 'Unable to load this module.'}
          onRetry={() => void editor.query.refetch()}
        />
      </div>
    );
  }

  const module = editor.query.data;

  const handleReorderLessons = (lessonId: number, direction: -1 | 1) => {
    const lessons = module.lessons;
    const index = lessons.findIndex((lesson) => lesson.lessonId === lessonId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= lessons.length) {
      return;
    }
    const next = [...lessons];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    const orders = next.map((lesson, order) => ({
      lessonId: lesson.lessonId,
      lessonOrder: order + 1,
    }));
    editor.reorderLessons.mutate(orders, {
      onSuccess: () => toast.success('Lesson order updated.'),
      onError: (error) => toast.error(error.message),
    });
  };

  const submitLesson = () => {
    if (!lessonTitle.trim() || lessonTitle.trim().length < 3) {
      toast.error('Lesson title must be at least 3 characters.');
      return;
    }
    editor.createLesson.mutate(
      {
        title: lessonTitle.trim(),
        contentType: 'text',
        lessonOrder: module.lessons.length + 1,
      },
      {
        onSuccess: (lesson) => {
          toast.success('Lesson created.');
          setCreatingLesson(false);
          setLessonTitle('');
          navigate(ROUTES.ADMIN_CURRICULUM_LESSON.replace(':lessonId', String(lesson.lessonId)));
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const submitQuiz = () => {
    if (!quizTitle.trim() || quizTitle.trim().length < 3) {
      toast.error('Quiz title must be at least 3 characters.');
      return;
    }
    editor.createQuiz.mutate(
      { title: quizTitle.trim(), isRequired: true, passingScore: 70 },
      {
        onSuccess: (quiz) => {
          toast.success('Quiz created.');
          setCreatingQuiz(false);
          setQuizTitle('');
          navigate(ROUTES.ADMIN_CURRICULUM_QUIZ.replace(':quizId', String(quiz.quizId)));
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const confirmArchive = () => {
    if (archiveTitle.trim() !== module.title) {
      toast.error('Type the module title to confirm archiving.');
      return;
    }
    editor.archive.mutate(undefined, {
      onSuccess: () => {
        toast.success('Module archived.');
        navigate(ROUTES.ADMIN_CURRICULUM);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={module.title}
        description={`Module ${module.moduleOrder} of the canonical course.`}
        actions={
          <Button variant="ghost" onClick={() => navigate(ROUTES.ADMIN_CURRICULUM)}>
            Back to curriculum
          </Button>
        }
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-card-foreground">Module details</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{module.isPublished ? 'Published' : 'Draft'}</span>
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
        <div className="mt-4">
          <ModuleForm
            initial={{
              title: module.title,
              description: module.description ?? '',
              estimatedMinutes: String(module.estimatedMinutes),
              moduleOrder: String(module.moduleOrder),
            }}
            submitLabel="Save Module"
            saving={editor.update.isPending}
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
                  onSuccess: () => toast.success('Module saved'),
                  onError: (error) => toast.error(error.message),
                },
              )
            }
          />
        </div>
      </Card>

      {creatingLesson ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-card-foreground">New lesson</h3>
          <div className="mt-4 space-y-4">
            <Input
              label="Lesson title"
              placeholder="e.g. Running your first container"
              minLength={3}
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreatingLesson(false)}>
                Cancel
              </Button>
              <Button isLoading={editor.createLesson.isPending} onClick={submitLesson}>
                Create lesson
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <LessonListPanel
        lessons={module.lessons}
        busyLessonIds={busyLessonIds}
        onPublish={(lessonId) =>
          editor.publishLesson.mutate(lessonId, {
            onSuccess: () => toast.success('Lesson published.'),
            onError: (error) => toast.error(error.message),
          })
        }
        onUnpublish={(lessonId) =>
          editor.updateLesson.mutate(
            { lessonId, data: { isPublished: false } },
            {
              onSuccess: () => toast.success('Lesson unpublished.'),
              onError: (error) => toast.error(error.message),
            },
          )
        }
        onReorder={handleReorderLessons}
        canManage
        onCreateLesson={() => setCreatingLesson(true)}
      />

      {creatingQuiz ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-card-foreground">New quiz</h3>
          <div className="mt-4 space-y-4">
            <Input
              label="Quiz title"
              placeholder="e.g. Module check-in quiz"
              minLength={3}
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreatingQuiz(false)}>
                Cancel
              </Button>
              <Button isLoading={editor.createQuiz.isPending} onClick={submitQuiz}>
                Create quiz
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <QuizListPanel
        quizzes={module.quizzes}
        canManage
        onCreateQuiz={() => setCreatingQuiz(true)}
      />

      <Modal open={archiving} onClose={() => setArchiving(false)} title="Archive module">
        <p className="modal-panel__body">
          This will hide all lessons from learners. Type the module title to confirm.
        </p>
        <div className="mt-4">
          <Input
            label="Module title"
            value={archiveTitle}
            onChange={(e) => setArchiveTitle(e.target.value)}
            placeholder={module.title}
          />
        </div>
        <div className="modal-panel__actions">
          <Button
            variant="secondary"
            onClick={() => {
              setArchiving(false);
              setArchiveTitle('');
            }}
            disabled={editor.archive.isPending}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmArchive} isLoading={editor.archive.isPending}>
            Archive
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default AdminModuleEditorPage;
