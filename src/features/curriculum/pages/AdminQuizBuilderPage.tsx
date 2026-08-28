import { useNavigate, useParams } from 'react-router-dom';
import { Button, ErrorState, LoadingState, PageHeader, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { QuizBuilderPanel } from '../components/QuizBuilderPanel';
import { useAdminQuizEditor } from '../hooks';

/** F4 SCR-F4-04: quiz builder with question and answer CRUD (F4-API-20..22). */
export function AdminQuizBuilderPage() {
  const { quizId = '' } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const builder = useAdminQuizEditor(quizId);

  if (builder.query.isLoading) {
    return (
      <div>
        <PageHeader title="Quiz builder" />
        <LoadingState label="Loading quiz…" />
      </div>
    );
  }

  if (builder.query.isError || !builder.query.data) {
    return (
      <div>
        <PageHeader title="Quiz builder" />
        <ErrorState
          message={builder.query.error?.message ?? 'Unable to load this quiz.'}
          onRetry={() => void builder.query.refetch()}
        />
      </div>
    );
  }

  const quiz = builder.query.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={quiz.title}
        description={`Module quiz · ${quiz.isPublished ? 'Published' : 'Draft'}`}
        actions={
          <Button
            variant="ghost"
            onClick={() =>
              navigate(ROUTES.ADMIN_CURRICULUM_MODULE.replace(':moduleId', String(quiz.moduleId)))
            }
          >
            Back to module
          </Button>
        }
      />

      <QuizBuilderPanel
        quiz={quiz}
        savingQuiz={builder.update.isPending}
        savingQuestion={builder.createQuestion.isPending || builder.updateQuestion.isPending}
        publishing={builder.update.isPending}
        onUpdateQuiz={(payload) =>
          builder.update.mutate(payload, {
            onSuccess: () => toast.success('Quiz settings saved.'),
            onError: (error) => toast.error(error.message),
          })
        }
        onPublishChange={(isPublished) =>
          builder.update.mutate(
            { isPublished },
            {
              onSuccess: () => toast.success(isPublished ? 'Quiz published.' : 'Quiz unpublished.'),
              onError: (error) => toast.error(error.message),
            },
          )
        }
        onCreateQuestion={(payload) =>
          builder.createQuestion.mutate(payload, {
            onSuccess: () => toast.success('Question added.'),
            onError: (error) => toast.error(error.message),
          })
        }
        onUpdateQuestion={(questionId, payload) =>
          builder.updateQuestion.mutate(
            { questionId, data: payload },
            {
              onSuccess: () => toast.success('Question saved.'),
              onError: (error) => toast.error(error.message),
            },
          )
        }
      />
    </div>
  );
}

export default AdminQuizBuilderPage;
