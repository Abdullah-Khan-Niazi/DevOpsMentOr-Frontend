import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import type { QuizDetailDto } from '../types';

interface QuizListPanelProps {
  quizzes: QuizDetailDto[];
  canManage: boolean;
  onCreateQuiz: () => void;
}

/** F4 SCR-F4-02/04: quiz inventory with question counts (F4-API-19..22). */
export function QuizListPanel({ quizzes, canManage, onCreateQuiz }: QuizListPanelProps) {
  const navigate = useNavigate();

  const openBuilder = (quizId: number) => {
    navigate(ROUTES.ADMIN_CURRICULUM_QUIZ.replace(':quizId', String(quizId)));
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Quizzes</h3>
          <p className="text-sm text-muted">Assessments attached to this module.</p>
        </div>
        {canManage ? (
          <Button variant="secondary" size="sm" onClick={onCreateQuiz}>
            + New Quiz
          </Button>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {quizzes.length === 0 ? (
          <EmptyState
            title="No quizzes yet."
            description="Add a quiz to assess understanding of this module."
          />
        ) : (
          quizzes.map((quiz) => (
            <div
              key={quiz.quizId}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface/50 p-3"
            >
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openBuilder(quiz.quizId)}
                    className="text-left font-medium text-card-foreground hover:underline"
                  >
                    {quiz.title}
                  </button>
                  <span className="text-xs uppercase tracking-wide text-muted">
                    {quiz.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'} · Pass
                  mark {quiz.passingScore}% · {quiz.isRequired ? 'Required' : 'Optional'}
                  {quiz.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min` : ''}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => openBuilder(quiz.quizId)}>
                  Build
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
