import { apiClient } from '@/shared/services';
import type {
  ActivityLogDto,
  AdminUserProgressDto,
  ClassStudentsResponseDto,
  CompleteLessonPayload,
  ContinueLearningPointerDto,
  CourseProgressDto,
  LessonCompletedDto,
  LessonProgressDto,
  ModuleProgressSummary,
  OrgStudentProgressDto,
  QuizAttemptDto,
  QuizAttemptResultDto,
  QuizQuestionDto,
  StudentDetailProgressDto,
  SubmitQuizAttemptPayload,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F5 §07 progress endpoints (self + scoped reads). */
export const progressService = {
  /** F5-API-01: mark a lesson as started (idempotent). */
  async startLesson(lessonId: number): Promise<LessonProgressDto> {
    const { data } = await apiClient.post<{ data: LessonProgressDto }>(
      `/progress/lessons/${lessonId}/start`,
    );
    return unwrap(data);
  },

  /** F5-API-02: mark a lesson complete, returns cascade summaries. */
  async completeLesson(
    lessonId: number,
    payload: CompleteLessonPayload,
  ): Promise<LessonCompletedDto> {
    const { data } = await apiClient.patch<{ data: LessonCompletedDto }>(
      `/progress/lessons/${lessonId}/complete`,
      payload,
    );
    return unwrap(data);
  },

  /** F5-API-03: learner's own course progress. */
  async getCourseProgress(): Promise<CourseProgressDto> {
    const { data } = await apiClient.get<{ data: CourseProgressDto }>('/progress/course');
    return unwrap(data);
  },

  /** F5-API-04: per-module progress for the learner. */
  async getModulesProgress(): Promise<ModuleProgressSummary[]> {
    const { data } = await apiClient.get<{ data: ModuleProgressSummary[] }>('/progress/modules');
    return unwrap(data);
  },

  /** F5-API-05: continue-learning pointer (200 null when no activity yet). */
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

  /** SCR-F5-02 header: quiz metadata (title, time limit, passing score). */
  async getQuizMeta(quizId: number): Promise<{
    quizId: number;
    moduleId: number;
    title: string;
    passingScore: number;
    timeLimitMinutes: number | null;
  }> {
    const { data } = await apiClient.get<{
      data: {
        quizId: number;
        moduleId: number;
        title: string;
        passingScore: number;
        timeLimitMinutes: number | null;
      };
    }>(`/progress/quizzes/${quizId}`);
    return unwrap(data);
  },

  /** SCR-F5-02: learner-safe quiz questions (answers without is_correct). */
  async getQuizQuestions(quizId: number): Promise<QuizQuestionDto[]> {
    const { data } = await apiClient.get<{ data: QuizQuestionDto[] }>(
      `/progress/quizzes/${quizId}/questions`,
    );
    return unwrap(data);
  },

  /** F5-API-07: submit an attempt and get the scored result. */
  async submitQuizAttempt(
    quizId: number,
    payload: SubmitQuizAttemptPayload,
  ): Promise<QuizAttemptResultDto> {
    const { data } = await apiClient.post<{ data: QuizAttemptResultDto }>(
      `/progress/quizzes/${quizId}/attempts`,
      payload,
    );
    return unwrap(data);
  },

  /** F5-API-08: the learner's own attempt history for a quiz. */
  async getQuizAttempts(quizId: number): Promise<QuizAttemptDto[]> {
    const { data } = await apiClient.get<{ data: QuizAttemptDto[] }>(
      `/progress/quizzes/${quizId}/attempts`,
    );
    return unwrap(data);
  },

  /** F5-API-09: professor class progress (403 if not assigned). */
  async getClassStudents(
    classId: number,
    page = 1,
    pageSize = 25,
  ): Promise<ClassStudentsResponseDto> {
    const { data } = await apiClient.get<{ data: ClassStudentsResponseDto }>(
      `/progress/class/${classId}/students`,
      { params: { page, pageSize } },
    );
    return unwrap(data);
  },

  /** F5-API-10: professor / org-admin drill-down into one student. */
  async getStudentDetail(classId: number, userId: number): Promise<StudentDetailProgressDto> {
    const { data } = await apiClient.get<{ data: StudentDetailProgressDto }>(
      `/progress/class/${classId}/students/${userId}`,
    );
    return unwrap(data);
  },

  /** F5-API-11: org-admin aggregate across the org. */
  async getOrgStudents(orgId: number): Promise<OrgStudentProgressDto[]> {
    const { data } = await apiClient.get<{ data: OrgStudentProgressDto[] }>(
      `/progress/org/${orgId}/students`,
    );
    return unwrap(data);
  },

  /** F5-API-12: platform-admin full progress read for any user. */
  async getAdminUserProgress(userId: number): Promise<AdminUserProgressDto> {
    const { data } = await apiClient.get<{ data: AdminUserProgressDto }>(
      `/admin/progress/${userId}`,
    );
    return unwrap(data);
  },
};

export default progressService;
