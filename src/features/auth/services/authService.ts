import { apiClient } from '@/shared/services';
import type { LoginCredentials, LoginResponse } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<LoginResponse['user']> {
    const { data } = await apiClient.get<LoginResponse['user']>('/auth/me');
    return data;
  },
};
