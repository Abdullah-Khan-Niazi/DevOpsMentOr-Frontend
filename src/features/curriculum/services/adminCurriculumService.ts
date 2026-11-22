import { apiClient } from '@/shared/services';
import type { TagDto } from '../types';
import type {
  AdminCourseDetailDto,
  AdminCourseDto,
  AdminCourseListItemDto,
  AdminCourseListParams,
  AdminLessonDto,
  AdminModuleDetailDto,
  AdminModuleDto,
  AdminModuleItemDto,
  AdminModuleListParams,
  AdminQuestionDto,
  AdminQuizDetailDto,
  CategoryOptionDto,
  CreateCoursePayload,
  CreateModuleItemPayload,
  CreateModulePayload,
  CreateQuestionPayload,
  DifficultyOptionDto,
  UpdateCoursePayload,
  UpdateLessonPayload,
  UpdateModulePayload,
  UpdateQuestionPayload,
  UpdateQuizPayload,
} from '../types/admin';

/** Kept exported from the service for the course-create drawer's existing import path. */
export type { CreateCoursePayload } from '../types/admin';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

const BASE = '/admin/curriculum';

/** Staff curriculum API (contract C§6.1). Every course/module/item is addressed by id. */
export const adminCurriculumService = {
  /* ── Courses ─────────────────────────────────────────────────────── */

  async listCourses(params: AdminCourseListParams = {}): Promise<AdminCourseListItemDto[]> {
    const { data } = await apiClient.get<{ data: AdminCourseListItemDto[] }>(`${BASE}/courses`, {
      params: {
        search: params.search || undefined,
        status: params.status && params.status !== 'all' ? params.status : undefined,
      },
    });
    return unwrap(data);
  },

  async getCourse(courseId: number): Promise<AdminCourseDetailDto> {
    const { data } = await apiClient.get<{ data: AdminCourseDetailDto }>(
      `${BASE}/courses/${courseId}`,
    );
    return unwrap(data);
  },

  /** Creates a DRAFT course. */
  async createCourse(payload: CreateCoursePayload): Promise<AdminCourseDto> {
    const { data } = await apiClient.post<{ data: AdminCourseDto }>(`${BASE}/courses`, payload);
    return unwrap(data);
  },

  async updateCourse(courseId: number, payload: UpdateCoursePayload): Promise<AdminCourseDto> {
    const { data } = await apiClient.patch<{ data: AdminCourseDto }>(
      `${BASE}/courses/${courseId}`,
      payload,
    );
    return unwrap(data);
  },

  /** Unpublishes the course; its modules and items keep their own state. */
  async archiveCourse(courseId: number): Promise<AdminCourseDto> {
    const { data } = await apiClient.patch<{ data: AdminCourseDto }>(
      `${BASE}/courses/${courseId}/archive`,
      {},
    );
    return unwrap(data);
  },

  async deleteCourse(courseId: number): Promise<void> {
    await apiClient.delete(`${BASE}/courses/${courseId}`);
  },

  /* ── Modules ─────────────────────────────────────────────────────── */

  async listCourseModules(
    courseId: number,
    params: AdminModuleListParams = {},
  ): Promise<AdminModuleDto[]> {
    const { data } = await apiClient.get<{ data: AdminModuleDto[] }>(
      `${BASE}/courses/${courseId}/modules`,
      {
        params: {
          search: params.search || undefined,
          isPublished: params.isPublished === undefined ? undefined : String(params.isPublished),
        },
      },
    );
    return unwrap(data);
  },

  /** Appends the module to the end of the course. */
  async createModule(courseId: number, payload: CreateModulePayload): Promise<AdminModuleDto> {
    const { data } = await apiClient.post<{ data: AdminModuleDto }>(
      `${BASE}/courses/${courseId}/modules`,
      payload,
    );
    return unwrap(data);
  },

  /** `moduleIds` must be the exact full set of the course's modules. */
  async reorderModules(courseId: number, moduleIds: number[]): Promise<AdminModuleDto[]> {
    const { data } = await apiClient.patch<{ data: AdminModuleDto[] }>(
      `${BASE}/courses/${courseId}/modules/reorder`,
      { moduleIds },
    );
    return unwrap(data);
  },

  async getModule(moduleId: number): Promise<AdminModuleDetailDto> {
    const { data } = await apiClient.get<{ data: AdminModuleDetailDto }>(
      `${BASE}/modules/${moduleId}`,
    );
    return unwrap(data);
  },

  async updateModule(moduleId: number, payload: UpdateModulePayload): Promise<AdminModuleDto> {
    const { data } = await apiClient.patch<{ data: AdminModuleDto }>(
      `${BASE}/modules/${moduleId}`,
      payload,
    );
    return unwrap(data);
  },

  async publishModule(moduleId: number): Promise<AdminModuleDto> {
    const { data } = await apiClient.patch<{ data: AdminModuleDto }>(
      `${BASE}/modules/${moduleId}/publish`,
      {},
    );
    return unwrap(data);
  },

  /** Unpublishes the module and every item in it. */
  async archiveModule(moduleId: number): Promise<AdminModuleDto> {
    const { data } = await apiClient.patch<{ data: AdminModuleDto }>(
      `${BASE}/modules/${moduleId}/archive`,
      {},
    );
    return unwrap(data);
  },

  async deleteModule(moduleId: number): Promise<void> {
    await apiClient.delete(`${BASE}/modules/${moduleId}`);
  },

  /* ── Module items (lesson / lab / quiz spine rows) ───────────────── */

  /** Items are created as drafts and appended. */
  async createItem(
    moduleId: number,
    payload: CreateModuleItemPayload,
  ): Promise<AdminModuleItemDto> {
    const { data } = await apiClient.post<{ data: AdminModuleItemDto }>(
      `${BASE}/modules/${moduleId}/items`,
      payload,
    );
    return unwrap(data);
  },

  /** `itemIds` must be the exact full set of the module's items. */
  async reorderItems(moduleId: number, itemIds: number[]): Promise<AdminModuleItemDto[]> {
    const { data } = await apiClient.patch<{ data: AdminModuleItemDto[] }>(
      `${BASE}/modules/${moduleId}/items/reorder`,
      { itemIds },
    );
    return unwrap(data);
  },

  /** Title edit for any item kind (the only edit for lab items). */
  async updateItemTitle(itemId: number, title: string): Promise<AdminModuleItemDto> {
    const { data } = await apiClient.patch<{ data: AdminModuleItemDto }>(
      `${BASE}/items/${itemId}`,
      { title },
    );
    return unwrap(data);
  },

  async publishItem(itemId: number, isPublished: boolean): Promise<AdminModuleItemDto> {
    const { data } = await apiClient.patch<{ data: AdminModuleItemDto }>(
      `${BASE}/items/${itemId}/publish`,
      { isPublished },
    );
    return unwrap(data);
  },

  /** Lesson: deletes the row. Lab item: the spine row only. Quiz item: the quiz. */
  async deleteItem(itemId: number): Promise<void> {
    await apiClient.delete(`${BASE}/items/${itemId}`);
  },

  /* ── Lessons ─────────────────────────────────────────────────────── */

  async getLesson(lessonId: number): Promise<AdminLessonDto> {
    const { data } = await apiClient.get<{ data: AdminLessonDto }>(`${BASE}/lessons/${lessonId}`);
    return unwrap(data);
  },

  async updateLesson(lessonId: number, payload: UpdateLessonPayload): Promise<AdminLessonDto> {
    const { data } = await apiClient.patch<{ data: AdminLessonDto }>(
      `${BASE}/lessons/${lessonId}`,
      payload,
    );
    return unwrap(data);
  },

  /* ── Quizzes and questions ───────────────────────────────────────── */

  async getQuiz(quizId: number): Promise<AdminQuizDetailDto> {
    const { data } = await apiClient.get<{ data: AdminQuizDetailDto }>(`${BASE}/quizzes/${quizId}`);
    return unwrap(data);
  },

  /** A title change also renames the quiz's module item. */
  async updateQuiz(quizId: number, payload: UpdateQuizPayload): Promise<AdminQuizDetailDto> {
    const { data } = await apiClient.patch<{ data: AdminQuizDetailDto }>(
      `${BASE}/quizzes/${quizId}`,
      payload,
    );
    return unwrap(data);
  },

  async deleteQuiz(quizId: number): Promise<void> {
    await apiClient.delete(`${BASE}/quizzes/${quizId}`);
  },

  /** Appends the question to the end of the quiz. */
  async createQuestion(quizId: number, payload: CreateQuestionPayload): Promise<AdminQuestionDto> {
    const { data } = await apiClient.post<{ data: AdminQuestionDto }>(
      `${BASE}/quizzes/${quizId}/questions`,
      payload,
    );
    return unwrap(data);
  },

  async updateQuestion(
    questionId: number,
    payload: UpdateQuestionPayload,
  ): Promise<AdminQuestionDto> {
    const { data } = await apiClient.patch<{ data: AdminQuestionDto }>(
      `${BASE}/questions/${questionId}`,
      payload,
    );
    return unwrap(data);
  },

  async deleteQuestion(questionId: number): Promise<void> {
    await apiClient.delete(`${BASE}/questions/${questionId}`);
  },

  /** `questionIds` must be the exact full set of the quiz's questions. */
  async reorderQuestions(quizId: number, questionIds: number[]): Promise<AdminQuestionDto[]> {
    const { data } = await apiClient.patch<{ data: AdminQuestionDto[] }>(
      `${BASE}/quizzes/${quizId}/questions/reorder`,
      { questionIds },
    );
    return unwrap(data);
  },

  /* ── Reference data ──────────────────────────────────────────────── */

  async listTags(): Promise<TagDto[]> {
    const { data } = await apiClient.get<{ data: TagDto[] }>(`${BASE}/tags`);
    return unwrap(data);
  },

  async listDifficulties(): Promise<DifficultyOptionDto[]> {
    const { data } = await apiClient.get<{ data: DifficultyOptionDto[] }>(`${BASE}/difficulties`);
    return unwrap(data);
  },

  async listCategories(): Promise<CategoryOptionDto[]> {
    const { data } = await apiClient.get<{ data: CategoryOptionDto[] }>(`${BASE}/categories`);
    return unwrap(data);
  },
};
