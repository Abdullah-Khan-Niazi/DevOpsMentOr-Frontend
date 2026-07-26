import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/shared/constants';
import type { ApiError } from '@/shared/types';

const AUTH_TOKEN_KEY = 'auth_token';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const apiError: ApiError = {
      message: error.response?.data?.message ?? error.message ?? 'An unexpected error occurred',
      statusCode: error.response?.status,
      errors: error.response?.data?.errors,
    };

    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }

    return Promise.reject(apiError);
  },
);

export { AUTH_TOKEN_KEY };
