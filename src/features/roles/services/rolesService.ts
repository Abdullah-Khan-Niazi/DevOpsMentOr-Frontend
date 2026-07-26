import { apiClient } from '@/shared/services';
import type { Role } from '../types';

export const rolesService = {
  async getRoles(): Promise<Role[]> {
    const { data } = await apiClient.get<Role[]>('/roles');
    return data;
  },
};
