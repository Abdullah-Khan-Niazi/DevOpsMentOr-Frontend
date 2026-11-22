import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { DashboardSkeleton, LoadingState } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthReady } from '@/features/auth/hooks/useAuthBootstrap';
import { useAuthStore } from '@/features/auth/stores/authStore';

const NotFoundPage = lazy(() => import('@/pages/site/NotFoundPage'));

/**
 * Permission-based route guard (F2). The guarded page chunk is wrapped in a
 * Suspense boundary only after the permission check passes, so unauthorized
 * users never load the admin surface (§04 data-leakage requirements).
 * Accepts a single permission or a list (any-of semantics: the user must
 * hold at least one listed permission, e.g. SCR-F7-04 cohort views).
 *
 * `roles` adds a second, optional any-of role gate for surfaces that are
 * role-specific even when several roles share the same permission (for
 * example an org student's own-class page, which staff also must not open).
 */
export function PermissionRouteGuard({
  permission,
  roles,
  children,
}: {
  permission: string | string[];
  roles?: string | string[];
  children: ReactNode;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const ready = useAuthReady();

  if (!ready) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!user?.permissions) {
    return <DashboardSkeleton />;
  }

  const required = Array.isArray(permission) ? permission : [permission];
  const allowed = required.some((name) => user.permissions?.includes(name));

  if (!allowed) {
    return (
      <Suspense fallback={<LoadingState />}>
        <NotFoundPage />
      </Suspense>
    );
  }

  if (roles) {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const userRoles = new Set(user.roles ?? []);
    const roleAllowed = requiredRoles.some((name) => userRoles.has(name));

    if (!roleAllowed) {
      return (
        <Suspense fallback={<LoadingState />}>
          <NotFoundPage />
        </Suspense>
      );
    }
  }

  return <>{children}</>;
}

export default PermissionRouteGuard;
