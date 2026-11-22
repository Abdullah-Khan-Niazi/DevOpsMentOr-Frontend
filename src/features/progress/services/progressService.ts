import { apiClient, LONG_REQUEST_TIMEOUT_MS } from '@/shared/services';
import type { VpnRegion } from '@/features/labs/types';
import type {
  ActivityLogDto,
  AdminUserProgressDto,
  ClassStudentsResponseDto,
  ContinueLearningPointerDto,
  CourseProgressDto,
  LessonCompleteResultDto,
  LessonProgressDto,
  ModuleItemProgressDto,
  ModuleProgressSummary,
  OrgStudentProgressDto,
  QuizAnswerResultDto,
  QuizAttemptDto,
  QuizAttemptResultDto,
  QuizAttemptResumeDto,
  QuizAttemptStartDto,
  QuizReviewDto,
  QuizStatusDto,
  StudentDetailProgressDto,
  SubmitQuizAnswerPayload,
  TerminalStageDto,
  TerminalStagePayload,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** Staff scope params: `courseId` selects the course analytics (C§4.3). Undefined is omitted by axios. */
function staffParams(extra: Record<string, number>, courseId?: number) {
  return { params: { ...extra, courseId } };
}

/** F5 §07 progress endpoints (self + scoped reads). */
export const progressService = {
  /** C§4.3: mark a lesson or item as started (idempotent). */
  async startLesson(lessonId: number): Promise<LessonProgressDto> {
    const { data } = await apiClient.post<{ data: LessonProgressDto }>(
      `/progress/lessons/${lessonId}/start`,
    );
    return unwrap(data);
  },

  /**
   * C§4.3: mark an item complete. The server runs the completion rules (lab passed, quiz passed)
   * and returns the XP delta; `timeSpentSeconds` is informational only.
   */
  async completeLesson(
    lessonId: number,
    timeSpentSeconds: number,
  ): Promise<LessonCompleteResultDto> {
    const { data } = await apiClient.patch<{ data: LessonCompleteResultDto }>(
      `/progress/lessons/${lessonId}/complete`,
      { timeSpentSeconds },
    );
    return unwrap(data);
  },

  /** C§4.3: learner progress for every published course the learner has started. */
  async listCoursesProgress(): Promise<CourseProgressDto[]> {
    const { data } = await apiClient.get<{ data: CourseProgressDto[] }>('/progress/courses');
    return unwrap(data);
  },

  /** C§4.3: learner progress for one course. 404 `COURSE_NOT_FOUND` when unpublished. */
  async getCourseProgress(courseId: number): Promise<CourseProgressDto> {
    const { data } = await apiClient.get<{ data: CourseProgressDto }>(
      `/progress/courses/${courseId}`,
    );
    return unwrap(data);
  },

  /** C§4.3: per-module progress of one course (published modules only). */
  async getCourseModulesProgress(courseId: number): Promise<ModuleProgressSummary[]> {
    const { data } = await apiClient.get<{ data: ModuleProgressSummary[] }>(
      `/progress/courses/${courseId}/modules`,
    );
    return unwrap(data);
  },

  /** C§4.3: per-item progress of one module (published items only). */
  async getModuleItemsProgress(moduleId: number): Promise<ModuleItemProgressDto[]> {
    const { data } = await apiClient.get<{ data: ModuleItemProgressDto[] }>(
      `/progress/modules/${moduleId}/items`,
    );
    return unwrap(data);
  },

  /** C§4.3: continue-learning pointer with item kind (200 null when no activity yet). */
  async getContinueLearning(): Promise<ContinueLearningPointerDto | null> {
    const { data } = await apiClient.get<{ data: ContinueLearningPointerDto | null }>(
      '/progress/continue',
    );
    return unwrap(data);
  },

  /** F5-API-06: recent learning activity. */
  async getActivity(limit = 20): Promise<ActivityLogDto[]> {
    const { data } = await apiClient.get<{ data: ActivityLogDto[] }>('/progress/activity', {
      params: { limit },
    });
    return unwrap(data);
  },

  /** C§4.4: quiz status for the learner (attempts, cooldown, penalties, open attempt). */
  async getQuizStatus(quizId: number): Promise<QuizStatusDto> {
    const { data } = await apiClient.get<{ data: QuizStatusDto }>(`/progress/quizzes/${quizId}`);
    return unwrap(data);
  },

  /** C§4.4: start a server-created attempt, or resume the open one (`attempt` in the envelope). */
  async startAttempt(quizId: number): Promise<QuizAttemptStartDto> {
    const { data } = await apiClient.post<{ data: { attempt: QuizAttemptStartDto } }>(
      `/progress/quizzes/${quizId}/attempts/start`,
      {},
    );
    return unwrap(data).attempt;
  },

  /** C§4.4: resume an attempt; `result` is set once it was completed or expired. */
  async getAttempt(attemptId: number): Promise<QuizAttemptResumeDto> {
    const { data } = await apiClient.get<{ data: QuizAttemptResumeDto }>(
      `/progress/quiz-attempts/${attemptId}`,
    );
    return unwrap(data);
  },

  /** C§4.4: stage the environment of a terminal question (provisioning and setup can be slow). */
  async stageTerminal(
    attemptId: number,
    questionId: number,
    region?: VpnRegion,
  ): Promise<TerminalStageDto> {
    const payload: TerminalStagePayload = region ? { region } : {};
    const { data } = await apiClient.post<{ data: { stage: TerminalStageDto } }>(
      `/progress/quiz-attempts/${attemptId}/questions/${questionId}/stage`,
      payload,
      { timeout: LONG_REQUEST_TIMEOUT_MS },
    );
    return unwrap(data).stage;
  },

  /** C§4.4: answer one question; returns immediate per-question feedback and the XP delta. */
  async submitAnswer(
    attemptId: number,
    payload: SubmitQuizAnswerPayload,
  ): Promise<QuizAnswerResultDto> {
    const { data } = await apiClient.post<{ data: { result: QuizAnswerResultDto } }>(
      `/progress/quiz-attempts/${attemptId}/answers`,
      payload,
      { timeout: LONG_REQUEST_TIMEOUT_MS },
    );
    return unwrap(data).result;
  },

  /** C§4.4: finish the attempt and receive the scored result. */
  async completeAttempt(attemptId: number): Promise<QuizAttemptResultDto> {
    const { data } = await apiClient.post<{ data: { result: QuizAttemptResultDto } }>(
      `/progress/quiz-attempts/${attemptId}/complete`,
      {},
    );
    return unwrap(data).result;
  },

  /** C§4.4: review of a passed attempt (409 `QUIZ_NOT_PASSED` until then). */
  async getReview(attemptId: number): Promise<QuizReviewDto> {
    const { data } = await apiClient.get<{ data: { review: QuizReviewDto } }>(
      `/progress/quiz-attempts/${attemptId}/review`,
    );
    return unwrap(data).review;
  },

  /** F5-API-08: the learner's own attempt history for a quiz. */
  async getQuizAttempts(quizId: number): Promise<QuizAttemptDto[]> {
    const { data } = await apiClient.get<{ data: QuizAttemptDto[] }>(
      `/progress/quizzes/${quizId}/attempts`,
    );
    return unwrap(data);
  },

  /**
   * F5-API-09: professor class progress (403 if not assigned). `courseId` selects the
   * class-assigned course to analyse (C§4.3); omit for the server default.
   */
  async getClassStudents(
    classId: number,
    page = 1,
    pageSize = 25,
    courseId?: number,
  ): Promise<ClassStudentsResponseDto> {
    const { data } = await apiClient.get<{ data: ClassStudentsResponseDto }>(
      `/progress/class/${classId}/students`,
      staffParams({ page, pageSize }, courseId),
    );
    return unwrap(data);
  },

  /** F5-API-10: professor / org-admin drill-down into one student. */
  async getStudentDetail(
    classId: number,
    userId: number,
    courseId?: number,
  ): Promise<StudentDetailProgressDto> {
    const { data } = await apiClient.get<{ data: StudentDetailProgressDto }>(
      `/progress/class/${classId}/students/${userId}`,
      staffParams({}, courseId),
    );
    return unwrap(data);
  },

  /** F5-API-11: org-admin aggregate across the org. */
  async getOrgStudents(orgId: number, courseId?: number): Promise<OrgStudentProgressDto[]> {
    const { data } = await apiClient.get<{ data: OrgStudentProgressDto[] }>(
      `/progress/org/${orgId}/students`,
      staffParams({}, courseId),
    );
    return unwrap(data);
  },

  /** F5-API-12: platform-admin full progress read for any user. */
  async getAdminUserProgress(userId: number, courseId?: number): Promise<AdminUserProgressDto> {
    const { data } = await apiClient.get<{ data: AdminUserProgressDto }>(
      `/admin/progress/${userId}`,
      staffParams({}, courseId),
    );
    return unwrap(data);
  },

  /* ── Deprecated (pre-spine endpoints removed by C§4.2 / C§4.4) ─────────── */
};

export default progressService;
