import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/shared/constants';
import { isErrorCode } from '@/shared/constants/errorCodes';
import type { ApiError, ApiErrorDetail, ApiErrorKind } from '@/shared/types';
import {
  clearAccessToken,
  DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
  getAccessToken,
  readCsrfToken,
  registerTokenRefresher,
  setAccessToken,
} from './authSession';
import { serverClock } from './serverClock';

/** Default client timeout for ordinary calls. */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Timeout for calls the backend may legitimately hold open for a long time
 * (lab provision, step stage/check, terminal quiz stage/answers). A client
 * timeout on these is not a failure signal: callers refetch state instead.
 */
export const LONG_REQUEST_TIMEOUT_MS = 120_000;

/**
 * Legacy localStorage keys from the token-in-storage era. They are removed on
 * module load and never read or written again.
 * @deprecated Tokens are no longer stored; kept so authStore compiles until wave 4.
 */
export const AUTH_TOKEN_KEY = 'auth_token';
/** @deprecated See AUTH_TOKEN_KEY. */
export const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token';

/** Endpoints that use the refresh cookie or are CSRF-protected (C§11.5). */
const COOKIE_AUTH_PATHS = ['/auth/refresh', '/auth/logout', '/auth/logout-all'];

/** Endpoints where a 401 means bad credentials or a spent code, never an expired access token. */
const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/admin/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/oauth/',
  '/auth/refresh',
  '/auth/logout',
];

function skipsRefresh(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0];
  return NO_REFRESH_PATHS.some((entry) => path.includes(entry));
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
});

try {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
} catch {
  // localStorage unavailable
}

function isCookieAuthPath(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0];
  return COOKIE_AUTH_PATHS.some((cookiePath) => path.endsWith(cookiePath));
}

function csrfHeader(): Record<string, string> {
  const csrf = readCsrfToken();
  return csrf ? { 'X-CSRF-Token': csrf } : {};
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (isCookieAuthPath(config.url)) {
    config.withCredentials = true;
    Object.assign(config.headers, csrfHeader());
  }
  return config;
});

interface RefreshEnvelope {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    expiresInSeconds: number;
  };
}

/** Tells other tabs that this session has ended. */
function broadcastLogout(): void {
  try {
    const channel = new BroadcastChannel('auth_sync');
    channel.postMessage({ type: 'LOGOUT' });
    channel.close();
  } catch {
    // BroadcastChannel unavailable in this environment
  }
}

async function requestAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<RefreshEnvelope>(
      `${ENV.API_BASE_URL}/auth/refresh`,
      {},
      { timeout: 15_000, withCredentials: true, headers: csrfHeader() },
    );
    setAccessToken(data.data.accessToken, data.data.expiresInSeconds);
    return data.data.accessToken;
  } catch (error) {
    // Only a definitive rejection ends the session. A network error or a 5xx
    // must not sign the user out of every tab.
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 400 || status === 401 || status === 403) {
      clearAccessToken();
      broadcastLogout();
    }
    return null;
  }
}

/**
 * Runs the refresh under a cross-tab lock. The refresh token rotates on every
 * call, so two tabs refreshing with the same cookie would look like reuse and
 * revoke the session.
 */
function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('dm_auth_refresh', task);
  }
  return task();
}

// Single-flight refresh: concurrent 401s, the proactive timer and explicit
// callers all share one in-flight rotation.
let refreshPromise: Promise<string | null> | null = null;

/**
 * Rotates the refresh cookie and stores the new access token in memory.
 * Resolves to the new access token, or null when the session is gone.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = runExclusive(requestAccessToken).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

registerTokenRefresher(refreshAccessToken);

/** @deprecated Refresh tokens are httpOnly cookies and never reach JavaScript. */
export function getRefreshToken(): null {
  return null;
}

/** @deprecated Use `setAccessToken` from `authSession`. */
export function setAuthTokens(tokens: { accessToken: string }): void {
  setAccessToken(tokens.accessToken, DEFAULT_ACCESS_TOKEN_TTL_SECONDS);
}

/** @deprecated Use `clearAccessToken` from `authSession`. */
export function clearAuthTokens(): void {
  clearAccessToken();
}

interface TokenPair {
  accessToken: string;
  /** Always empty: the refresh token is an httpOnly cookie. */
  refreshToken: string;
}

/** @deprecated Use `refreshAccessToken`. */
export function rotateAuthTokens(): Promise<TokenPair | null> {
  return refreshAccessToken().then((accessToken) =>
    accessToken ? { accessToken, refreshToken: '' } : null,
  );
}

/** Backend failure envelope `{ success: false, message, errors }` (shape not trusted). */
interface ErrorEnvelope {
  success?: unknown;
  message?: unknown;
  errors?: unknown;
}

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  http: 'Something went wrong.',
  network: 'You appear to be offline.',
  timeout: 'The request timed out.',
  canceled: 'Request canceled.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/** Normalizes `errors` to an array (legacy `Record<field, string[]>` shapes included). */
function normalizeErrorDetails(raw: unknown): ApiErrorDetail[] {
  if (Array.isArray(raw)) {
    return raw.filter(isRecord).map((entry) => {
      const detail: ApiErrorDetail = { ...entry };
      if (Array.isArray(entry.path)) detail.path = entry.path.map(String).join('.');
      return detail;
    });
  }
  if (isRecord(raw)) {
    return Object.entries(raw).map(([path, value]) => ({
      path,
      message: Array.isArray(value) ? value.map(String).join(' ') : String(value ?? ''),
    }));
  }
  return [];
}

function parseRetryAfterHeader(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const raw = String(value).trim();
  if (raw.length === 0) return null;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));
  const dateMs = Date.parse(raw);
  if (Number.isNaN(dateMs)) return null;
  return Math.max(0, Math.ceil((dateMs - serverClock.now()) / 1000));
}

function errorKind(error: unknown): ApiErrorKind {
  if (axios.isCancel(error)) return 'canceled';
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_CANCELED') return 'canceled';
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'timeout';
    if (!error.response) return 'network';
    return 'http';
  }
  return 'network';
}

/** Converts any rejection from axios (or a thrown value) into the normalized `ApiError`. */
export function toApiError(error: unknown): ApiError {
  const kind = errorKind(error);
  const response = axios.isAxiosError(error) ? error.response : undefined;
  const envelope: ErrorEnvelope = isRecord(response?.data) ? (response.data as ErrorEnvelope) : {};
  const errors = normalizeErrorDetails(envelope.errors);
  const first = errors[0];

  const message =
    (kind === 'http' ? nonEmptyString(envelope.message) : null) ??
    errors.map((detail) => nonEmptyString(detail.message)).find((m) => m !== null) ??
    DEFAULT_MESSAGES[kind];

  const retryAfterFromBody =
    typeof first?.retryAfterSeconds === 'number' && Number.isFinite(first.retryAfterSeconds)
      ? Math.max(0, Math.ceil(first.retryAfterSeconds))
      : null;

  return {
    kind,
    message,
    statusCode: response?.status,
    code: isErrorCode(first?.code) ? first.code : null,
    errors,
    retryAfterSeconds:
      retryAfterFromBody ?? parseRetryAfterHeader(response?.headers?.['retry-after']),
  };
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    serverClock.recordDateHeader(response.headers?.['date']);
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      serverClock.recordDateHeader(error.response.headers?.['date']);
    }
    const config = error.config as RetryableConfig | undefined;
    const isRefreshRequest = skipsRefresh(error.config?.url);

    if (error.response?.status === 401 && config && !config._retried && !isRefreshRequest) {
      config._retried = true;

      const accessToken = await refreshAccessToken();

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(config);
      }
    }

    if (error.response?.status === 401 && !isRefreshRequest) {
      clearAccessToken();
    }

    return Promise.reject(toApiError(error));
  },
);
