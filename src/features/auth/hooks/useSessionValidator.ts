import { useCallback, useEffect } from 'react';
import { ROUTES } from '@/shared/constants';
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
        username: me.username || user?.username || '',
        email: me.email,
        fullName: me.fullName,
        status: me.status || user?.status || 'active',
        isVerified: me.isVerified,
        twoFactorEnabled: me.twoFactorEnabled,
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

  // Back-Forward Cache (bfcache) and swipe-back popstate security guards
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      const isAuth = useAuthStore.getState().isAuthenticated;
      if (event.persisted && !isAuth) {
        // Page was restored from bfcache while logged out. Force immediate redirect to login.
        window.location.replace(ROUTES.LOGIN);
      } else if (isAuth) {
        void validate();
      }
    };

    const handlePopState = () => {
      const isAuth = useAuthStore.getState().isAuthenticated;
      const pathname = window.location.pathname;

      const publicPaths: string[] = [
        ROUTES.HOME,
        ROUTES.LOGIN,
        ROUTES.SIGNUP,
        ROUTES.VERIFY_EMAIL,
        ROUTES.FORGOT_PASSWORD,
        ROUTES.RESET_PASSWORD,
        ROUTES.OAUTH_CALLBACK,
        ROUTES.HOW_IT_WORKS,
        ROUTES.CURRICULUM,
        ROUTES.PRICING,
        ROUTES.ABOUT,
        ROUTES.CONTACT,
        ROUTES.FOR_INSTITUTIONS,
        ROUTES.FAQ,
        ROUTES.DOCUMENTATION,
        ROUTES.PRIVACY,
        ROUTES.TERMS,
      ];

      const isPublic = publicPaths.includes(pathname);
      if (!isAuth && !isPublic) {
        // Unauthenticated navigation back into protected/admin space: kick back to login
        window.location.replace(ROUTES.LOGIN);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [validate]);
}
