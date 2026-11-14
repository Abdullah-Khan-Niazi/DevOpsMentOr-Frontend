import { apiClient } from '@/shared/services';
import type { ClassAssignmentWithStatsDto, CourseCatalogItemDto } from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

export interface CreateAssignmentPayload {
  courseId: number;
  dueDate?: string | null;
  isMandatory?: boolean;
}

export interface UpdateAssignmentPayload {
  dueDate?: string | null;
  isMandatory?: boolean;
}

/** chaos sprint: cohort course assignments + published course catalog. */
export const assignmentService = {
  async listForClass(classId: string | number): Promise<ClassAssignmentWithStatsDto[]> {
    const { data } = await apiClient.get<{ data: ClassAssignmentWithStatsDto[] }>(
      `/org/classes/${classId}/assignments`,
    );
    return unwrap(data);
  },

  async create(
    classId: string | number,
    payload: CreateAssignmentPayload,
  ): Promise<ClassAssignmentWithStatsDto> {
    const { data } = await apiClient.post<{ data: ClassAssignmentWithStatsDto }>(
      `/org/classes/${classId}/assignments`,
      payload,
    );
    return unwrap(data);
  },

  async update(
    classId: string | number,
    assignmentId: number,
    payload: UpdateAssignmentPayload,
  ): Promise<ClassAssignmentWithStatsDto> {
    const { data } = await apiClient.patch<{ data: ClassAssignmentWithStatsDto }>(
      `/org/classes/${classId}/assignments/${assignmentId}`,
      payload,
    );
    return unwrap(data);
  },

  async remove(classId: string | number, assignmentId: number): Promise<void> {
    await apiClient.delete(`/org/classes/${classId}/assignments/${assignmentId}`);
  },

  /** Published course catalog for the assignment picker. */
  async listCourses(): Promise<CourseCatalogItemDto[]> {
    const { data } = await apiClient.get<{ data: CourseCatalogItemDto[] }>('/curriculum/courses');
    return unwrap(data);
  },
};

export default assignmentService;
