import { useState } from 'react';
import { Button, Input, toast } from '@/shared/components';
import { PublishToggle } from './PublishToggle';
import type {
  AnswerInput,
  CreateQuestionPayload,
  QuestionDto,
  QuestionType,
  QuizDetailDto,
  UpdateQuestionPayload,
  UpdateQuizPayload,
} from '../types';

interface DraftAnswer {
  answerText: string;
  isCorrect: boolean;
}

interface QuizBuilderPanelProps {
  quiz: QuizDetailDto;
  savingQuiz: boolean;
  savingQuestion: boolean;
  publishing: boolean;
  onUpdateQuiz: (payload: UpdateQuizPayload) => void;
  onPublishChange: (isPublished: boolean) => void;
  onCreateQuestion: (payload: CreateQuestionPayload) => void;
  onUpdateQuestion: (questionId: number, payload: UpdateQuestionPayload) => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple choice',
  true_false: 'True / false',
  fill_blank: 'Fill in the blank',
  multiple_select: 'Multiple select',
};

function validateAnswers(type: QuestionType, answers: DraftAnswer[]): string | null {
  if (answers.length === 0) {
    return 'Add at least one answer.';
  }
  if (answers.some((answer) => !answer.answerText.trim())) {
    return 'Every answer needs text.';
  }
  const correct = answers.filter((answer) => answer.isCorrect).length;
  if (type === 'multiple_choice' || type === 'true_false') {
    if (correct !== 1) {
      return 'Single-answer questions need exactly one correct answer.';
    }
  }
  if (type === 'multiple_select' && correct < 1) {
    return 'Select at least one correct answer.';
  }
  if (type === 'fill_blank' && correct < 1) {
    return 'Mark the expected answer as correct.';
  }
  return null;
}

/** F4 SCR-F4-04: quiz metadata form plus question and answer CRUD (F4-API-19..22). */
export function QuizBuilderPanel({
  quiz,
  savingQuiz,
  savingQuestion,
  publishing,
  onUpdateQuiz,
  onPublishChange,
  onCreateQuestion,
  onUpdateQuestion,
}: QuizBuilderPanelProps) {
  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description ?? '');
  const [passingScore, setPassingScore] = useState(String(quiz.passingScore));
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    quiz.timeLimitMinutes ? String(quiz.timeLimitMinutes) : '',
  );
  const [isRequired, setIsRequired] = useState(quiz.isRequired);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftType, setDraftType] = useState<QuestionType>('multiple_choice');
  const [draftText, setDraftText] = useState('');
  const [draftPoints, setDraftPoints] = useState('10');
  const [draftExplanation, setDraftExplanation] = useState('');
  const [draftAnswers, setDraftAnswers] = useState<DraftAnswer[]>([
    { answerText: '', isCorrect: false },
  ]);

  const saveQuizMeta = () => {
    if (!title.trim() || title.trim().length < 3) {
      toast.error('Quiz title must be at least 3 characters.');
      return;
    }
    onUpdateQuiz({
      title: title.trim(),
      description: description.trim() || null,
      passingScore: Number(passingScore),
      timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
      isRequired,
    });
  };

  const setAnswer = (index: number, patch: Partial<DraftAnswer>) => {
    setDraftAnswers((answers) =>
      answers.map((answer, i) => (i === index ? { ...answer, ...patch } : answer)),
    );
  };

  const openDraft = (type: QuestionType, text: string, points: string, explanation: string) => {
    setDraftType(type);
    setDraftText(text);
    setDraftPoints(points);
    setDraftExplanation(explanation);
    setAdding(true);
    setEditingId(null);
  };

  const submitQuestion = () => {
    if (!draftText.trim() || draftText.trim().length < 3) {
      toast.error('Question text must be at least 3 characters.');
      return;
    }
    const validationError = validateAnswers(draftType, draftAnswers);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const answers: AnswerInput[] = draftAnswers.map((answer, index) => ({
      answerText: answer.answerText.trim(),
      isCorrect: answer.isCorrect,
      answerOrder: index + 1,
    }));

    if (editingId !== null) {
      onUpdateQuestion(editingId, {
        questionText: draftText.trim(),
        questionType: draftType,
        points: Number(draftPoints),
        explanation: draftExplanation.trim() || null,
        answers,
      });
      setEditingId(null);
    } else {
      onCreateQuestion({
        questionText: draftText.trim(),
        questionType: draftType,
        points: Number(draftPoints),
        explanation: draftExplanation.trim() || null,
        questionOrder: quiz.questions.length + 1,
        answers,
      });
    }
    setAdding(false);
    setDraftText('');
    setDraftExplanation('');
    setDraftAnswers([{ answerText: '', isCorrect: false }]);
  };

  const startEditing = (question: QuestionDto) => {
    setEditingId(question.questionId);
    setDraftType(question.questionType);
    setDraftText(question.questionText);
    setDraftPoints(String(question.points));
    setDraftExplanation(question.explanation ?? '');
    setDraftAnswers(
      question.answers.map((answer) => ({
        answerText: answer.answerText,
        isCorrect: answer.isCorrect,
      })),
    );
    setAdding(true);
  };

  const toggleActive = (question: QuestionDto) => {
    onUpdateQuestion(question.questionId, { isActive: !question.isActive });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-surface/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-card-foreground">Quiz settings</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{quiz.isPublished ? 'Published' : 'Draft'}</span>
            <PublishToggle
              isPublished={quiz.isPublished}
              label={quiz.title}
              busy={publishing}
              onPublish={() => onPublishChange(true)}
              onUnpublish={() => onPublishChange(false)}
            />
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <Input
            label="Quiz title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Containerization Fundamentals Quiz"
            required
          />
          <div>
            <label htmlFor="quiz-description" className="input-label">
              Description
            </label>
            <textarea
              id="quiz-description"
              rows={3}
              className="input-field w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description."
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Passing score %"
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
            />
            <Input
              label="Time limit (min)"
              type="number"
              min={1}
              max={600}
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(e.target.value)}
              placeholder="None"
            />
            <label className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="text-sm text-card-foreground">Required</span>
            </label>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveQuizMeta} isLoading={savingQuiz}>
              Save quiz settings
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Questions</h3>
            <p className="text-sm text-muted">
              {quiz.questions.length} {quiz.questions.length === 1 ? 'question' : 'questions'} in
              this quiz.
            </p>
          </div>
          {!adding ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDraftAnswers([{ answerText: '', isCorrect: false }]);
                openDraft('multiple_choice', '', '10', '');
              }}
            >
              + Add Question
            </Button>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          {adding ? (
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="question-type" className="input-label">
                    Type
                  </label>
                  <select
                    id="question-type"
                    className="input-field w-full"
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value as QuestionType)}
                  >
                    {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Points"
                  type="number"
                  min={1}
                  max={100}
                  value={draftPoints}
                  onChange={(e) => setDraftPoints(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="question-text" className="input-label">
                  Question
                </label>
                <textarea
                  id="question-text"
                  rows={3}
                  className="input-field w-full"
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Enter the question text."
                />
              </div>
              <div>
                <label htmlFor="question-explanation" className="input-label">
                  Explanation
                </label>
                <textarea
                  id="question-explanation"
                  rows={2}
                  className="input-field w-full"
                  value={draftExplanation}
                  onChange={(e) => setDraftExplanation(e.target.value)}
                  placeholder="Shown after answering."
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-card-foreground">Answers</p>
                {draftAnswers.map((answer, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={answer.isCorrect}
                      onChange={(e) => setAnswer(index, { isCorrect: e.target.checked })}
                      aria-label={`Mark answer ${index + 1} as correct`}
                      className="h-4 w-4 accent-brand-600"
                    />
                    <Input
                      aria-label={`Answer ${index + 1} text`}
                      value={answer.answerText}
                      onChange={(e) => setAnswer(index, { answerText: e.target.value })}
                      placeholder={`Answer ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={draftAnswers.length === 1}
                      onClick={() =>
                        setDraftAnswers((answers) => answers.filter((_, i) => i !== index))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDraftAnswers((answers) => [...answers, { answerText: '', isCorrect: false }])
                  }
                >
                  + Add Answer
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAdding(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={submitQuestion} isLoading={savingQuestion}>
                  {editingId !== null ? 'Save question' : 'Add question'}
                </Button>
              </div>
            </div>
          ) : null}

          {quiz.questions.length === 0 && !adding ? (
            <p className="py-4 text-sm text-muted">No questions yet. Add the first question.</p>
          ) : null}

          {quiz.questions.map((question) => (
            <div key={question.questionId} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-card-foreground">
                    {question.questionOrder}. {question.questionText}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {QUESTION_TYPE_LABELS[question.questionType]} · {question.points} points ·{' '}
                    {question.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => startEditing(question)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(question)}>
                    {question.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
              <ul className="mt-3 space-y-1 border-t border-border pt-3">
                {question.answers.map((answer) => (
                  <li key={answer.answerId} className="flex items-center gap-2 text-sm">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        answer.isCorrect ? 'bg-green-600' : 'bg-border'
                      }`}
                      aria-hidden="true"
                    />
                    <span className={answer.isCorrect ? 'text-card-foreground' : 'text-muted'}>
                      {answer.answerText}
                    </span>
                    {answer.isCorrect ? (
                      <span className="text-xs uppercase tracking-wide text-green-700">
                        Correct
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
