/**
 * F5 response DTOs, mirrored from the backend progress DTOs. All dates are
 * ISO strings.
 */

import type { LabInstanceStatus, VpnRegion } from '@/features/labs/types';
import type { ModuleItemKind } from '@/features/curriculum/types';

export type LearningActivityType =
  | 'LESSON_STARTED'
  | 'LESSON_COMPLETED'
  | 'MODULE_COMPLETED'
  | 'LAB_STARTED'
  | 'LAB_COMPLETED'
  | 'LAB_FAILED'
  | 'LAB_TERMINATED'
  | 'TRACK_COMPLETED'
  | 'AI_MENTOR_SESSION'
  | 'QUIZ_STARTED'
  | 'QUIZ_PASSED'
  | 'QUIZ_FAILED'
  | 'COURSE_COMPLETED'
  | 'LAB_STEP_STAGED'
  | 'LAB_STEP_PASSED'
  | 'LAB_STEP_FAILED'
  | 'LAB_HINT_REVEALED'
  | 'QUIZ_TERMINAL_STAGED';

/** Server-computed XP change returned by every XP-affecting mutation (C§5.4, backend `XpDeltaDto`). */
export interface XpDeltaDto {
  delta: number;
  balance: number;
}

/**
 * Alias of `XpDeltaDto`. Prefer `XpDeltaDto`: this name clashes with the shared
 * `XpDelta` component when both are imported into one file.
 */
export type XpDelta = XpDeltaDto;

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

/** Staff course selector entry (C§4.3 `courseOptions`). */
export interface CourseOptionDto {
  courseId: number;
  title: string;
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
  /** Item kind; the FE routes lesson/lab/quiz pages by it (C§4.3). */
  kind: ModuleItemKind;
  labId: number | null;
  quizId: number | null;
}

/** Per-item progress row of a module (C§4.3 `GET /progress/modules/:moduleId/items`). */
export interface ModuleItemProgressDto {
  itemId: number;
  kind: ModuleItemKind;
  isStarted: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  lab?: { passedSteps: number; totalSteps: number };
  quiz?: { isPassed: boolean; bestScore: number | null; attemptsUsedToday: number };
}

/** `PATCH /progress/lessons/:lessonId/complete` response (C§4.3). */
export interface LessonCompleteResultDto {
  lesson: LessonProgressDto;
  newlyCompleted: boolean;
  moduleNewlyCompleted: boolean;
  courseNewlyCompleted: boolean;
  xp: XpDeltaDto;
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
  courseOptions: CourseOptionDto[];
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
  courseOptions: CourseOptionDto[];
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

/** @deprecated replaced by the `breakdown` items of `QuizAttemptResultDto` (C§4.4). */
export interface QuestionResultDto {
  questionId: number;
  isCorrect: boolean;
  pointsEarned: number;
  explanation: string | null;
}

/**
 * Final result of a quiz attempt (C§4.4 `POST .../complete`, `GET .../quiz-attempts/:attemptId`).
 * `xpAwarded` is the pass reward (sum of points earned on the first pass, else 0).
 */
export interface QuizAttemptResultDto {
  attemptId: number;
  quizId: number;
  score: number;
  isPassed: boolean;
  passingScore: number;
  correctCount: number;
  answeredCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  firstPass: boolean;
  xpAwarded: number;
  penaltiesTotal: number;
  breakdown: Array<{
    questionId: number;
    isCorrect: boolean;
    pointsEarned: number;
    explanation: string | null;
  }>;
  reviewAvailable: boolean;
  completedLessonIds: number[];
  xp: XpDeltaDto;
  /**
   * @deprecated not sent by C§4.4; read only by the legacy `QuizResultPanel` ("Attempt #n"),
   * removed with that panel in wave 4.
   */
  attemptNumber?: number;
}

export type QuizQuestionType =
  'multiple_choice' | 'true_false' | 'fill_blank' | 'multiple_select' | 'bucket_sort' | 'ordering';

/** @deprecated replaced by `LearnerQuizQuestionDto` (C§4.4). */
export interface QuizQuestionDto {
  questionId: number;
  questionText: string;
  questionType: QuizQuestionType;
  /** Presentation metadata for rich types (e.g. `{ buckets: string[] }`); never correctness. */
  config: Record<string, unknown> | null;
  points: number;
  questionOrder: number;
  answers: Array<{
    answerId: number;
    answerText: string;
    /** Shuffled placeholder order for rich types — never the solution order. */
    answerOrder: number;
  }>;
}

export interface ModuleAverageDto {
  moduleId: number;
  moduleTitle: string;
  totalLessons: number;
  averageProgressPercentage: number;
}

/** `GET /progress/class/:classId/students` (backend `ClassStudentsProgressDto`). */
export interface ClassStudentsResponseDto {
  className: string;
  students: StudentProgressDto[];
  moduleAverages: ModuleAverageDto[];
  courseOptions: CourseOptionDto[];
}

/** @deprecated replaced by `QuizAnswerResponse` inside `SubmitQuizAnswerPayload` (C§4.4). */
export interface QuizAnswerPayload {
  questionId: number;
  answerId?: number;
  answerText?: string;
}

/** @deprecated the whole-attempt submit is removed; answers are posted one question at a time (C§4.4). */
export interface SubmitQuizAttemptPayload {
  answers: QuizAnswerPayload[];
  timeTakenSeconds: number;
}

export interface CompleteLessonPayload {
  timeSpentSeconds: number;
}

/** @deprecated replaced by `LessonCompleteResultDto` (C§4.3). */
export interface LessonCompletedDto {
  lessonProgress: LessonProgressDto;
  moduleProgress: ModuleProgressSummary;
  courseProgress: CourseProgressDto;
}

/** ── Learner quiz attempts (C§4.4) ─────────────────────────────── */

/** `GET /progress/quizzes/:quizId` (C§4.4). Penalties are per question; these are the maxima over active questions. */
export interface QuizStatusDto {
  quizId: number;
  moduleId: number;
  courseId: number;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimitMinutes: number | null;
  questionCount: number;
  totalPoints: number;
  isPassed: boolean;
  bestScore: number | null;
  attemptsUsedToday: number;
  /** `QUIZ_LIMITS.maxAttemptsPerDay`; 0 = unlimited. */
  maxAttemptsPerDay: number;
  /** Cooldown or daily-cap expiry, null when a new attempt may start. */
  nextAttemptAt: string | null;
  openAttemptId: number | null;
  penalties: { wrongAnswerMax: number; terminalGuessMax: number };
  hasTerminalQuestions: boolean;
  /** First passed attempt, for the Review view. */
  passedAttemptId: number | null;
  lastAttempt: {
    attemptId: number;
    score: number;
    isPassed: boolean;
    completedAt: string | null;
  } | null;
}

export type LearnerQuizQuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'multiple_select'
  | 'bucket_sort'
  | 'ordering'
  | 'terminal';

/** Terminal question environment state of a learner question (C§4.4, C§11.9). */
export interface TerminalStageState {
  labId: number;
  labName: string;
  mode: 'answer' | 'check';
  answerFormat: 'choice' | 'text' | null;
  /** Latest `QUIZ_TERMINAL_STAGED` of this attempt and question, null when not staged. */
  staged: { instanceId: number; stagedAt: string } | null;
}

/** One question of an open quiz attempt. Never carries correctness, config or explanations before answering. */
export interface LearnerQuizQuestionDto {
  questionId: number;
  position: number;
  questionText: string;
  questionType: LearnerQuizQuestionType;
  points: number;
  instructions: string | null;
  /** Bucket labels for `bucket_sort` only. */
  buckets: string[] | null;
  /** `[]` for fill_blank and terminal text/check. */
  options: Array<{ answerId: number; answerText: string }>;
  /** Null for non-terminal questions, which are never staged. */
  terminal: TerminalStageState | null;
  penalties: { wrongAnswer: number; guess: number };
  /** Set when already answered in this attempt. */
  response: QuizAnswerResultDto | null;
}

/** Open or resumed attempt (C§4.4 `POST .../attempts/start`, `GET .../quiz-attempts/:attemptId`). */
export interface QuizAttemptStartDto {
  attemptId: number;
  quizId: number;
  attemptNumber: number;
  startedAt: string;
  expiresAt: string | null;
  passingScore: number;
  totalQuestions: number;
  totalPoints: number;
  questions: LearnerQuizQuestionDto[];
}

/**
 * `GET /progress/quiz-attempts/:attemptId` (C§4.4). `result` is set once the attempt was completed
 * or finalized by expiry, so the FE can show results after `QUIZ_TIME_EXPIRED` / `ATTEMPT_CLOSED`.
 */
export interface QuizAttemptResumeDto {
  attempt: QuizAttemptStartDto;
  result: QuizAttemptResultDto | null;
}

/** Immediate per-question feedback (C§4.4 `POST .../answers`). */
export interface QuizAnswerResultDto {
  questionId: number;
  isCorrect: boolean;
  pointsEarned: number;
  guessed: boolean;
  penalties: { wrongAnswer: number; guess: number };
  explanation: string | null;
  answeredAt: string;
  xp: XpDeltaDto;
}

/** Answer body of `POST .../answers`, discriminated by `type` (C§4.4 `submitQuizAnswerSchema`). */
export type QuizAnswerResponse =
  | { type: 'choice'; answerId: number }
  | { type: 'multi'; answerIds: number[] }
  | { type: 'text'; text: string }
  | { type: 'ordering'; answerIds: number[] }
  | { type: 'buckets'; placements: Array<{ answerId: number; bucket: number }> }
  | { type: 'terminal_check' };

export interface SubmitQuizAnswerPayload {
  questionId: number;
  response: QuizAnswerResponse;
}

/** Post-attempt review, only after the quiz is passed (C§4.4). */
export interface QuizReviewDto {
  attemptId: number;
  questions: Array<{
    questionId: number;
    questionText: string;
    questionType: string;
    yourResponse: unknown;
    isCorrect: boolean;
    explanation: string | null;
    correct: {
      answerIds?: number[];
      orderedAnswerIds?: number[];
      placements?: Array<{ answerId: number; bucket: number }>;
      text?: string;
    } | null;
  }>;
}

/** Terminal environment staged for a terminal quiz question (C§4.4 `POST .../stage`). */
export interface TerminalStageDto {
  attemptId: number;
  questionId: number;
  instanceId: number;
  status: LabInstanceStatus;
  terminalWsUrl: string | null;
  expiresAt: string | null;
  stagedAt: string;
  provisioned: boolean;
}

/** Body of `POST /progress/quiz-attempts/:attemptId/questions/:questionId/stage` (C§4.4, strict). */
export interface TerminalStagePayload {
  region?: VpnRegion;
}
