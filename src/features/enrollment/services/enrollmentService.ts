import { apiClient } from '@/shared/services';
import type {
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

  /** ENR-03 student's own class. */
  async getMyClass(): Promise<StudentClassDto> {
    const { data } = await apiClient.get<{ data: StudentClassDto }>('/student/my-class');
    return unwrap(data);
  },
};

export default enrollmentService;
