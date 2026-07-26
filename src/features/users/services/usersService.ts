import { apiClient } from '@/shared/services';
import type { PaginatedResponse } from '@/shared/types';
import type { CreateUserInput, User } from '../types';

export const usersService = {
  async getUsers(): Promise<PaginatedResponse<User>> {
    const { data } = await apiClient.get<PaginatedResponse<User>>('/users');
    return data;
  },

  async getUserById(id: string): Promise<User> {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  async createUser(payload: CreateUserInput): Promise<User> {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
  },
};
