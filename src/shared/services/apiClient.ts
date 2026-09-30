import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/shared/constants';
import type { ApiError } from '@/shared/types';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
});

export function getAccessToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
}

export function setAuthTokens(tokens: TokenPair): void {
  localStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearAuthTokens(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RefreshEnvelope {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

// Single-flight refresh — all concurrent 401s wait on one rotation.
let refreshPromise: Promise<string | null> | null = null;

async function rotateAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const { data } = await axios.post<RefreshEnvelope>(
      `${ENV.API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: 15_000 },
    );
    const tokens = data.data;
    setAuthTokens(tokens);
    return tokens.accessToken;
  } catch {
    clearAuthTokens();
    return null;
  }
}

function toApiError(error: AxiosError<ApiError>): ApiError {
  const backendErrors = error.response?.data?.errors as Array<{ path: string; message: string }> | undefined;
  const detailMsg = Array.isArray(backendErrors) && backendErrors.length > 0
    ? backendErrors.map((e) => e.message).join(' ')
    : undefined;

  return {
    message: detailMsg ?? error.response?.data?.message ?? error.message ?? 'An unexpected error occurred',
    statusCode: error.response?.status,
    errors: error.response?.data?.errors,
  };
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const config = error.config as RetryableConfig | undefined;
    const isRefreshRequest = error.config?.url?.includes('/auth/refresh') ?? false;

    if (error.response?.status === 401 && config && !config._retried && !isRefreshRequest) {
      config._retried = true;

      if (!refreshPromise) {
        refreshPromise = rotateAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const accessToken = await refreshPromise;

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(config);
      }
    }

    if (error.response?.status === 401) {
      clearAuthTokens();
    }

    return Promise.reject(toApiError(error));
  },
);

export { AUTH_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY };
