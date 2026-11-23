import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  broadcastAuthSync,
  clearAccessToken,
  clearCsrfToken,
  setAccessToken,
} from '@/shared/services';
import type { AuthState } from '../types';

/**
 * Legacy keys from the token-in-storage era and the removed persisted
 * workspace store. They are purged on every session end so stale values can
 * never survive in browsers that used an older build.
 */
const LEGACY_STORAGE_KEYS = ['auth_token', 'auth_refresh_token', 'stardust_active_workspace'];

function purgeLegacyKeys(): void {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage unavailable
  }
}

/**
 * Session state. Tokens are never stored here or persisted: the access token
 * lives in memory (`authSession`) and the refresh token is an httpOnly cookie.
 * Only the non-secret user identity and the `isAuthenticated` hint persist, so
 * a reload knows to attempt a silent refresh.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setSession: (payload) => {
        setAccessToken(payload.data.tokens.accessToken, payload.data.tokens.expiresInSeconds);
        set({ user: payload.data.user, isAuthenticated: true });
      },
      setUser: (user) => set({ user }),
      setTokens: (tokens) => {
        setAccessToken(tokens.accessToken, tokens.expiresInSeconds);
      },
      clearSession: () => {
        clearAccessToken();
        clearCsrfToken();
        purgeLegacyKeys();
        set({ user: null, isAuthenticated: false });
        broadcastAuthSync({ type: 'LOGOUT' });
      },
    }),
    {
      name: 'auth-session',
      version: 1,
      // v0 persisted both tokens; keep only the non-secret identity.
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<Pick<AuthState, 'user' | 'isAuthenticated'>>;
        return {
          user: old.user ?? null,
          isAuthenticated: Boolean(old.isAuthenticated),
        } as AuthState;
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
