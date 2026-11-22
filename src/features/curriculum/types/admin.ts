/**
 * Staff curriculum control panel DTOs and payloads (contract C§6.1). The
 * module item spine is the `lessons` table: a lesson, lab or quiz item is one
 * row ordered by `lesson_order`.
 */

import type { LabSpecStatus, LabStepCheck } from '@/features/labs/types/labSpec';
import type { CourseDto, ModuleDto, TagDto } from './index';

export type ModuleItemKind = 'lesson' | 'lab' | 'quiz';
export type AdminContentType = 'text' | 'video' | 'interactive' | 'lab' | 'quiz';
/** Content types a lesson item can be edited between (lab/quiz are immutable kinds). */
export type LessonContentType = 'text' | 'video' | 'interactive';
export type PublishFilter = 'all' | 'published' | 'draft';

export type AdminQuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'multiple_select'
  | 'bucket_sort'
  | 'ordering'
  | 'terminal';

/* ── Courses ─────────────────────────────────────────────────────────── */

/** `CourseDto` as returned by the admin routes (premium flag included when the backend sends it). */
export interface AdminCourseDto extends CourseDto {
  isPremium?: boolean;
}

export interface AdminCourseListItemDto extends AdminCourseDto {
  moduleCount: number;
  itemCount: number;
  trackIds: number[];
}

export interface AdminCourseDetailDto {
  course: AdminCourseDto;
  modules: AdminModuleDto[];
}

export interface AdminCourseListParams {
  search?: string;
  status?: PublishFilter;
}

/** Course slugs are `^C\d{2}$`; omitted on create, the server assigns the lowest unused one. */
export interface CreateCoursePayload {
  title: string;
  slug?: string;
  description?: string | null;
  difficultyId: number;
  categoryId?: number | null;
  estimatedHours?: number;
  isPremium?: boolean;
}

/** A slug change recomputes every item slug of the course. */
export interface UpdateCoursePayload {
  title?: string;
  slug?: string;
  description?: string | null;
  difficultyId?: number;
  categoryId?: number | null;
  coverImageUrl?: string | null;
  videoTrailerUrl?: string | null;
  estimatedHours?: number;
  isPremium?: boolean;
  isPublished?: boolean;
  prerequisites?: string[] | null;
  learningObjectives?: string[] | null;
}

/* ── Modules and items ───────────────────────────────────────────────── */

/**
 * Module as returned by the admin routes. `slug` (`CxxMxxx`) and `slidesUrl`
 * are derived by the server and read-only: they are never sent in a payload.
 */
export interface AdminModuleDto extends ModuleDto {
  readonly slug: string;
  readonly slidesUrl: string | null;
}

export interface AdminModuleListParams {
  search?: string;
  isPublished?: boolean;
}

export interface CreateModulePayload {
  title: string;
  description?: string;
  estimatedMinutes?: number;
}

export interface UpdateModulePayload {
  title?: string;
  description?: string | null;
  estimatedMinutes?: number;
  isPublished?: boolean;
}

export interface AdminModuleItemLabDto {
  labId: number;
  slug: string;
  labName: string;
  difficultyName: string | null;
  estimatedHours: number;
  stepCount: number;
  isPremium: boolean;
  isActive: boolean;
  specStatus: LabSpecStatus;
}

export interface AdminModuleItemQuizDto {
  quizId: number;
  questionCount: number;
  passingScore: number;
  timeLimitMinutes: number | null;
  isRequired: boolean;
  isPublished: boolean;
  activeQuestionCount: number;
}

export interface AdminModuleItemDto {
  /** `lessons.lesson_id` */
  itemId: number;
  moduleId: number;
  /** `lesson_order` */
  position: number;
  kind: ModuleItemKind;
  title: string;
  /** `CxxMxxLxx`, server assigned and read-only (never sent in a payload). */
  readonly slug: string | null;
  contentType: AdminContentType;
  videoDurationSeconds: number | null;
  isPublished: boolean;
  lab: AdminModuleItemLabDto | null;
  quiz: AdminModuleItemQuizDto | null;
  hasLearnerData: boolean;
}

export interface AdminModuleDetailDto {
  module: AdminModuleDto;
  items: AdminModuleItemDto[];
}

export type CreateModuleItemPayload =
  | {
      kind: 'lesson';
      title: string;
      contentType: LessonContentType;
      content?: string;
      videoUrl?: string | null;
      videoDurationSeconds?: number | null;
      tagIds?: number[];
    }
  | { kind: 'lab'; labId: number; title?: string }
  | {
      kind: 'quiz';
      title: string;
      description?: string;
      passingScore?: number;
      timeLimitMinutes?: number | null;
      isRequired?: boolean;
    };

/* ── Lessons ─────────────────────────────────────────────────────────── */

export interface AdminLessonDto {
  lessonId: number;
  moduleId: number;
  title: string;
  /** Server assigned and read-only. */
  readonly slug: string | null;
  content: string | null;
  contentType: AdminContentType;
  videoUrl: string | null;
  videoDurationSeconds: number | null;
  lessonOrder: number;
  isPublished: boolean;
  tags: TagDto[];
  createdAt: string;
  updatedAt: string;
}

/** No slug: item slugs are server assigned. Lab/quiz rows are not editable here. */
export interface UpdateLessonPayload {
  title?: string;
  content?: string | null;
  contentType?: LessonContentType;
  videoUrl?: string | null;
  videoDurationSeconds?: number | null;
  tagIds?: number[];
}

/* ── Quizzes and questions ───────────────────────────────────────────── */

export interface AdminAnswerDto {
  answerId: number;
  questionId: number;
  answerText: string;
  isCorrect: boolean;
  answerOrder: number;
}

/**
 * Penalty values carried by every question type's config (contract C§3, C§4.4).
 * Optional on write: the server applies `wrongPenalty` 2 and `guessPenalty`
 * 5 for terminal `answer` questions when absent. Integers 0..1000.
 */
export interface QuestionPenaltyFields {
  wrongPenalty?: number;
  guessPenalty?: number;
}

export interface TerminalQuestionConfig extends QuestionPenaltyFields {
  instructions?: string;
  terminal: {
    labId: number;
    mode: 'answer' | 'check';
    /** Required when mode is `answer`, null when `check`. */
    answerFormat: 'choice' | 'text' | null;
    setup: string[];
    /** Required when mode is `check`. */
    check?: LabStepCheck;
  };
}

export interface BucketSortQuestionConfig extends QuestionPenaltyFields {
  instructions?: string;
  buckets: string[];
}

export interface PlainQuestionConfig extends QuestionPenaltyFields {
  instructions?: string;
}

export type AdminQuestionConfig =
  TerminalQuestionConfig | BucketSortQuestionConfig | PlainQuestionConfig;

export interface AdminQuestionDto {
  questionId: number;
  quizId: number;
  questionText: string;
  questionType: AdminQuestionType;
  config: Record<string, unknown> | null;
  points: number;
  explanation: string | null;
  questionOrder: number;
  isActive: boolean;
  answers: AdminAnswerDto[];
}

export interface AdminQuizDetailDto {
  quizId: number;
  moduleId: number;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimitMinutes: number | null;
  isRequired: boolean;
  isPublished: boolean;
  questionCount: number;
  questions: AdminQuestionDto[];
}

export interface UpdateQuizPayload {
  title?: string;
  description?: string | null;
  passingScore?: number;
  timeLimitMinutes?: number | null;
  isRequired?: boolean;
}

export interface QuestionAnswerInput {
  answerText: string;
  isCorrect: boolean;
  answerOrder: number;
}

export interface CreateQuestionPayload {
  questionText: string;
  questionType: AdminQuestionType;
  config: AdminQuestionConfig | null;
  points: number;
  explanation?: string | null;
  isActive?: boolean;
  answers: QuestionAnswerInput[];
}

/**
 * When `questionType`, `config` or `answers` is present, all three must be
 * (the backend re-validates the triple).
 */
export interface UpdateQuestionPayload {
  questionText?: string;
  questionType?: AdminQuestionType;
  config?: AdminQuestionConfig | null;
  points?: number;
  explanation?: string | null;
  isActive?: boolean;
  answers?: QuestionAnswerInput[];
}

/* ── Reference data ──────────────────────────────────────────────────── */

export interface DifficultyOptionDto {
  difficultyId: number;
  name: string;
}

export interface CategoryOptionDto {
  categoryId: number;
  name: string;
  slug: string;
}

/* ── Reorder payloads (exact full child set) ─────────────────────────── */

export interface ReorderModulesPayload {
  moduleIds: number[];
}

export interface ReorderItemsPayload {
  itemIds: number[];
}

export interface ReorderQuestionsPayload {
  questionIds: number[];
}

export interface ReorderTrackCoursesPayload {
  courseIds: number[];
}
