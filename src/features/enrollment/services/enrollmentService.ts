import { apiClient } from '@/shared/services';
import type {
  ClassJoinResultDto,
  EnrollmentAcceptedDto,
  InvitePreviewDto,
  StudentClassDto,
} from '@/features/org/types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** Contract §07 ENR-01..ENR-03 enrollment endpoints. */
export const enrollmentService = {
  /** ENR-01 public invitation preview (optional auth). */
  async preview(token: string): Promise<InvitePreviewDto> {
    const { data } = await apiClient.get<{ data: InvitePreviewDto }>('/enroll/validate', {
      params: { token },
    });
    return unwrap(data);
  },

  /** ENR-02 accept invitation (authenticated). */
  async accept(token: string): Promise<EnrollmentAcceptedDto> {
    const { data } = await apiClient.post<{ data: EnrollmentAcceptedDto }>('/enroll/accept', {
      token,
    });
    return unwrap(data);
  },

  /** ENR-03 student's own class; optional class selection for multi-class learners. */
  async getMyClass(classId?: string | number): Promise<StudentClassDto> {
    const { data } = await apiClient.get<{ data: StudentClassDto }>('/student/my-class', {
      params: classId === undefined ? undefined : { classId },
    });
    return unwrap(data);
  },

  /** Every active class enrollment for the signed-in learner. */
  async listMyClasses(): Promise<StudentClassDto[]> {
    const { data } = await apiClient.get<{ data: StudentClassDto[] }>('/student/my-classes');
    return unwrap(data);
  },

  /** Task 3: reusable class-code self-enrollment. */
  async joinWithCode(code: string): Promise<ClassJoinResultDto> {
    const { data } = await apiClient.post<{ data: ClassJoinResultDto }>('/student/classes/join', {
      code,
    });
    return unwrap(data);
  },
};

export default enrollmentService;
