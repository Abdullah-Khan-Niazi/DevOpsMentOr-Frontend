import { apiClient } from '@/shared/services';
import type {
  LearnerCourseDetailDto,
  LearnerCourseDto,
  LessonDto,
  ModuleDto,
  ModuleItemDto,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** C§4.2 learner curriculum reads (published content only; outline reads carry `access`). */
export const curriculumService = {
  /** `GET /curriculum/courses`: published courses with module and item counts. */
  async listCourses(): Promise<LearnerCourseDto[]> {
    const { data } = await apiClient.get<{ data: LearnerCourseDto[] }>('/curriculum/courses');
    return unwrap(data);
  },

  /** `GET /curriculum/courses/:courseId`: course, its modules and the learner's access decision. */
  async getCourse(courseId: number): Promise<LearnerCourseDetailDto> {
    const { data } = await apiClient.get<{ data: LearnerCourseDetailDto }>(
      `/curriculum/courses/${courseId}`,
    );
    return unwrap(data);
  },

  /** `GET /curriculum/courses/:courseId/modules`: published modules ordered by `module_order`. */
  async listCourseModules(courseId: number): Promise<ModuleDto[]> {
    const { data } = await apiClient.get<{ data: ModuleDto[] }>(
      `/curriculum/courses/${courseId}/modules`,
    );
    return unwrap(data);
  },

  /** `GET /curriculum/modules/:moduleId` */
  async getModule(moduleId: string | number): Promise<ModuleDto> {
    const { data } = await apiClient.get<{ data: ModuleDto }>(`/curriculum/modules/${moduleId}`);
    return unwrap(data);
  },

  /** `GET /curriculum/modules/:moduleId/items`: titles and counts of every item on the spine. */
  async listModuleItems(moduleId: number): Promise<ModuleItemDto[]> {
    const { data } = await apiClient.get<{ data: ModuleItemDto[] }>(
      `/curriculum/modules/${moduleId}/items`,
    );
    return unwrap(data);
  },

  /** `GET /curriculum/lessons/:lessonId`: one item with module context and slides URL. */
  async getLesson(lessonId: string | number): Promise<LessonDto> {
    const { data } = await apiClient.get<{ data: LessonDto }>(`/curriculum/lessons/${lessonId}`);
    return unwrap(data);
  },
};
