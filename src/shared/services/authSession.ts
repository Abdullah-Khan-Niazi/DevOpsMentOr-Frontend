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

export const TAB_ID: string =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export type AuthSyncMessage =
  | { type: 'LOGOUT'; senderId: string }
  | { type: 'TOKEN_REFRESHED'; senderId: string; accessToken: string; expiresInSeconds: number };

let accessToken: string | null = null;
let memoryCsrfToken: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refresher: TokenRefresher | null = null;
const listeners = new Set<AccessTokenListener>();

export function broadcastAuthSync(
  payload:
    | { type: 'LOGOUT' }
    | { type: 'TOKEN_REFRESHED'; accessToken: string; expiresInSeconds: number },
): void {
  try {
    const channel = new BroadcastChannel('auth_sync');
    channel.postMessage({ ...payload, senderId: TAB_ID });
    channel.close();
  } catch {
    // BroadcastChannel unavailable in this environment
  }
}

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

export function setCsrfToken(token: string | null): void {
  memoryCsrfToken = token && token.trim().length > 0 ? token.trim() : null;
}

export function clearCsrfToken(): void {
  memoryCsrfToken = null;
}

/** Value of the `dm_csrf` cookie or in-memory header mirror, or null when absent. */
export function readCsrfToken(): string | null {
  if (typeof document !== 'undefined') {
    for (const part of document.cookie.split(';')) {
      const separator = part.indexOf('=');
      if (separator === -1) continue;
      const name = part.slice(0, separator).trim();
      if (name === CSRF_COOKIE_NAME) {
        const value = part.slice(separator + 1).trim();
        if (value.length > 0) {
          return value;
        }
      }
    }
  }
  return memoryCsrfToken;
}
