import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AUTH_REFRESH_TOKEN_KEY, AUTH_TOKEN_KEY } from '@/shared/services';
import type { AuthState, LoginResponse } from '../types';

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
      clearSession: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
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
