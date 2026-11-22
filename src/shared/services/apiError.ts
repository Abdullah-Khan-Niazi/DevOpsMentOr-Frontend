import type { ErrorCode } from '@/shared/constants/errorCodes';
import type { ApiError } from '@/shared/types';

const FALLBACK_MESSAGE = 'Something went wrong.';

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    'message' in error &&
    'errors' in error &&
    Array.isArray((error as ApiError).errors)
  );
}

export function getErrorCode(error: unknown): ErrorCode | null {
  return isApiError(error) ? error.code : null;
}

export function hasCode(error: unknown, ...codes: ErrorCode[]): boolean {
  const code = getErrorCode(error);
  return code !== null && codes.includes(code);
}

export function getStatusCode(error: unknown): number | null {
  return isApiError(error) ? (error.statusCode ?? null) : null;
}

/** User-facing message for any thrown value; never empty. */
export function getErrorMessage(error: unknown, fallback = FALLBACK_MESSAGE): string {
  if (isApiError(error) && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

/**
 * Field-level messages keyed by `path` (zod issues, `LAB_SPEC_INVALID`
 * `errors[1..]`). The first message per path wins.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error)) return {};
  const fields: Record<string, string> = {};
  for (const detail of error.errors) {
    const path = typeof detail.path === 'string' ? detail.path : '';
    const message = typeof detail.message === 'string' ? detail.message.trim() : '';
    if (path && message && !(path in fields)) fields[path] = message;
  }
  return fields;
}

export function getRetryAfterSeconds(error: unknown): number | null {
  return isApiError(error) ? error.retryAfterSeconds : null;
}

/** True for offline and timeout failures (no usable server answer). */
export function isNetworkError(error: unknown): boolean {
  return isApiError(error) && (error.kind === 'network' || error.kind === 'timeout');
}

export function isTimeoutError(error: unknown): boolean {
  return isApiError(error) && error.kind === 'timeout';
}

export function isCanceledError(error: unknown): boolean {
  return isApiError(error) && error.kind === 'canceled';
}
