import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { LoadingState } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';

const NotFoundPage = lazy(() => import('@/pages/site/NotFoundPage'));

/**
 * Permission-based route guard (F2). The guarded page chunk is wrapped in a
 * Suspense boundary only after the permission check passes, so unauthorized
 * users never load the admin surface (§04 data-leakage requirements).
 * Accepts a single permission or a list (any-of semantics: the user must
 * hold at least one listed permission, e.g. SCR-F7-04 cohort views).
 */
export function PermissionRouteGuard({
  permission,
  children,
}: {
  permission: string | string[];
  children: ReactNode;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!user?.permissions) {
    return <LoadingState label="Checking access…" />;
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

  return <>{children}</>;
}

export default PermissionRouteGuard;
