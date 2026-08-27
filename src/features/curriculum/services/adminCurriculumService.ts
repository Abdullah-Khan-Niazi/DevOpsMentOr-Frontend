import { apiClient } from '@/shared/services';
import type {
  CreateLessonPayload,
  CreateModulePayload,
  CreateQuestionPayload,
  CreateQuizPayload,
  CourseDto,
  LessonDto,
  LessonOrderInput,
  ModuleDto,
  ModuleEditorDto,
  ModuleOrderInput,
  QuestionDto,
  QuizDetailDto,
  TagDto,
  UpdateCoursePayload,
  UpdateLessonPayload,
  UpdateModulePayload,
  UpdateQuestionPayload,
  UpdateQuizPayload,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F4 §07 F4-API-07..22 platform-admin curriculum endpoints. */
export const adminCurriculumService = {
  /** F4-API-07 */
  async getCourse(): Promise<CourseDto> {
    const { data } = await apiClient.get<{ data: CourseDto }>('/admin/curriculum/course');
    return unwrap(data);
  },

  /** F4-API-08 */
  async updateCourse(payload: UpdateCoursePayload): Promise<CourseDto> {
    const { data } = await apiClient.patch<{ data: CourseDto }>(
      '/admin/curriculum/course',
      payload,
    );
    return unwrap(data);
  },

  /** F4-API-09 */
  async getModules(params?: { search?: string; isPublished?: boolean }): Promise<ModuleDto[]> {
    const { data } = await apiClient.get<{ data: ModuleDto[] }>('/admin/curriculum/modules', {
      params,
    });
    return unwrap(data);
  },

  /** F4-API-10 */
  async createModule(payload: CreateModulePayload): Promise<ModuleDto> {
    const { data } = await apiClient.post<{ data: ModuleDto }>(
      '/admin/curriculum/modules',
      payload,
    );
    return unwrap(data);
  },

  /** F4-API-11 */
  async updateModule(moduleId: string | number, payload: UpdateModulePayload): Promise<ModuleDto> {
    const { data } = await apiClient.patch<{ data: ModuleDto }>(
      `/admin/curriculum/modules/${moduleId}`,
      payload,
    );
    return unwrap(data);
  },

  /** F4-API-12 */
  async publishModule(moduleId: string | number): Promise<ModuleDto> {
    const { data } = await apiClient.patch<{ data: ModuleDto }>(
      `/admin/curriculum/modules/${moduleId}/publish`,
    );
    return unwrap(data);
  },

  /** F4-API-13 */
  async archiveModule(moduleId: string | number): Promise<ModuleDto> {
    const { data } = await apiClient.patch<{ data: ModuleDto }>(
      `/admin/curriculum/modules/${moduleId}/archive`,
    );
    return unwrap(data);
  },

  /** F4-API-14 */
  async reorderModules(orders: ModuleOrderInput[]): Promise<void> {
    await apiClient.patch('/admin/curriculum/modules/reorder', { orders });
  },

  /** SCR-F4-02/03/04 editor payload (module + lessons + quizzes). */
  async getModuleEditorData(moduleId: string | number): Promise<ModuleEditorDto> {
    const { data } = await apiClient.get<{ data: ModuleEditorDto }>(
      `/admin/curriculum/modules/${moduleId}`,
    );
    return unwrap(data);
  },

  /** SCR-F4-03: lesson tag vocabulary for the editor form. */
  async getTags(): Promise<TagDto[]> {
    const { data } = await apiClient.get<{ data: TagDto[] }>('/admin/curriculum/tags');
    return unwrap(data);
  },

  /** F4-API-15 */
  async createLesson(moduleId: string | number, payload: CreateLessonPayload): Promise<LessonDto> {
    const { data } = await apiClient.post<{ data: LessonDto }>(
      `/admin/curriculum/modules/${moduleId}/lessons`,
      payload,
    );
    return unwrap(data);
  },

  /** F4-API-16 */
  async updateLesson(lessonId: string | number, payload: UpdateLessonPayload): Promise<LessonDto> {
    const { data } = await apiClient.patch<{ data: LessonDto }>(
      `/admin/curriculum/lessons/${lessonId}`,
      payload,
    );
    return unwrap(data);
  },

  /** F4-API-17 */
  async publishLesson(lessonId: string | number): Promise<LessonDto> {
    const { data } = await apiClient.patch<{ data: LessonDto }>(
      `/admin/curriculum/lessons/${lessonId}/publish`,
    );
    return unwrap(data);
  },

  /** F4-API-18 */
  async reorderLessons(moduleId: string | number, orders: LessonOrderInput[]): Promise<void> {
    await apiClient.patch(`/admin/curriculum/modules/${moduleId}/lessons/reorder`, { orders });
  },

  /** SCR-F4-03: single lesson for the editor form. */
  async getLessonEditorData(lessonId: string | number): Promise<LessonDto> {
    const { data } = await apiClient.get<{ data: LessonDto }>(
      `/admin/curriculum/lessons/${lessonId}`,
    );
    return unwrap(data);
  },

  /** F4-API-19 */
  async createQuiz(moduleId: string | number, payload: CreateQuizPayload): Promise<QuizDetailDto> {
    const { data } = await apiClient.post<{ data: QuizDetailDto }>(
      `/admin/curriculum/modules/${moduleId}/quizzes`,
      payload,
    );
    return unwrap(data);
  },

  /** F4-API-20 */
  async updateQuiz(quizId: string | number, payload: UpdateQuizPayload): Promise<QuizDetailDto> {
    const { data } = await apiClient.patch<{ data: QuizDetailDto }>(
      `/admin/curriculum/quizzes/${quizId}`,
      payload,
    );
    return unwrap(data);
  },

  /** SCR-F4-04: single quiz with questions for the builder form. */
  async getQuizEditorData(quizId: string | number): Promise<QuizDetailDto> {
    const { data } = await apiClient.get<{ data: QuizDetailDto }>(
      `/admin/curriculum/quizzes/${quizId}`,
    );
    return unwrap(data);
  },

  /** F4-API-21 */
  async createQuestion(
    quizId: string | number,
    payload: CreateQuestionPayload,
  ): Promise<QuestionDto> {
    const { data } = await apiClient.post<{ data: QuestionDto }>(
      `/admin/curriculum/quizzes/${quizId}/questions`,
      payload,
    );
    return unwrap(data);
  },

  /** F4-API-22 */
  async updateQuestion(
    questionId: string | number,
    payload: UpdateQuestionPayload,
  ): Promise<QuestionDto> {
    const { data } = await apiClient.patch<{ data: QuestionDto }>(
      `/admin/curriculum/questions/${questionId}`,
      payload,
    );
    return unwrap(data);
  },
};
