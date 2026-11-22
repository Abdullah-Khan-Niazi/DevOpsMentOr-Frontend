/**
 * In-memory access token. The access token is never persisted: it is lost on
 * reload and re-issued by `POST /auth/refresh` (httpOnly refresh cookie + CSRF).
 * Nothing in this module touches localStorage or sessionStorage.
 */

type AccessTokenListener = (token: string | null) => void;
type TokenRefresher = () => Promise<unknown>;

/** Refresh this many seconds before the access token expires. */
const PROACTIVE_REFRESH_LEAD_SECONDS = 60;
/** Floor for the proactive delay, so a very short lifetime cannot cause a refresh loop. */
const MIN_PROACTIVE_REFRESH_SECONDS = 10;
/** Access lifetime assumed by the deprecated `setAuthTokens` alias (backend `JWT_ACCESS_EXPIRES_IN`). */
export const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 900;

const CSRF_COOKIE_NAME = 'dm_csrf';

let accessToken: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refresher: TokenRefresher | null = null;
const listeners = new Set<AccessTokenListener>();

function notify(): void {
  for (const listener of listeners) {
    listener(accessToken);
  }
}

function cancelProactiveRefresh(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function scheduleProactiveRefresh(expiresInSeconds: number): void {
  cancelProactiveRefresh();
  const delaySeconds = Math.max(
    expiresInSeconds - PROACTIVE_REFRESH_LEAD_SECONDS,
    MIN_PROACTIVE_REFRESH_SECONDS,
  );
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    if (refresher) {
      void refresher().catch(() => {
        // The refresher reports its own failures (clears the session).
      });
    }
  }, delaySeconds * 1000);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string, expiresInSeconds: number): void {
  accessToken = token;
  scheduleProactiveRefresh(expiresInSeconds);
  notify();
}

export function clearAccessToken(): void {
  accessToken = null;
  cancelProactiveRefresh();
  notify();
}

/** Subscribes to access token changes. Returns the unsubscribe function. */
export function onAccessTokenChange(callback: AccessTokenListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/** Registers the function the proactive timer calls to rotate the session. */
export function registerTokenRefresher(fn: TokenRefresher): void {
  refresher = fn;
}

/** Value of the `dm_csrf` cookie (double-submit token), or null when absent. */
export function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  for (const part of document.cookie.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    if (name === CSRF_COOKIE_NAME) {
      const value = part.slice(separator + 1).trim();
      return value.length > 0 ? value : null;
    }
  }
  return null;
}
