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
 */
export function PermissionRouteGuard({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
  }

  if (!user?.permissions) {
    return <LoadingState label="Checking access…" />;
  }

  if (!user.permissions.includes(permission)) {
    return (
      <Suspense fallback={<LoadingState />}>
        <NotFoundPage />
      </Suspense>
    );
  }

  return <>{children}</>;
}

export default PermissionRouteGuard;
