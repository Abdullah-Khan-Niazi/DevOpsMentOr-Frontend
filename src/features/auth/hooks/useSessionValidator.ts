import { useEffect, useRef } from 'react';
import { apiClient } from '@/shared/services';
import type { AuthUser } from '../types';
import { useAuthStore } from '../stores/authStore';

export function useSessionValidator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setSession = useAuthStore((state) => state.setSession);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!isAuthenticated) return;

    apiClient
      .get<{ success: boolean; message: string; data: AuthUser }>('/auth/me')
      .then((res) => {
        const accessToken = localStorage.getItem('auth_token') ?? '';
        setSession({
          success: true,
          message: 'Session restored',
          data: {
            user: res.data.data,
            tokens: { accessToken, refreshToken: '' },
          },
        });
      })
      .catch(() => {
        clearSession();
      });
  }, [isAuthenticated, clearSession, setSession]);
}
