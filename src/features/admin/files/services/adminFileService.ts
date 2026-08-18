import { apiClient } from '@/shared/services';
import type { AdminFileDto, AdminFileListDto } from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F8 §07 admin file endpoints (OPS-43/44, SCR-F8-17). */
export const adminFileService = {
  /** OPS-43: upload a platform file (multipart). */
  async uploadFile(file: File, isPublic = false): Promise<AdminFileDto> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<{ data: AdminFileDto }>('/admin/files', formData, {
      params: { isPublic },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(data);
  },

  /** OPS-44: list platform files, paginated. */
  async listFiles(page = 1, limit = 25): Promise<AdminFileListDto> {
    const { data } = await apiClient.get<{ data: AdminFileListDto }>('/admin/files', {
      params: { page, limit },
    });
    return unwrap(data);
  },
};

export default adminFileService;
