import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AUTH_REFRESH_TOKEN_KEY, AUTH_TOKEN_KEY } from '@/shared/services';
import type { AuthState, LoginResponse } from '../types';

/**
 * Legacy key written by the removed persisted workspace store. Removing it on
 * every session end prevents a stale value from lingering in browsers that
 * used the old build.
 */
const LEGACY_WORKSPACE_KEY = 'stardust_active_workspace';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setSession: (payload: LoginResponse) => {
        localStorage.setItem(AUTH_TOKEN_KEY, payload.data.tokens.accessToken);
        localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, payload.data.tokens.refreshToken);
        set({
          user: payload.data.user,
          accessToken: payload.data.tokens.accessToken,
          refreshToken: payload.data.tokens.refreshToken,
          isAuthenticated: true,
        });
      },
      setUser: (user) => set({ user }),
      setTokens: (tokens) => {
        localStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, tokens.refreshToken);
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      },
      clearSession: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
        // Context is URL-derived now, but purge the old persisted value so a
        // previous account's workspace name can never survive in storage.
        localStorage.removeItem(LEGACY_WORKSPACE_KEY);
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        try {
          const channel = new BroadcastChannel('auth_sync');
          channel.postMessage({ type: 'LOGOUT' });
          channel.close();
        } catch {
          // BroadcastChannel unavailable in this environment
        }
      },
    }),
    {
      name: 'auth-session',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
