/**
 * F5 response DTOs, mirrored from the backend progress DTOs. All dates are
 * ISO strings.
 */

export type LearningActivityType =
  | 'LESSON_STARTED'
  | 'LESSON_COMPLETED'
  | 'MODULE_COMPLETED'
  | 'LAB_STARTED'
  | 'LAB_COMPLETED'
  | 'LAB_FAILED'
  | 'QUIZ_STARTED'
  | 'QUIZ_PASSED'
  | 'QUIZ_FAILED'
  | 'COURSE_COMPLETED';

export interface LessonProgressDto {
  progressId: number;
  lessonId: number;
  moduleId: number;
  courseId: number;
  progressPercentage: number;
  isCompleted: boolean;
  completedAt: string | null;
  lastAccessedAt: string;
  timeSpentSeconds: number;
}

export interface ModuleProgressSummary {
  moduleId: number;
  moduleTitle: string;
  moduleOrder: number;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  isCompleted: boolean;
}

export interface CourseProgressDto {
  courseId: number;
  courseTitle: string;
  progressPercentage: number;
  completedLessonCount: number;
  totalLessons: number;
  isCompleted: boolean;
}

export interface ContinueLearningPointerDto {
  lessonId: number;
  moduleId: number;
  courseId: number;
  lessonTitle: string;
  moduleTitle: string;
  progressPct: number;
  lastAccessedAt: string;
}

export interface ActivityLogDto {
  logId: number;
  activityType: LearningActivityType;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface StudentProgressDto {
  userId: number;
  fullName: string | null;
  email: string;
  progressPercentage: number;
  completedLessonCount: number;
  totalLessons: number;
  completedModuleCount: number;
  labsCompleted: number;
  lastActiveAt: string | null;
  currentStreakDays: number;
}

export interface StudentDetailProgressDto {
  student: {
    userId: number;
    fullName: string | null;
    email: string;
  };
  course: CourseProgressDto | null;
  modules: ModuleProgressSummary[];
  activity: ActivityLogDto[];
}

export interface OrgStudentProgressDto extends StudentProgressDto {
  className: string | null;
}

export interface AdminUserProgressDto {
  user: {
    userId: number;
    username: string;
    email: string;
    fullName: string | null;
  };
  course: CourseProgressDto | null;
  modules: ModuleProgressSummary[];
  quizAttempts: QuizAttemptDto[];
  activity: ActivityLogDto[];
}

export interface QuizAttemptDto {
  attemptId: number;
  quizId: number;
  score: number;
  isPassed: boolean;
  attemptNumber: number;
  startedAt: string;
  completedAt: string | null;
  timeTakenSeconds: number | null;
}

export interface QuestionResultDto {
  questionId: number;
  isCorrect: boolean;
  pointsEarned: number;
  explanation: string | null;
}

export interface QuizAttemptResultDto {
  attemptId: number;
  score: number;
  isPassed: boolean;
  attemptNumber: number;
  correctCount: number;
  totalQuestions: number;
  breakdown: QuestionResultDto[];
}

export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'multiple_select';

export interface QuizQuestionDto {
  questionId: number;
  questionText: string;
  questionType: QuizQuestionType;
  points: number;
  questionOrder: number;
  answers: Array<{
    answerId: number;
    answerText: string;
    answerOrder: number;
  }>;
}

export interface ModuleAverageDto {
  moduleId: number;
  moduleTitle: string;
  totalLessons: number;
  averageProgressPercentage: number;
}

export interface ClassStudentsResponseDto {
  className: string;
  students: StudentProgressDto[];
  moduleAverages: ModuleAverageDto[];
}

export interface QuizAnswerPayload {
  questionId: number;
  answerId?: number;
  answerText?: string;
}

export interface SubmitQuizAttemptPayload {
  answers: QuizAnswerPayload[];
  timeTakenSeconds: number;
}

export interface CompleteLessonPayload {
  timeSpentSeconds: number;
}

export interface LessonCompletedDto {
  lessonProgress: LessonProgressDto;
  moduleProgress: ModuleProgressSummary;
  courseProgress: CourseProgressDto;
}
