import { apiClient } from '@/shared/services';
import type { CourseOverviewDto, LessonDto, ModuleDto, QuizDto } from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F4 §07 F4-API-01..06 learner read endpoints (published content only). */
export const curriculumService = {
  /** F4-API-01 */
  async getCourseOverview(): Promise<CourseOverviewDto> {
    const { data } = await apiClient.get<{ data: CourseOverviewDto }>('/curriculum/course');
    return unwrap(data);
  },

  /** F4-API-02 */
  async getModules(): Promise<ModuleDto[]> {
    const { data } = await apiClient.get<{ data: ModuleDto[] }>('/curriculum/modules');
    return unwrap(data);
  },

  /** F4-API-03 */
  async getModule(moduleId: string | number): Promise<ModuleDto> {
    const { data } = await apiClient.get<{ data: ModuleDto }>(`/curriculum/modules/${moduleId}`);
    return unwrap(data);
  },

  /** F4-API-04 */
  async getModuleLessons(moduleId: string | number): Promise<LessonDto[]> {
    const { data } = await apiClient.get<{ data: LessonDto[] }>(
      `/curriculum/modules/${moduleId}/lessons`,
    );
    return unwrap(data);
  },

  /** F4-API-05 */
  async getLesson(lessonId: string | number): Promise<LessonDto> {
    const { data } = await apiClient.get<{ data: LessonDto }>(`/curriculum/lessons/${lessonId}`);
    return unwrap(data);
  },

  /** F4-API-06 */
  async getModuleQuizzes(moduleId: string | number): Promise<QuizDto[]> {
    const { data } = await apiClient.get<{ data: QuizDto[] }>(
      `/curriculum/modules/${moduleId}/quizzes`,
    );
    return unwrap(data);
  },
};
