import { useState } from 'react';
import { Button, Input } from '@/shared/components';
import { PublishToggle } from './PublishToggle';
import type {
  AnswerInput,
  BucketSortConfigDto,
  CreateQuestionPayload,
  OrderingConfigDto,
  QuestionDto,
  QuestionType,
  QuizDetailDto,
  UpdateQuestionPayload,
  UpdateQuizPayload,
} from '../types';

interface DraftAnswer {
  answerText: string;
  isCorrect: boolean;
  /** 1-based index into the draft bucket list; only meaningful for bucket_sort. */
  bucketNumber: number;
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
  bucket_sort: 'Bucket Sort (Classify Cards)',
  ordering: 'Ordering (Arrange Sequence)',
};

/** Per-type heading + hint rendered above each dedicated answer editor. */
const ANSWER_SECTION_META: Record<QuestionType, { label: string; hint: string }> = {
  multiple_choice: {
    label: 'Options & Correct Answer',
    hint: 'Radio marks the single correct option',
  },
  true_false: {
    label: 'True / False Statements',
    hint: 'Fixed statements — pick the correct one',
  },
  multiple_select: {
    label: 'Options & Correct Answers',
    hint: 'Check every option that is correct',
  },
  fill_blank: {
    label: 'Accepted Answers',
    hint: 'Any listed answer is accepted (case-insensitive)',
  },
  ordering: {
    label: 'Items in Correct Sequence',
    hint: 'Use ↑ / ↓ to set the correct order',
  },
  bucket_sort: {
    label: 'Cards & Bucket Assignment',
    hint: 'Assign each card to a bucket',
  },
};

const MIN_CHOICES = 2;
const MIN_ACCEPTED_ANSWERS = 1;
const MIN_ORDERING_ITEMS = 2;
const MIN_BUCKET_CARDS = 2;
const MIN_BUCKETS = 2;
const MAX_BUCKETS = 8;

/** Minimum editable rows per type; also drives remove-button disabling. */
function minimumRowsFor(type: QuestionType): number {
  switch (type) {
    case 'fill_blank':
      return MIN_ACCEPTED_ANSWERS;
    case 'ordering':
      return MIN_ORDERING_ITEMS;
    case 'bucket_sort':
      return MIN_BUCKET_CARDS;
    case 'true_false':
      return 2;
    default:
      return MIN_CHOICES;
  }
}

/** Reads `config.buckets` defensively (admin payloads may be legacy/malformed). */
function readConfigBuckets(config: Record<string, unknown> | null): string[] {
  if (!config || !Array.isArray(config.buckets)) return [];
  return config.buckets.filter((bucket): bucket is string => typeof bucket === 'string');
}

function readConfigInstructions(config: Record<string, unknown> | null): string {
  return config && typeof config.instructions === 'string' ? config.instructions : '';
}

interface TypeConversion {
  answers: DraftAnswer[];
  /** Replacement bucket labels when the target type needs a bucket list. */
  buckets?: string[];
  /** Inline note describing what happened to previously typed rows. */
  notice: string | null;
}

/** Fixed rows for true/false; `correctIndex` 0 marks True, 1 marks False. */
function canonicalTrueFalseRows(correctIndex: number): DraftAnswer[] {
  return [
    { answerText: 'True', isCorrect: correctIndex !== 1, bucketNumber: 1 },
    { answerText: 'False', isCorrect: correctIndex === 1, bucketNumber: 2 },
  ];
}

function hasTypedAnswerText(answers: DraftAnswer[]): boolean {
  return answers.some((answer) => answer.answerText.trim().length > 0);
}

function isCanonicalTrueFalse(answers: DraftAnswer[]): boolean {
  return (
    answers.length === 2 &&
    answers[0].answerText.trim().toLowerCase() === 'true' &&
    answers[1].answerText.trim().toLowerCase() === 'false' &&
    answers.filter((answer) => answer.isCorrect).length === 1
  );
}

/**
 * Converts the in-progress draft when the author switches question type.
 * Text is carried across all list-like types; per-type metadata (correct
 * flags, bucket numbers) is normalized. The returned `notice` states exactly
 * what was kept, reinterpreted, or replaced so nothing is silently lost.
 */
function convertDraftForType(
  nextType: QuestionType,
  previousType: QuestionType,
  answers: DraftAnswer[],
  buckets: string[],
): TypeConversion {
  if (nextType === previousType) {
    return { answers, notice: null };
  }

  const typedContent = hasTypedAnswerText(answers);
  const normalizedBuckets = buckets.length >= MIN_BUCKETS ? buckets : ['', ''];

  if (nextType === 'true_false') {
    const correctIndex = answers.findIndex((answer) => answer.isCorrect) === 1 ? 1 : 0;
    if (isCanonicalTrueFalse(answers)) {
      // Already True/False with one correct flag — normalize casing only.
      return { answers: canonicalTrueFalseRows(correctIndex), notice: null };
    }
    return {
      answers: canonicalTrueFalseRows(correctIndex),
      notice: typedContent
        ? 'True/False uses two fixed statements — your previous rows were replaced by “True” and “False”. Mark the correct statement with the radio.'
        : 'True/False uses two fixed statements, “True” and “False”. Mark the correct statement with the radio.',
    };
  }

  const padded = [...answers];
  const minimum = minimumRowsFor(nextType);
  while (padded.length < minimum) {
    padded.push({ answerText: '', isCorrect: false, bucketNumber: padded.length + 1 });
  }

  if (nextType === 'fill_blank') {
    if (previousType === 'true_false') {
      return {
        answers: [{ answerText: '', isCorrect: true, bucketNumber: 1 }],
        notice: typedContent
          ? 'Fill-in-the-blank uses a list of accepted answers, so the fixed True/False statements were cleared. Every answer listed below is accepted (case-insensitive).'
          : null,
      };
    }
    return {
      answers: padded.map((answer) => ({ ...answer, isCorrect: true })),
      notice: typedContent
        ? 'Switched to fill-in-the-blank: your answer texts were kept as accepted answers, and every listed answer is accepted (case-insensitive). Remove anything that should not count as correct.'
        : null,
    };
  }

  if (nextType === 'ordering') {
    let notice: string | null = null;
    if (typedContent && previousType === 'bucket_sort') {
      notice =
        'Cards became sequence items and the previous bucket assignments were cleared — use ↑ / ↓ to set the correct order.';
    } else if (typedContent && previousType !== 'ordering') {
      notice =
        'Ordering saves the order shown below as the correct sequence — your answer texts were kept and can be rearranged with ↑ / ↓.';
    }
    return { answers: padded, notice };
  }

  if (nextType === 'bucket_sort') {
    return {
      answers: padded.map((answer, index) => ({
        ...answer,
        isCorrect: false,
        bucketNumber: (index % normalizedBuckets.length) + 1,
      })),
      buckets: normalizedBuckets,
      notice: typedContent
        ? previousType === 'ordering'
          ? 'Sequence items became cards: the previous order was cleared and each card was given a starting bucket. Review every assignment before saving.'
          : 'Your answer texts were kept as cards and given a starting bucket assignment — review every assignment before saving.'
        : null,
    };
  }

  // multiple_choice / multiple_select
  const flagBasedSource =
    previousType === 'multiple_choice' ||
    previousType === 'multiple_select' ||
    previousType === 'true_false';
  const rows = padded.map((answer) => ({
    ...answer,
    isCorrect: flagBasedSource ? answer.isCorrect : false,
  }));

  if (nextType === 'multiple_choice') {
    const correctCount = rows.filter((answer) => answer.isCorrect).length;
    if (correctCount > 1) {
      const firstCorrect = rows.findIndex((answer) => answer.isCorrect);
      return {
        answers: rows.map((answer, index) => ({ ...answer, isCorrect: index === firstCorrect })),
        notice:
          'Multiple choice allows a single correct option; only the first correct option was kept. Remove or unmark the extra ones.',
      };
    }
    let notice: string | null = null;
    if (!flagBasedSource && typedContent) {
      if (previousType === 'ordering') {
        notice =
          'Sequence items became options and the previous order was cleared — select the single correct option with the radio.';
      } else if (previousType === 'bucket_sort') {
        notice =
          'Cards became options and the previous bucket assignments were cleared — select the single correct option with the radio.';
      } else {
        notice =
          'Accepted answers became options — select the single correct option with the radio.';
      }
    }
    return { answers: rows, notice };
  }

  let notice: string | null = null;
  if (!flagBasedSource && typedContent) {
    if (previousType === 'ordering') {
      notice =
        'Sequence items became options and the previous order was cleared — check every option that should be accepted.';
    } else if (previousType === 'bucket_sort') {
      notice =
        'Cards became options and the previous bucket assignments were cleared — check every option that should be accepted.';
    } else {
      notice = 'Accepted answers became options — check every option that should be accepted.';
    }
  }
  return { answers: rows, notice };
}

interface ChoiceEditorProps {
  answers: DraftAnswer[];
  /** `true` renders checkboxes (multiple_select), `false` renders radios. */
  multiple: boolean;
  onTextChange: (index: number, text: string) => void;
  onMarkCorrect: (index: number) => void;
  onToggleCorrect: (index: number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

/** `multiple_choice` (radio) and `multiple_select` (checkbox) option rows. */
function ChoiceEditor({
  answers,
  multiple,
  onTextChange,
  onMarkCorrect,
  onToggleCorrect,
  onRemove,
  onAdd,
}: ChoiceEditorProps) {
  const canRemove = answers.length > MIN_CHOICES;
  return (
    <div className="space-y-2">
      {answers.map((answer, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            id={`draft-choice-${index}`}
            type={multiple ? 'checkbox' : 'radio'}
            name={multiple ? undefined : 'draft-correct-choice'}
            checked={answer.isCorrect}
            onChange={() => (multiple ? onToggleCorrect(index) : onMarkCorrect(index))}
            aria-label={
              multiple
                ? `Mark option ${index + 1} as a correct answer`
                : `Mark option ${index + 1} as the single correct answer`
            }
            className="h-4 w-4 shrink-0 cursor-pointer accent-brand-600"
          />
          <input
            type="text"
            value={answer.answerText}
            onChange={(event) => onTextChange(index, event.target.value)}
            placeholder={`Option ${index + 1}`}
            aria-label={`Option ${index + 1} text`}
            className="input-field h-8 flex-1 text-xs font-mono"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            title={canRemove ? 'Remove option' : 'At least two options are required.'}
            aria-label={`Remove option ${index + 1}`}
            className="shrink-0 cursor-pointer p-1 text-muted transition-colors hover:text-signal disabled:cursor-not-allowed disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}
      <Button variant="secondary" size="sm" type="button" onClick={onAdd}>
        + Add Option
      </Button>
    </div>
  );
}

interface TrueFalseEditorProps {
  answers: DraftAnswer[];
  onMarkCorrect: (index: number) => void;
}

/** `true_false`: exactly two fixed statements with a radio for the correct one. */
function TrueFalseEditor({ answers, onMarkCorrect }: TrueFalseEditorProps) {
  return (
    <div className="space-y-2">
      {answers.map((answer, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-md border border-border bg-paper/40 px-3 py-2"
        >
          <input
            id={`draft-tf-${index}`}
            type="radio"
            name="draft-tf-correct"
            checked={answer.isCorrect}
            onChange={() => onMarkCorrect(index)}
            aria-label={`Mark ${answer.answerText} as the correct statement`}
            className="h-4 w-4 shrink-0 cursor-pointer accent-brand-600"
          />
          <label
            htmlFor={`draft-tf-${index}`}
            className="flex-1 cursor-pointer text-xs font-mono font-semibold text-card-foreground"
          >
            {answer.answerText}
          </label>
        </div>
      ))}
      <p className="text-micro font-mono text-muted">
        This type always uses exactly two statements, so options cannot be added or removed.
      </p>
    </div>
  );
}

interface FillBlankEditorProps {
  answers: DraftAnswer[];
  onTextChange: (index: number, text: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

/** `fill_blank`: list of accepted answers — no dummy option rows or radios. */
function FillBlankEditor({ answers, onTextChange, onRemove, onAdd }: FillBlankEditorProps) {
  const canRemove = answers.length > MIN_ACCEPTED_ANSWERS;
  return (
    <div className="space-y-2">
      <p className="text-micro font-mono text-muted">
        Every answer listed here is accepted. Matching ignores capitalization and surrounding
        whitespace, so add synonyms as separate rows.
      </p>
      {answers.map((answer, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border border-border bg-paper text-caption font-mono text-muted">
            {index + 1}
          </span>
          <input
            type="text"
            value={answer.answerText}
            onChange={(event) => onTextChange(index, event.target.value)}
            placeholder={`Accepted answer ${index + 1}`}
            aria-label={`Accepted answer ${index + 1}`}
            className="input-field h-8 flex-1 text-xs font-mono"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            title={
              canRemove ? 'Remove accepted answer' : 'At least one accepted answer is required.'
            }
            aria-label={`Remove accepted answer ${index + 1}`}
            className="shrink-0 cursor-pointer p-1 text-muted transition-colors hover:text-signal disabled:cursor-not-allowed disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}
      <Button variant="secondary" size="sm" type="button" onClick={onAdd}>
        + Add Accepted Answer
      </Button>
    </div>
  );
}

interface OrderingEditorProps {
  answers: DraftAnswer[];
  onTextChange: (index: number, text: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

/** `ordering`: items in their correct sequence with ↑/↓ controls. */
function OrderingEditor({ answers, onTextChange, onMove, onRemove, onAdd }: OrderingEditorProps) {
  const canRemove = answers.length > MIN_ORDERING_ITEMS;
  return (
    <div className="space-y-2">
      <p className="text-micro font-mono text-muted">
        The order shown below is saved as the correct sequence; learners always see the items
        shuffled.
      </p>
      {answers.map((answer, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border border-border bg-paper text-caption font-mono text-card-foreground">
            {index + 1}
          </span>
          <input
            type="text"
            value={answer.answerText}
            onChange={(event) => onTextChange(index, event.target.value)}
            placeholder={`Step ${index + 1}`}
            aria-label={`Sequence item ${index + 1}`}
            className="input-field h-8 flex-1 text-xs font-mono"
          />
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            title="Move item up"
            aria-label={`Move item ${index + 1} up`}
            className="shrink-0 cursor-pointer p-1 text-muted transition-colors hover:text-card-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === answers.length - 1}
            title="Move item down"
            aria-label={`Move item ${index + 1} down`}
            className="shrink-0 cursor-pointer p-1 text-muted transition-colors hover:text-card-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            title={canRemove ? 'Remove item' : 'At least two sequence items are required.'}
            aria-label={`Remove item ${index + 1}`}
            className="shrink-0 cursor-pointer p-1 text-muted transition-colors hover:text-signal disabled:cursor-not-allowed disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}
      <Button variant="secondary" size="sm" type="button" onClick={onAdd}>
        + Add Item
      </Button>
    </div>
  );
}

interface BucketSortEditorProps {
  buckets: string[];
  cards: DraftAnswer[];
  onBucketTextChange: (index: number, text: string) => void;
  onAddBucket: () => void;
  onRemoveBucket: (index: number) => void;
  onCardTextChange: (index: number, text: string) => void;
  onCardBucketChange: (index: number, bucketNumber: number) => void;
  onRemoveCard: (index: number) => void;
  onAddCard: () => void;
}

/** `bucket_sort`: 2–8 bucket labels plus one bucket selector per card. */
function BucketSortEditor({
  buckets,
  cards,
  onBucketTextChange,
  onAddBucket,
  onRemoveBucket,
  onCardTextChange,
  onCardBucketChange,
  onRemoveCard,
  onAddCard,
}: BucketSortEditorProps) {
  const canRemoveBucket = buckets.length > MIN_BUCKETS;
  const canRemoveCard = cards.length > MIN_BUCKET_CARDS;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption font-mono font-semibold text-card-foreground">
            Buckets ({MIN_BUCKETS}–{MAX_BUCKETS})
          </span>
          <span className="text-micro font-mono text-muted">Learners pick one bucket per card</span>
        </div>
        {buckets.map((bucket, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border border-border bg-paper text-caption font-mono text-muted">
              {index + 1}
            </span>
            <input
              type="text"
              value={bucket}
              onChange={(event) => onBucketTextChange(index, event.target.value)}
              placeholder={`Bucket ${index + 1} name`}
              aria-label={`Bucket ${index + 1} name`}
              className="input-field h-8 flex-1 text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => onRemoveBucket(index)}
              disabled={!canRemoveBucket}
              title={
                canRemoveBucket ? 'Remove bucket' : `At least ${MIN_BUCKETS} buckets are required.`
              }
              aria-label={`Remove bucket ${index + 1}`}
              className="shrink-0 cursor-pointer p-1 text-muted transition-colors hover:text-signal disabled:cursor-not-allowed disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ))}
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={onAddBucket}
          disabled={buckets.length >= MAX_BUCKETS}
          title={
            buckets.length >= MAX_BUCKETS
              ? `A question supports at most ${MAX_BUCKETS} buckets.`
              : undefined
          }
        >
          + Add Bucket
        </Button>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption font-mono font-semibold text-card-foreground">
            Cards ({MIN_BUCKET_CARDS}+)
          </span>
          <span className="text-micro font-mono text-muted">
            Each card points at its correct bucket
          </span>
        </div>
        {cards.map((card, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={
                card.bucketNumber >= 1 && card.bucketNumber <= buckets.length
                  ? String(card.bucketNumber)
                  : ''
              }
              onChange={(event) => onCardBucketChange(index, Number(event.target.value))}
              aria-label={`Bucket for card ${index + 1}`}
              className="filter-input h-8 w-36 shrink-0 text-caption font-mono"
            >
              <option value="">Select…</option>
              {buckets.map((bucket, bucketIndex) => (
                <option key={bucketIndex} value={bucketIndex + 1}>
                  {`${bucketIndex + 1}. ${bucket.trim() || `Bucket ${bucketIndex + 1}`}`}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={card.answerText}
              onChange={(event) => onCardTextChange(index, event.target.value)}
              placeholder={`Card ${index + 1}`}
              aria-label={`Card ${index + 1} text`}
              className="input-field h-8 flex-1 text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => onRemoveCard(index)}
              disabled={!canRemoveCard}
              title={canRemoveCard ? 'Remove card' : 'At least two cards are required.'}
              aria-label={`Remove card ${index + 1}`}
              className="shrink-0 cursor-pointer p-1 text-muted transition-colors hover:text-signal disabled:cursor-not-allowed disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ))}
        <Button variant="secondary" size="sm" type="button" onClick={onAddCard}>
          + Add Card
        </Button>
      </div>
    </div>
  );
}

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
  const [draftInstructions, setDraftInstructions] = useState('');
  const [draftBuckets, setDraftBuckets] = useState<string[]>(['', '']);
  const [draftAnswers, setDraftAnswers] = useState<DraftAnswer[]>([
    { answerText: '', isCorrect: true, bucketNumber: 1 },
    { answerText: '', isCorrect: false, bucketNumber: 2 },
  ]);
  const [typeSwitchNotice, setTypeSwitchNotice] = useState<string | null>(null);

  // Question field validation errors
  const [questionTextError, setQuestionTextError] = useState<string | null>(null);
  const [answersError, setAnswersError] = useState<string | null>(null);

  const isRichType = draftType === 'bucket_sort' || draftType === 'ordering';

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

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setDraftType('multiple_choice');
    setDraftText('');
    setDraftPoints('10');
    setDraftExplanation('');
    setDraftInstructions('');
    setDraftBuckets(['', '']);
    setDraftAnswers([
      { answerText: '', isCorrect: true, bucketNumber: 1 },
      { answerText: '', isCorrect: false, bucketNumber: 2 },
    ]);
    setTypeSwitchNotice(null);
    setQuestionTextError(null);
    setAnswersError(null);
  };

  const openNewQuestion = () => {
    resetQuestionForm();
    setIsFormOpen(true);
  };

  const openEditQuestion = (q: QuestionDto) => {
    const orderedAnswers = [...q.answers].sort((a, b) => a.answerOrder - b.answerOrder);

    let nextAnswers: DraftAnswer[];
    if (q.questionType === 'true_false') {
      // Normalize legacy rows to the two fixed statements this type requires.
      const correctIndex = orderedAnswers.findIndex((answer) => answer.isCorrect);
      nextAnswers = canonicalTrueFalseRows(correctIndex === 1 ? 1 : 0);
    } else if (q.questionType === 'fill_blank') {
      nextAnswers =
        orderedAnswers.length > 0
          ? orderedAnswers.map((answer, index) => ({
              answerText: answer.answerText,
              isCorrect: true,
              bucketNumber: index + 1,
            }))
          : [{ answerText: '', isCorrect: true, bucketNumber: 1 }];
    } else {
      nextAnswers = orderedAnswers.map((answer, index) => ({
        answerText: answer.answerText,
        isCorrect: answer.isCorrect,
        bucketNumber: q.questionType === 'bucket_sort' ? answer.answerOrder : index + 1,
      }));
    }

    const buckets = readConfigBuckets(q.config).map((bucket) => bucket.trim());

    setEditingQuestionId(q.questionId);
    setDraftType(q.questionType);
    setDraftText(q.questionText);
    setDraftPoints(String(q.points));
    setDraftExplanation(q.explanation ?? '');
    setDraftBuckets(buckets.length >= MIN_BUCKETS ? buckets : ['', '']);
    setDraftInstructions(readConfigInstructions(q.config));
    setDraftAnswers(nextAnswers);
    setTypeSwitchNotice(null);
    setQuestionTextError(null);
    setAnswersError(null);
    setIsFormOpen(true);
  };

  const updateAnswerText = (index: number, answerText: string) => {
    setDraftAnswers((prev) =>
      prev.map((answer, i) => (i === index ? { ...answer, answerText } : answer)),
    );
    if (answersError) setAnswersError(null);
  };

  const updateBucketNumber = (index: number, bucketNumber: number) => {
    setDraftAnswers((prev) =>
      prev.map((answer, i) => (i === index ? { ...answer, bucketNumber } : answer)),
    );
    if (answersError) setAnswersError(null);
  };

  const markSingleCorrect = (index: number) => {
    setDraftAnswers((prev) => prev.map((answer, i) => ({ ...answer, isCorrect: i === index })));
    if (answersError) setAnswersError(null);
  };

  const toggleCorrect = (index: number) => {
    setDraftAnswers((prev) =>
      prev.map((answer, i) => (i === index ? { ...answer, isCorrect: !answer.isCorrect } : answer)),
    );
    if (answersError) setAnswersError(null);
  };

  const moveAnswer = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    setDraftAnswers((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    if (answersError) setAnswersError(null);
  };

  const addChoice = () => {
    setDraftAnswers((prev) => {
      const bucketNumber =
        draftType === 'bucket_sort'
          ? (prev.length % Math.max(draftBuckets.length, 1)) + 1
          : prev.length + 1;
      return [...prev, { answerText: '', isCorrect: false, bucketNumber }];
    });
    if (answersError) setAnswersError(null);
  };

  const removeChoice = (index: number) => {
    if (draftAnswers.length <= minimumRowsFor(draftType)) return;
    setDraftAnswers((prev) => prev.filter((_, i) => i !== index));
    if (answersError) setAnswersError(null);
  };

  const handleTypeChange = (nextType: QuestionType) => {
    if (nextType === draftType) return;
    const conversion = convertDraftForType(nextType, draftType, draftAnswers, draftBuckets);
    setDraftType(nextType);
    setDraftAnswers(conversion.answers);
    if (conversion.buckets) setDraftBuckets(conversion.buckets);
    setTypeSwitchNotice(conversion.notice);
    setAnswersError(null);
  };

  const updateBucketText = (index: number, text: string) => {
    setDraftBuckets((prev) => prev.map((bucket, i) => (i === index ? text : bucket)));
    if (answersError) setAnswersError(null);
  };

  const addBucket = () => {
    if (draftBuckets.length >= MAX_BUCKETS) return;
    setDraftBuckets((prev) => [...prev, '']);
    if (answersError) setAnswersError(null);
  };

  const removeBucket = (index: number) => {
    if (draftBuckets.length <= MIN_BUCKETS) return;
    setDraftBuckets((prev) => prev.filter((_, i) => i !== index));
    // Re-map card assignments: removed bucket becomes unassigned (0), later buckets shift down.
    setDraftAnswers((prev) =>
      prev.map((answer) => {
        if (answer.bucketNumber === index + 1) return { ...answer, bucketNumber: 0 };
        if (answer.bucketNumber > index + 1)
          return { ...answer, bucketNumber: answer.bucketNumber - 1 };
        return answer;
      }),
    );
    if (answersError) setAnswersError(null);
  };

  const validateQuestionDraft = (): boolean => {
    let valid = true;
    if (!draftText.trim() || draftText.trim().length < 3) {
      setQuestionTextError('Question text must be at least 3 characters.');
      valid = false;
    }

    const trimmedAnswers = draftAnswers.map((answer) => answer.answerText.trim());
    const trimmedBuckets = draftBuckets.map((bucket) => bucket.trim());
    const emptyAnswerIndex = trimmedAnswers.findIndex((text) => !text);
    let answersMessage: string | null = null;

    switch (draftType) {
      case 'true_false': {
        if (draftAnswers.length !== 2) {
          answersMessage =
            'True/false questions need exactly the two fixed statements “True” and “False”.';
        } else if (draftAnswers.filter((answer) => answer.isCorrect).length !== 1) {
          answersMessage = 'True/false needs exactly one correct option.';
        }
        break;
      }
      case 'multiple_choice': {
        if (draftAnswers.length < MIN_CHOICES) {
          answersMessage = 'Add at least two options.';
        } else if (emptyAnswerIndex >= 0) {
          answersMessage = `Option ${emptyAnswerIndex + 1} is empty — every option needs text.`;
        } else if (draftAnswers.filter((answer) => answer.isCorrect).length !== 1) {
          answersMessage = 'Multiple choice needs exactly one correct option.';
        }
        break;
      }
      case 'multiple_select': {
        if (draftAnswers.length < MIN_CHOICES) {
          answersMessage = 'Add at least two options.';
        } else if (emptyAnswerIndex >= 0) {
          answersMessage = `Option ${emptyAnswerIndex + 1} is empty — every option needs text.`;
        } else if (!draftAnswers.some((answer) => answer.isCorrect)) {
          answersMessage = 'Multiple select needs at least one correct option.';
        }
        break;
      }
      case 'fill_blank': {
        if (draftAnswers.length < MIN_ACCEPTED_ANSWERS) {
          answersMessage = 'Add at least one accepted answer.';
        } else if (emptyAnswerIndex >= 0) {
          answersMessage = `Accepted answer ${emptyAnswerIndex + 1} is empty — remove it or give it text.`;
        } else if (
          new Set(trimmedAnswers.map((text) => text.toLowerCase())).size !== trimmedAnswers.length
        ) {
          answersMessage = 'Accepted answers must be unique — matching is case-insensitive.';
        }
        break;
      }
      case 'ordering': {
        if (draftAnswers.length < MIN_ORDERING_ITEMS) {
          answersMessage = 'Ordering questions need at least two items.';
        } else if (emptyAnswerIndex >= 0) {
          answersMessage = `Sequence item ${emptyAnswerIndex + 1} is empty — every item needs text.`;
        }
        break;
      }
      case 'bucket_sort': {
        if (trimmedBuckets.length < MIN_BUCKETS) {
          answersMessage = `Add at least ${MIN_BUCKETS} buckets.`;
        } else if (trimmedBuckets.length > MAX_BUCKETS) {
          answersMessage = `A bucket sort question supports at most ${MAX_BUCKETS} buckets.`;
        } else {
          const emptyBucketIndex = trimmedBuckets.findIndex((bucket) => !bucket);
          if (emptyBucketIndex >= 0) {
            answersMessage = `Bucket ${emptyBucketIndex + 1} is empty — every bucket needs a name.`;
          } else if (
            new Set(trimmedBuckets.map((bucket) => bucket.toLowerCase())).size !==
            trimmedBuckets.length
          ) {
            answersMessage = 'Bucket names must be unique so learners get an unambiguous choice.';
          } else if (draftAnswers.length < MIN_BUCKET_CARDS) {
            answersMessage = 'Add at least two cards to classify.';
          } else if (emptyAnswerIndex >= 0) {
            answersMessage = `Card ${emptyAnswerIndex + 1} is empty — every card needs text.`;
          } else {
            const unassignedIndex = draftAnswers.findIndex(
              (answer) =>
                !Number.isInteger(answer.bucketNumber) ||
                answer.bucketNumber < 1 ||
                answer.bucketNumber > trimmedBuckets.length,
            );
            if (unassignedIndex >= 0) {
              answersMessage = `Assign card “${trimmedAnswers[unassignedIndex]}” to a bucket before saving.`;
            }
          }
        }
        break;
      }
    }

    if (answersMessage) {
      setAnswersError(answersMessage);
      valid = false;
    }
    return valid;
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = validateQuestionDraft();
    if (!valid) return;

    const instructions = draftInstructions.trim();
    const trimmedBuckets = draftBuckets.map((bucket) => bucket.trim());
    let payloadAnswers: AnswerInput[];
    let payloadConfig: Record<string, unknown> | null = null;

    switch (draftType) {
      case 'ordering': {
        // Array order is the correct sequence; `answerOrder` encodes each position.
        payloadAnswers = draftAnswers.map((answer, index) => ({
          answerText: answer.answerText.trim(),
          // Every item belongs to the correct sequence (backend ignores the flag here).
          isCorrect: true,
          answerOrder: index + 1,
        }));
        const config: OrderingConfigDto | null = instructions ? { instructions } : null;
        payloadConfig = config;
        break;
      }
      case 'bucket_sort': {
        // `answerOrder` encodes the 1-based bucket index; buckets live in config.
        payloadAnswers = draftAnswers.map((answer) => ({
          answerText: answer.answerText.trim(),
          isCorrect: false,
          answerOrder: answer.bucketNumber,
        }));
        const config: BucketSortConfigDto = instructions
          ? { buckets: trimmedBuckets, instructions }
          : { buckets: trimmedBuckets };
        payloadConfig = config;
        break;
      }
      case 'fill_blank': {
        // Every listed answer is an accepted answer; the backend matches case-insensitively.
        payloadAnswers = draftAnswers.map((answer, index) => ({
          answerText: answer.answerText.trim(),
          isCorrect: true,
          answerOrder: index + 1,
        }));
        break;
      }
      default: {
        // multiple_choice / true_false / multiple_select
        payloadAnswers = draftAnswers.map((answer, index) => ({
          answerText: answer.answerText.trim(),
          isCorrect: answer.isCorrect,
          answerOrder: index + 1,
        }));
        break;
      }
    }

    if (editingQuestionId !== null) {
      onUpdateQuestion(editingQuestionId, {
        questionText: draftText.trim(),
        questionType: draftType,
        config: payloadConfig,
        points: Number(draftPoints) || 10,
        explanation: draftExplanation.trim() || null,
        answers: payloadAnswers,
      });
    } else {
      onCreateQuestion({
        questionText: draftText.trim(),
        questionType: draftType,
        config: payloadConfig,
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
          className={`cursor-pointer border-b-2 -mb-1 px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
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
          className={`-mb-1 flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
            activeTab === 'questions'
              ? 'border-brand-600 text-card-foreground'
              : 'border-transparent text-muted hover:text-card-foreground'
          }`}
        >
          <span>Questions Pool</span>
          <span className="rounded-xs border border-border bg-paper px-1.5 py-0.2 font-mono text-micro text-muted">
            {quiz.questions.length}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: Quiz Settings ─────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveQuizSettings} className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-border bg-paper/40 p-3">
            <div>
              <p className="font-mono text-xs font-semibold text-card-foreground">
                Publication Status
              </p>
              <p className="text-caption text-muted">
                {quiz.isPublished
                  ? 'Live and accessible to enrolled learners'
                  : 'Draft mode (hidden from learners)'}
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
            <label htmlFor="quiz-desc-input" className="input-label mb-1 block">
              Description & Objectives
            </label>
            <textarea
              id="quiz-desc-input"
              rows={3}
              className="input-field w-full font-mono text-xs leading-relaxed"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the skills evaluated in this quiz."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              className="h-4 w-4 cursor-pointer rounded-xs accent-brand-600"
            />
            <label
              htmlFor="quiz-mandatory"
              className="cursor-pointer font-mono text-xs text-card-foreground"
            >
              Mandatory completion for course certification
            </label>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
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
              <span className="font-mono text-xs text-muted">
                {quiz.questions.length} total questions (
                {quiz.questions.reduce((sum, q) => sum + q.points, 0)} total XP)
              </span>
              <Button variant="secondary" size="sm" onClick={openNewQuestion}>
                + Add Question
              </Button>
            </div>
          )}

          {/* Inline Question Create/Edit Form */}
          {isFormOpen && (
            <form
              onSubmit={handleSaveQuestion}
              className="space-y-4 rounded-md border border-brand-500/40 bg-brand-50/5 p-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-xs font-bold text-card-foreground">
                  {editingQuestionId !== null ? 'Edit Question' : 'New Question'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="cursor-pointer font-mono text-xs text-muted hover:text-card-foreground"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="input-label mb-1 block">Question Prompt</label>
                <textarea
                  rows={3}
                  className={`input-field w-full font-mono text-xs leading-relaxed ${
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="q-type-select" className="input-label mb-1 block">
                    Question Type
                  </label>
                  <select
                    id="q-type-select"
                    value={draftType}
                    onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                    className="filter-input h-9 w-full font-mono text-xs"
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

              {/* Per-type answer editor */}
              <div className="space-y-3 rounded-md border border-border bg-paper/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="input-label">{ANSWER_SECTION_META[draftType].label}</label>
                  <span className="text-micro font-mono text-muted">
                    {ANSWER_SECTION_META[draftType].hint}
                  </span>
                </div>

                {typeSwitchNotice && (
                  <div
                    role="status"
                    className="flex items-start justify-between gap-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2"
                  >
                    <p className="font-mono text-caption text-warning">{typeSwitchNotice}</p>
                    <button
                      type="button"
                      onClick={() => setTypeSwitchNotice(null)}
                      aria-label="Dismiss type change note"
                      className="shrink-0 cursor-pointer text-muted transition-colors hover:text-card-foreground"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {answersError && <p className="input-error">{answersError}</p>}

                {draftType === 'multiple_choice' && (
                  <ChoiceEditor
                    answers={draftAnswers}
                    multiple={false}
                    onTextChange={updateAnswerText}
                    onMarkCorrect={markSingleCorrect}
                    onToggleCorrect={toggleCorrect}
                    onRemove={removeChoice}
                    onAdd={addChoice}
                  />
                )}

                {draftType === 'multiple_select' && (
                  <ChoiceEditor
                    answers={draftAnswers}
                    multiple
                    onTextChange={updateAnswerText}
                    onMarkCorrect={markSingleCorrect}
                    onToggleCorrect={toggleCorrect}
                    onRemove={removeChoice}
                    onAdd={addChoice}
                  />
                )}

                {draftType === 'true_false' && (
                  <TrueFalseEditor answers={draftAnswers} onMarkCorrect={markSingleCorrect} />
                )}

                {draftType === 'fill_blank' && (
                  <FillBlankEditor
                    answers={draftAnswers}
                    onTextChange={updateAnswerText}
                    onRemove={removeChoice}
                    onAdd={addChoice}
                  />
                )}

                {draftType === 'ordering' && (
                  <OrderingEditor
                    answers={draftAnswers}
                    onTextChange={updateAnswerText}
                    onMove={moveAnswer}
                    onRemove={removeChoice}
                    onAdd={addChoice}
                  />
                )}

                {draftType === 'bucket_sort' && (
                  <BucketSortEditor
                    buckets={draftBuckets}
                    cards={draftAnswers}
                    onBucketTextChange={updateBucketText}
                    onAddBucket={addBucket}
                    onRemoveBucket={removeBucket}
                    onCardTextChange={updateAnswerText}
                    onCardBucketChange={updateBucketNumber}
                    onRemoveCard={removeChoice}
                    onAddCard={addChoice}
                  />
                )}
              </div>

              {/* Rich-type learner instructions (ordering / bucket_sort) */}
              {isRichType && (
                <div>
                  <label className="input-label mb-1 block">Learner Instructions (Optional)</label>
                  <textarea
                    rows={2}
                    className="input-field w-full font-mono text-xs"
                    value={draftInstructions}
                    onChange={(e) => setDraftInstructions(e.target.value)}
                    placeholder={
                      draftType === 'bucket_sort'
                        ? 'e.g. Place each statement into the correct category.'
                        : 'e.g. Use the up/down controls to order the steps.'
                    }
                  />
                </div>
              )}

              {/* Explanation Field */}
              <div>
                <label className="input-label mb-1 block">
                  Explanation & Learner Feedback (Optional)
                </label>
                <textarea
                  rows={2}
                  className="input-field w-full font-mono text-xs"
                  value={draftExplanation}
                  onChange={(e) => setDraftExplanation(e.target.value)}
                  placeholder="Explain why this answer is correct. Rendered after the learner completes the attempt."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                >
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
              <div className="rounded-md border border-dashed border-border bg-paper/20 p-8 text-center">
                <p className="font-mono text-xs text-muted">No questions added to this quiz yet.</p>
                <Button variant="primary" size="sm" className="mt-3" onClick={openNewQuestion}>
                  + Create First Question
                </Button>
              </div>
            ) : (
              quiz.questions.map((q, qIndex) => (
                <div
                  key={q.questionId}
                  className="space-y-2 rounded-md border border-border bg-card/40 p-3 transition-colors hover:border-card-foreground/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-mono text-micro font-bold text-muted">
                          #{qIndex + 1}
                        </span>
                        <span className="rounded-xs border border-border bg-paper px-1 py-0.2 font-mono text-micro font-semibold uppercase text-muted">
                          {QUESTION_TYPE_LABELS[q.questionType]}
                        </span>
                        <span className="font-mono text-micro font-bold text-brand-600">
                          +{q.points} XP
                        </span>
                      </div>
                      <p className="text-xs font-medium leading-snug text-card-foreground">
                        {q.questionText}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditQuestion(q)}
                        className="cursor-pointer rounded-xs border border-border bg-paper px-2 py-0.5 font-mono text-caption text-card-foreground transition-colors hover:bg-surface-hover"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Answers preview */}
                  {q.questionType === 'ordering' ? (
                    <div className="space-y-1 border-l border-border/60 pl-2">
                      {[...q.answers]
                        .sort((a, b) => a.answerOrder - b.answerOrder)
                        .map((ans, ansIndex) => (
                          <div
                            key={ans.answerId}
                            className="flex items-center gap-1.5 font-mono text-caption"
                          >
                            <span className="font-bold text-muted">{ansIndex + 1}.</span>
                            <span className="text-card-foreground">{ans.answerText}</span>
                          </div>
                        ))}
                    </div>
                  ) : q.questionType === 'bucket_sort' ? (
                    <div className="space-y-1 border-l border-border/60 pl-2">
                      {(() => {
                        const buckets = readConfigBuckets(q.config);
                        return q.answers.map((ans) => {
                          const bucketName = buckets[ans.answerOrder - 1];
                          return (
                            <div
                              key={ans.answerId}
                              className="flex items-center gap-1.5 font-mono text-caption"
                            >
                              <span className="text-muted">→</span>
                              <span className="text-card-foreground">{ans.answerText}</span>
                              <span
                                className={bucketName ? 'text-muted' : 'font-semibold text-error'}
                              >
                                {bucketName
                                  ? `[${bucketName}]`
                                  : `[missing bucket #${ans.answerOrder}]`}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : q.questionType === 'fill_blank' ? (
                    <div className="space-y-1 border-l border-border/60 pl-2">
                      {q.answers.map((ans) => (
                        <div
                          key={ans.answerId}
                          className="flex items-center gap-1.5 font-mono text-caption"
                        >
                          <span className="font-bold text-success">✓</span>
                          <span className="text-card-foreground">{ans.answerText}</span>
                        </div>
                      ))}
                      <p className="font-mono text-micro text-muted">
                        Any listed answer is accepted (case-insensitive).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 border-l border-border/60 pl-2">
                      {q.answers.map((ans) => (
                        <div
                          key={ans.answerId}
                          className="flex items-center gap-1.5 font-mono text-caption"
                        >
                          {ans.isCorrect ? (
                            <span className="font-bold text-success">✓</span>
                          ) : (
                            <span className="text-muted">○</span>
                          )}
                          <span
                            className={
                              ans.isCorrect ? 'font-semibold text-card-foreground' : 'text-muted'
                            }
                          >
                            {ans.answerText}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
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
