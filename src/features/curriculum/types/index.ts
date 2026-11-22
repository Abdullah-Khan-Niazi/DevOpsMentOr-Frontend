/** F4 §07 response DTOs, mirrored from the backend curriculum DTOs. */

export type ContentType = 'text' | 'video' | 'interactive' | 'lab' | 'quiz';
export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'multiple_select'
  | 'bucket_sort'
  | 'ordering'
  | 'terminal';

/** Kind of a module item (C§4.2). Lessons, labs and quizzes share one ordered spine. */
export type ModuleItemKind = 'lesson' | 'lab' | 'quiz';

/** Why a learner can or cannot access a course (C§4.2 CourseAccessDto). */
export type CourseAccessReason =
  'platform_admin' | 'unpublished' | 'free' | 'assigned' | 'org_subscription' | 'not_entitled';

export interface TagDto {
  tagId: number;
  tagName: string;
}

export interface CourseDto {
  courseId: number;
  title: string;
  slug: string;
  description: string | null;
  difficultyId: number;
  difficultyName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  instructorId: number;
  instructorName: string | null;
  coverImageUrl: string | null;
  videoTrailerUrl: string | null;
  estimatedHours: number;
  totalLessons: number;
  totalQuizzes: number;
  isPublished: boolean;
  prerequisites: string[] | null;
  learningObjectives: string[] | null;
  createdAt: string;
  updatedAt: string;
}

/** Course row as listed for learners (C§4.2 `GET /curriculum/courses`). */
export interface LearnerCourseDto extends CourseDto {
  moduleCount: number;
  itemCount: number;
}

export interface ModuleDto {
  moduleId: number;
  courseId: number;
  title: string;
  description: string | null;
  moduleOrder: number;
  estimatedMinutes: number;
  lessonCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  /** Read-only positional slug `CxxMxx` derived from the course slug and `moduleOrder` (C1). */
  slug: string;
  /** Module slide deck URL (`slides/<moduleSlug>.pdf`), null when slides are disabled (C2). */
  slidesUrl: string | null;
}

export interface LessonDto {
  lessonId: number;
  moduleId: number;
  title: string;
  /** Stable slug used for deep links and GitOps slide/walkthrough asset matching. */
  slug: string | null;
  content: string | null;
  contentType: ContentType;
  videoUrl: string | null;
  videoDurationSeconds: number | null;
  lessonOrder: number;
  isPublished: boolean;
  tags: TagDto[];
  createdAt: string;
  updatedAt: string;
  /** Item kind on the module spine; `content`/`videoUrl` are null for lab and quiz items. */
  kind: ModuleItemKind;
  /** Lab id for `kind === 'lab'`, otherwise null. */
  labId: number | null;
  /** Quiz id for `kind === 'quiz'`, otherwise null. */
  quizId: number | null;
  courseId: number;
  /** Module slug `CxxMxx` the item belongs to. */
  moduleSlug: string;
  /** Module slide deck URL (see `ModuleDto.slidesUrl`). */
  slidesUrl: string | null;
}

/** One item of a module outline (C§4.2 `ModuleItemDto`). Titles and counts only, never content. */
export interface ModuleItemDto {
  /** `lessons.lesson_id`. */
  itemId: number;
  moduleId: number;
  /** 1-based position on the module spine (`lesson_order`). */
  position: number;
  kind: ModuleItemKind;
  title: string;
  /** Item slug `CxxMxxLxx`, server assigned for every kind. */
  slug: string | null;
  contentType: ContentType;
  videoDurationSeconds: number | null;
  lab: null | {
    labId: number;
    slug: string;
    labName: string;
    difficultyName: string | null;
    estimatedHours: number;
    stepCount: number;
    isPremium: boolean;
  };
  quiz: null | {
    quizId: number;
    questionCount: number;
    passingScore: number;
    timeLimitMinutes: number | null;
    isRequired: boolean;
  };
}

export interface CourseAccessDto {
  canAccess: boolean;
  reason: CourseAccessReason;
  /** User-safe explanation with the next action, sent with a denial. */
  message?: string;
}

/** `GET /curriculum/courses/:courseId` (C§4.2). */
export interface LearnerCourseDetailDto {
  course: CourseDto;
  modules: ModuleDto[];
  access: CourseAccessDto;
}

export interface QuizDto {
  quizId: number;
  moduleId: number;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimitMinutes: number | null;
  isRequired: boolean;
  isPublished: boolean;
  questionCount: number;
}

export interface AnswerDto {
  answerId: number;
  questionId: number;
  answerText: string;
  isCorrect: boolean;
  answerOrder: number;
}

/**
 * Presentation config persisted on `QuestionDto.config` for `bucket_sort`.
 * `buckets` is the ordered list of bucket labels; a card's `answerOrder`
 * points at the 1-based bucket index (correctness never lives in config).
 */
export type BucketSortConfigDto = {
  buckets: string[];
  instructions?: string;
};

/**
 * Presentation config persisted on `QuestionDto.config` for `ordering`.
 * `answerOrder` carries the item position; config only carries hints.
 */
export type OrderingConfigDto = {
  instructions?: string;
};

export interface QuestionDto {
  questionId: number;
  quizId: number;
  questionText: string;
  questionType: QuestionType;
  /** Rich presentation payload for bucket_sort/ordering (never holds correctness). */
  config: Record<string, unknown> | null;
  points: number;
  explanation: string | null;
  questionOrder: number;
  isActive: boolean;
  answers: AnswerDto[];
}

export interface QuizDetailDto extends QuizDto {
  questions: QuestionDto[];
}

export interface ModuleEditorDto extends ModuleDto {
  lessons: LessonDto[];
  quizzes: QuizDetailDto[];
}

/** @deprecated canonical-course overview; replaced by `LearnerCourseDetailDto` (C§4.2). */
export interface CourseOverviewDto {
  course: CourseDto;
  modules: ModuleDto[];
}

/** ── Write payloads (validators strip unknown keys) ─────────────── */

export interface UpdateCoursePayload {
  title?: string;
  description?: string | null;
  difficultyId?: number;
  categoryId?: number | null;
  coverImageUrl?: string | null;
  videoTrailerUrl?: string | null;
  estimatedHours?: number;
  isPublished?: boolean;
  prerequisites?: string[] | null;
  learningObjectives?: string[] | null;
}

export interface CreateModulePayload {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  moduleOrder: number;
}

export interface UpdateModulePayload {
  title?: string;
  description?: string | null;
  estimatedMinutes?: number;
  moduleOrder?: number;
  isPublished?: boolean;
}

export interface ModuleOrderInput {
  moduleId: number;
  moduleOrder: number;
}

export interface CreateLessonPayload {
  title: string;
  content?: string;
  contentType: ContentType;
  videoUrl?: string | null;
  videoDurationSeconds?: number | null;
  lessonOrder: number;
  tagIds?: number[];
}

export interface UpdateLessonPayload {
  title?: string;
  content?: string | null;
  contentType?: ContentType;
  videoUrl?: string | null;
  videoDurationSeconds?: number | null;
  lessonOrder?: number;
  isPublished?: boolean;
  tagIds?: number[];
}

export interface LessonOrderInput {
  lessonId: number;
  lessonOrder: number;
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  passingScore?: number;
  timeLimitMinutes?: number | null;
  isRequired?: boolean;
}

export interface UpdateQuizPayload {
  title?: string;
  description?: string | null;
  passingScore?: number;
  timeLimitMinutes?: number | null;
  isRequired?: boolean;
  isPublished?: boolean;
}

export interface AnswerInput {
  answerText: string;
  isCorrect: boolean;
  answerOrder: number;
}

export interface CreateQuestionPayload {
  questionText: string;
  questionType: QuestionType;
  config?: Record<string, unknown> | null;
  points?: number;
  explanation?: string | null;
  questionOrder: number;
  answers: AnswerInput[];
}

export interface UpdateQuestionPayload {
  questionText?: string;
  questionType?: QuestionType;
  config?: Record<string, unknown> | null;
  points?: number;
  explanation?: string | null;
  questionOrder?: number;
  isActive?: boolean;
  answers?: AnswerInput[];
}
