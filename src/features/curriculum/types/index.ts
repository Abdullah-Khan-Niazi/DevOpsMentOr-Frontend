/** F4 §07 response DTOs, mirrored from the backend curriculum DTOs. */

export type ContentType = 'text' | 'video' | 'interactive' | 'lab';
export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'multiple_select';

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
}

export interface LessonDto {
  lessonId: number;
  moduleId: number;
  title: string;
  content: string | null;
  contentType: ContentType;
  videoUrl: string | null;
  videoDurationSeconds: number | null;
  lessonOrder: number;
  isPublished: boolean;
  tags: TagDto[];
  createdAt: string;
  updatedAt: string;
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

export interface QuestionDto {
  questionId: number;
  quizId: number;
  questionText: string;
  questionType: QuestionType;
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
  points?: number;
  explanation?: string | null;
  questionOrder: number;
  answers: AnswerInput[];
}

export interface UpdateQuestionPayload {
  questionText?: string;
  questionType?: QuestionType;
  points?: number;
  explanation?: string | null;
  questionOrder?: number;
  isActive?: boolean;
  answers?: AnswerInput[];
}
