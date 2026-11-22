import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/shared/constants';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';
import { useAuthReady } from './useAuthBootstrap';

// Tracks which account produced the current query cache. If a different
// account signs in in the same tab, the previous account's org/class/progress
// data must never paint while the new session loads.
let cachedUserId: number | null = null;

// Runs whenever authentication transitions to true (initial restore or a
// fresh login) and merges /auth/me identity (roles + permissions — the login
// response carries roles but not the resolved permission set).
export function useSessionValidator() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const ready = useAuthReady();
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);

  const endSession = useCallback(() => {
    queryClient.clear();
    cachedUserId = null;
    clearSession();
  }, [clearSession, queryClient]);

  const validate = useCallback(async () => {
    try {
      const me = await authService.getMe();

      if (cachedUserId !== null && cachedUserId !== me.userId) {
        // A different account now owns this tab. Nothing cached under the
        // previous identity is safe to reuse.
        queryClient.clear();
      }
      cachedUserId = me.userId;

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
      endSession();
    }
  }, [endSession, queryClient, setUser]);

  useEffect(() => {
    // Wait for the boot-time refresh so /auth/me never races it.
    if (!ready || !isAuthenticated) return;
    void validate();
  }, [ready, isAuthenticated, validate]);

  // Cross-tab logout synchronization (BroadcastChannel 'auth_sync')
  useEffect(() => {
    const handleLogout = () => {
      if (useAuthStore.getState().isAuthenticated) {
        endSession();
        window.location.replace(ROUTES.LOGIN);
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('auth_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          handleLogout();
        }
      };
    } catch {
      // BroadcastChannel unavailable
    }

    return () => {
      if (channel) {
        channel.close();
      }
    };
  }, [endSession]);

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
        ROUTES.CURRICULUM,
        ROUTES.PRICING,
        ROUTES.ABOUT,
        ROUTES.CONTACT,
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
