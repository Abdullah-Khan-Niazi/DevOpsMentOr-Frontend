import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AUTH_TOKEN_KEY } from '@/shared/services';
import type { AuthState, LoginResponse } from '../types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setSession: (payload: LoginResponse) => {
        localStorage.setItem(AUTH_TOKEN_KEY, payload.data.tokens.accessToken);
        set({
          user: payload.data.user,
          accessToken: payload.data.tokens.accessToken,
          isAuthenticated: true,
        });
      },
      clearSession: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-session',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
