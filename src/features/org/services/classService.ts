import { apiClient } from '@/shared/services';
import type {
  ClassDetailDto,
  ClassDto,
  ImportSummaryDto,
  InvitationDto,
  InviteStudentsResultDto,
  PaginatedInvitationsDto,
  RosterDto,
  RosterStudentDto,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

export interface CreateClassPayload {
  className: string;
  description?: string | null;
  maxStudents?: number;
}

export interface UpdateClassPayload {
  className?: string;
  description?: string | null;
  maxStudents?: number;
}

export interface InviteStudentsPayload {
  emails: string[];
}

/** Contract §07 CLS-01..CLS-08 class management endpoints. */
export const classService = {
  /** CLS-01 */
  async createClass(payload: CreateClassPayload): Promise<ClassDto> {
    const { data } = await apiClient.post<{ data: ClassDto }>('/org/classes', payload);
    return unwrap(data);
  },

  /** CLS-02 */
  async listClasses(params?: { search?: string; page?: number; pageSize?: number }): Promise<{
    data: ClassDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { data } = await apiClient.get<{
      data: { data: ClassDto[]; total: number; page: number; pageSize: number; totalPages: number };
    }>('/org/classes', { params });
    return unwrap(data);
  },

  /** CLS-03 */
  async getClass(classId: string | number): Promise<ClassDetailDto> {
    const { data } = await apiClient.get<{ data: ClassDetailDto }>(`/org/classes/${classId}`);
    return unwrap(data);
  },

  /** CLS-04 */
  async updateClass(
    classId: string | number,
    payload: UpdateClassPayload,
  ): Promise<ClassDetailDto> {
    const { data } = await apiClient.patch<{ data: ClassDetailDto }>(
      `/org/classes/${classId}`,
      payload,
    );
    return unwrap(data);
  },

  /** CLS-05 assign professor */
  async assignProfessor(
    classId: string | number,
    professorUserId: number,
  ): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ data: { message: string } }>(
      `/org/classes/${classId}/professor`,
      { professorUserId },
    );
    return unwrap(data);
  },

  /** CLS-06 roster */
  async getRoster(
    classId: string | number,
    params?: { search?: string; page?: number; pageSize?: number },
  ): Promise<RosterDto> {
    const { data } = await apiClient.get<{ data: RosterDto }>(`/org/classes/${classId}/students`, {
      params,
    });
    return unwrap(data);
  },

  /** CLS-07 invite */
  async inviteStudents(
    classId: string | number,
    payload: InviteStudentsPayload,
  ): Promise<InviteStudentsResultDto> {
    const { data } = await apiClient.post<{ data: InviteStudentsResultDto }>(
      `/org/classes/${classId}/students/invite`,
      payload,
    );
    return unwrap(data);
  },

  /** CLS-08 bulk import (CSV) */
  async importStudents(classId: string | number, file: File): Promise<ImportSummaryDto> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<{ data: ImportSummaryDto }>(
      `/org/classes/${classId}/students/import`,
      formData,
    );
    return unwrap(data);
  },

  /** CLS withdrawn (roster action) */
  async withdrawStudent(
    classId: string | number,
    userId: string | number,
  ): Promise<RosterStudentDto> {
    const { data } = await apiClient.patch<{ data: RosterStudentDto }>(
      `/org/classes/${classId}/students/${userId}/withdraw`,
    );
    return unwrap(data);
  },

  /** Class invitations (informational aggregation). */
  async listInvitations(
    classId: string | number,
    params?: { page?: number; pageSize?: number },
  ): Promise<PaginatedInvitationsDto> {
    const { data } = await apiClient.get<{ data: PaginatedInvitationsDto }>(
      `/org/classes/${classId}/invitations`,
      { params },
    );
    return unwrap(data);
  },
};

export default classService;
export type { InvitationDto };
