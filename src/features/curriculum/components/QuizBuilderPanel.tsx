import { useState } from 'react';
import { Button, Input } from '@/shared/components';
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
  multiple_choice: 'Multiple Choice (Single)',
  multiple_select: 'Multiple Select',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
};

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
  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings');

  // Quiz Settings state
  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description ?? '');
  const [passingScore, setPassingScore] = useState(String(quiz.passingScore));
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    quiz.timeLimitMinutes ? String(quiz.timeLimitMinutes) : '',
  );
  const [isRequired, setIsRequired] = useState(quiz.isRequired);

  // Field validation errors
  const [titleError, setTitleError] = useState<string | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);

  // Question editing state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [draftType, setDraftType] = useState<QuestionType>('multiple_choice');
  const [draftText, setDraftText] = useState('');
  const [draftPoints, setDraftPoints] = useState('10');
  const [draftExplanation, setDraftExplanation] = useState('');
  const [draftAnswers, setDraftAnswers] = useState<DraftAnswer[]>([
    { answerText: '', isCorrect: true },
    { answerText: '', isCorrect: false },
  ]);

  // Question field validation errors
  const [questionTextError, setQuestionTextError] = useState<string | null>(null);
  const [answersError, setAnswersError] = useState<string | null>(null);

  const handleSaveQuizSettings = (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = true;
    if (!title.trim() || title.trim().length < 3) {
      setTitleError('Quiz title must be at least 3 characters.');
      isValid = false;
    }
    const scoreNum = Number(passingScore);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 100) {
      setScoreError('Passing score must be between 1% and 100%.');
      isValid = false;
    }
    if (!isValid) return;

    onUpdateQuiz({
      title: title.trim(),
      description: description.trim() || null,
      passingScore: scoreNum,
      timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
      isRequired,
    });
  };

  const openNewQuestion = () => {
    setEditingQuestionId(null);
    setDraftType('multiple_choice');
    setDraftText('');
    setDraftPoints('10');
    setDraftExplanation('');
    setDraftAnswers([
      { answerText: '', isCorrect: true },
      { answerText: '', isCorrect: false },
    ]);
    setQuestionTextError(null);
    setAnswersError(null);
    setIsFormOpen(true);
  };

  const openEditQuestion = (q: QuestionDto) => {
    setEditingQuestionId(q.questionId);
    setDraftType(q.questionType);
    setDraftText(q.questionText);
    setDraftPoints(String(q.points));
    setDraftExplanation(q.explanation ?? '');
    setDraftAnswers(
      q.answers.map((a) => ({ answerText: a.answerText, isCorrect: a.isCorrect })),
    );
    setQuestionTextError(null);
    setAnswersError(null);
    setIsFormOpen(true);
  };

  const setAnswerChoice = (index: number, patch: Partial<DraftAnswer>) => {
    setDraftAnswers((prev) =>
      prev.map((ans, i) => (i === index ? { ...ans, ...patch } : ans)),
    );
    if (answersError) setAnswersError(null);
  };

  const setCorrectAnswer = (index: number) => {
    if (draftType === 'multiple_select') {
      setDraftAnswers((prev) =>
        prev.map((ans, i) => (i === index ? { ...ans, isCorrect: !ans.isCorrect } : ans)),
      );
    } else {
      setDraftAnswers((prev) =>
        prev.map((ans, i) => ({ ...ans, isCorrect: i === index })),
      );
    }
    if (answersError) setAnswersError(null);
  };

  const addChoice = () => {
    setDraftAnswers((prev) => [...prev, { answerText: '', isCorrect: false }]);
  };

  const removeChoice = (index: number) => {
    if (draftAnswers.length <= 2) return;
    setDraftAnswers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!draftText.trim() || draftText.trim().length < 3) {
      setQuestionTextError('Question text must be at least 3 characters.');
      valid = false;
    }

    if (draftAnswers.length < 2) {
      setAnswersError('A question must have at least 2 answer choices.');
      valid = false;
    } else if (draftAnswers.some((a) => !a.answerText.trim())) {
      setAnswersError('All answer choices must have text.');
      valid = false;
    } else if (!draftAnswers.some((a) => a.isCorrect)) {
      setAnswersError('Please mark at least one correct answer choice.');
      valid = false;
    }

    if (!valid) return;

    const payloadAnswers: AnswerInput[] = draftAnswers.map((a, i) => ({
      answerText: a.answerText.trim(),
      isCorrect: a.isCorrect,
      answerOrder: i + 1,
    }));

    if (editingQuestionId !== null) {
      onUpdateQuestion(editingQuestionId, {
        questionText: draftText.trim(),
        questionType: draftType,
        points: Number(draftPoints) || 10,
        explanation: draftExplanation.trim() || null,
        answers: payloadAnswers,
      });
    } else {
      onCreateQuestion({
        questionText: draftText.trim(),
        questionType: draftType,
        points: Number(draftPoints) || 10,
        explanation: draftExplanation.trim() || null,
        questionOrder: quiz.questions.length + 1,
        answers: payloadAnswers,
      });
    }

    setIsFormOpen(false);
  };

  return (
    <div className="space-y-5 text-left">
      {/* Top Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 text-xs font-mono font-semibold transition-colors cursor-pointer border-b-2 -mb-1 ${
            activeTab === 'settings'
              ? 'border-brand-600 text-card-foreground'
              : 'border-transparent text-muted hover:text-card-foreground'
          }`}
        >
          Quiz Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`px-3 py-1.5 text-xs font-mono font-semibold transition-colors cursor-pointer border-b-2 -mb-1 flex items-center gap-1.5 ${
            activeTab === 'questions'
              ? 'border-brand-600 text-card-foreground'
              : 'border-transparent text-muted hover:text-card-foreground'
          }`}
        >
          <span>Questions Pool</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-paper border border-border text-muted">
            {quiz.questions.length}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: Quiz Settings ─────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveQuizSettings} className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-md border border-border bg-paper/40">
            <div>
              <p className="text-xs font-mono font-semibold text-card-foreground">Publication Status</p>
              <p className="text-[11px] text-muted">
                {quiz.isPublished ? 'Live and accessible to enrolled learners' : 'Draft mode (hidden from learners)'}
              </p>
            </div>
            <PublishToggle
              isPublished={quiz.isPublished}
              label={quiz.title}
              busy={publishing}
              onPublish={() => onPublishChange(true)}
              onUnpublish={() => onPublishChange(false)}
            />
          </div>

          <Input
            label="Quiz Title"
            value={title}
            error={titleError ?? undefined}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(null);
            }}
            placeholder="e.g. Container Networking & CNI Assessment"
            required
          />

          <div>
            <label htmlFor="quiz-desc-input" className="input-label block mb-1">
              Description & Objectives
            </label>
            <textarea
              id="quiz-desc-input"
              rows={3}
              className="input-field w-full text-xs font-mono leading-relaxed"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the skills evaluated in this quiz."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Passing Threshold Score (%)"
              type="number"
              min={1}
              max={100}
              value={passingScore}
              error={scoreError ?? undefined}
              onChange={(e) => {
                setPassingScore(e.target.value);
                if (scoreError) setScoreError(null);
              }}
              required
            />

            <Input
              label="Time Limit (Minutes, optional)"
              type="number"
              min={1}
              max={180}
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(e.target.value)}
              placeholder="e.g. 20 (leave blank for unlimited)"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="quiz-mandatory"
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="h-4 w-4 accent-brand-600 rounded-xs cursor-pointer"
            />
            <label htmlFor="quiz-mandatory" className="text-xs font-mono text-card-foreground cursor-pointer">
              Mandatory completion for course certification
            </label>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button variant="primary" size="sm" type="submit" isLoading={savingQuiz}>
              Save Quiz Settings
            </Button>
          </div>
        </form>
      )}

      {/* ─── TAB 2: Questions Pool ────────────────────────────────────── */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Header Action */}
          {!isFormOpen && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted">
                {quiz.questions.length} total questions ({quiz.questions.reduce((sum, q) => sum + q.points, 0)} total XP)
              </span>
              <Button variant="secondary" size="sm" onClick={openNewQuestion}>
                + Add Question
              </Button>
            </div>
          )}

          {/* Inline Question Create/Edit Form */}
          {isFormOpen && (
            <form onSubmit={handleSaveQuestion} className="space-y-4 p-4 rounded-md border border-brand-500/40 bg-brand-50/5">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-mono font-bold text-card-foreground">
                  {editingQuestionId !== null ? 'Edit Question' : 'New Question'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-muted hover:text-card-foreground text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="input-label block mb-1">Question Prompt</label>
                <textarea
                  rows={3}
                  className={`input-field w-full text-xs font-mono leading-relaxed ${
                    questionTextError ? 'input-field--error' : ''
                  }`}
                  value={draftText}
                  onChange={(e) => {
                    setDraftText(e.target.value);
                    if (questionTextError) setQuestionTextError(null);
                  }}
                  placeholder="e.g. Which component is responsible for pod IP assignment in a Kubernetes cluster?"
                  required
                />
                {questionTextError && <p className="input-error mt-1">{questionTextError}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="q-type-select" className="input-label block mb-1">
                    Question Type
                  </label>
                  <select
                    id="q-type-select"
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value as QuestionType)}
                    className="filter-input w-full text-xs font-mono h-9"
                  >
                    {Object.entries(QUESTION_TYPE_LABELS).map(([val, lbl]) => (
                      <option key={val} value={val}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="XP Points"
                  type="number"
                  min={1}
                  max={100}
                  value={draftPoints}
                  onChange={(e) => setDraftPoints(e.target.value)}
                  required
                />
              </div>

              {/* Answer Choices */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="input-label">Answer Choices & Correct Option</label>
                  <span className="text-[10px] font-mono text-muted">
                    {draftType === 'multiple_select' ? 'Select all that apply' : 'Select single correct answer'}
                  </span>
                </div>

                {answersError && <p className="input-error">{answersError}</p>}

                <div className="space-y-2">
                  {draftAnswers.map((answer, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrectAnswer(index)}
                        className={`w-6 h-6 rounded-xs border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          answer.isCorrect
                            ? 'bg-emerald-500 border-emerald-600 text-white font-bold text-xs'
                            : 'border-border bg-paper hover:border-card-foreground text-transparent'
                        }`}
                        title={answer.isCorrect ? 'Correct Answer' : 'Click to mark as correct'}
                      >
                        ✓
                      </button>

                      <input
                        type="text"
                        value={answer.answerText}
                        onChange={(e) => setAnswerChoice(index, { answerText: e.target.value })}
                        placeholder={`Option ${index + 1}`}
                        className="input-field flex-1 text-xs font-mono h-8"
                      />

                      {draftAnswers.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeChoice(index)}
                          className="text-muted hover:text-signal p-1 transition-colors cursor-pointer"
                          title="Remove option"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <Button variant="secondary" size="sm" type="button" onClick={addChoice}>
                    + Add Choice
                  </Button>
                </div>
              </div>

              {/* Explanation Field */}
              <div>
                <label className="input-label block mb-1">
                  Explanation & Learner Feedback (Optional)
                </label>
                <textarea
                  rows={2}
                  className="input-field w-full text-xs font-mono"
                  value={draftExplanation}
                  onChange={(e) => setDraftExplanation(e.target.value)}
                  placeholder="Explain why this answer is correct. Rendered after the learner completes the attempt."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={savingQuestion}>
                  {editingQuestionId !== null ? 'Save Changes' : 'Add Question'}
                </Button>
              </div>
            </form>
          )}

          {/* List of Existing Questions */}
          <div className="space-y-2">
            {quiz.questions.length === 0 && !isFormOpen ? (
              <div className="p-8 text-center border border-dashed border-border rounded-md bg-paper/20">
                <p className="text-xs font-mono text-muted">No questions added to this quiz yet.</p>
                <Button variant="primary" size="sm" className="mt-3" onClick={openNewQuestion}>
                  + Create First Question
                </Button>
              </div>
            ) : (
              quiz.questions.map((q, qIndex) => (
                <div
                  key={q.questionId}
                  className="p-3 rounded-md border border-border bg-card/40 space-y-2 hover:border-card-foreground/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-muted font-bold">#{qIndex + 1}</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-paper border border-border uppercase font-semibold text-muted">
                          {QUESTION_TYPE_LABELS[q.questionType]}
                        </span>
                        <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-bold">
                          +{q.points} XP
                        </span>
                      </div>
                      <p className="text-xs font-medium text-card-foreground leading-snug">{q.questionText}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditQuestion(q)}
                        className="px-2 py-0.5 rounded-xs border border-border bg-paper hover:bg-surface-hover text-card-foreground text-[11px] font-mono transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Answers preview */}
                  <div className="space-y-1 pl-2 border-l border-border/60">
                    {q.answers.map((ans) => (
                      <div key={ans.answerId} className="flex items-center gap-1.5 text-[11px] font-mono">
                        {ans.isCorrect ? (
                          <span className="text-emerald-500 font-bold">✓</span>
                        ) : (
                          <span className="text-muted">○</span>
                        )}
                        <span className={ans.isCorrect ? 'text-card-foreground font-semibold' : 'text-muted'}>
                          {ans.answerText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizBuilderPanel;
