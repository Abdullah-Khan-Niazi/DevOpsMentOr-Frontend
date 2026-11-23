import { useEffect, useSyncExternalStore } from 'react';
import { clearAccessToken, readCsrfToken, wasLastRefreshRejected } from '@/shared/services';
import { useAuthStore } from '../stores/authStore';
import { refreshAuthSession } from '../utils/refreshAuthSession';

/**
 * Boot-time silent refresh. The access token lives in memory only, so every
 * page load starts without one. When the store remembers a session or the
 * `dm_csrf` cookie shows a refresh cookie exists, one refresh restores the
 * token; until it settles, protected routes render a skeleton instead of
 * redirecting to login.
 */

let ready = false;
let started = false;
const listeners = new Set<() => void>();

function setReady(): void {
  ready = true;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function runBootstrap(): void {
  if (started) return;
  started = true;

  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated && readCsrfToken() === null) {
    setReady();
    return;
  }

  // apiClient already broadcast the logout when the server rejected the cookie;
  // a failed boot only resets this tab (a network blip must not end other tabs).
  const resetLocal = () => {
    clearAccessToken();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  };

  refreshAuthSession()
    .then((ok) => {
      if (!ok && wasLastRefreshRejected()) resetLocal();
    })
    .catch(() => {
      if (wasLastRefreshRejected()) resetLocal();
    })
    .finally(setReady);
}

/** True once the boot-time refresh has settled (always true on later reads). */
export function useAuthReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => false,
  );
}

/** Starts the boot-time silent refresh once and exposes `{ ready }`. */
export function useAuthBootstrap(): { ready: boolean } {
  useEffect(() => {
    runBootstrap();
  }, []);
  return { ready: useAuthReady() };
}
