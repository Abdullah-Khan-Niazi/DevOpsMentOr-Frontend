import type { ErrorCode } from '@/shared/constants/errorCodes';

/** One element of the backend `errors[]` array (`{ success: false, message, errors }`). */
export interface ApiErrorDetail {
  code?: string;
  path?: string;
  message?: string;
  retryAfterSeconds?: number;
  reason?: string;
  instanceId?: number;
  labId?: number;
  [key: string]: unknown;
}

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'canceled';

/** Normalized rejection value of every `apiClient` call. */
export interface ApiError {
  kind: ApiErrorKind;
  /** User-facing message; never empty. */
  message: string;
  statusCode?: number;
  /** `errors[0].code` when it is a known catalog code, otherwise null. */
  code: ErrorCode | null;
  /** Backend `errors[]`, always an array. */
  errors: ApiErrorDetail[];
  /** `errors[0].retryAfterSeconds`, else the `Retry-After` header, else null. */
  retryAfterSeconds: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
