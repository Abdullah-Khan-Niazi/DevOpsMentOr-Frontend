import { useCallback, useEffect } from 'react';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';

// Runs whenever authentication transitions to true (initial restore or a
// fresh login) and merges /auth/me identity (roles + permissions — the login
// response carries roles but not the resolved permission set).
export function useSessionValidator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);

  const validate = useCallback(async () => {
    try {
      const me = await authService.getMe();
      const user = useAuthStore.getState().user;

      setUser({
        userId: user?.userId ?? me.userId,
        username: user?.username ?? '',
        email: me.email,
        fullName: me.fullName,
        status: user?.status ?? 'active',
        isVerified: user?.isVerified ?? false,
        roles: me.roles,
        permissions: me.permissions,
      });
    } catch {
      clearSession();
    }
  }, [setUser, clearSession]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void validate();
  }, [isAuthenticated, validate]);
}
