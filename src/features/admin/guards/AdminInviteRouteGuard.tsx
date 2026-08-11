import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { LoadingState } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';

// Zero client information leakage (§6): the admin panel chunk is only
// imported after the permission check passes. Unauthorized users land on a
// NotFound UI; the panel never exists in their runtime.

const AdminPlatformAdminsPage = lazy(() => import('../pages/AdminPlatformAdminsPage'));
const NotFoundPage = lazy(() => import('@/pages/site/NotFoundPage'));

const PLATFORM_ADMIN_INVITE = 'platform.admin.invite';

function Suspended({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <Suspense fallback={fallback ?? <LoadingState />}>{children}</Suspense>;
}

export function AdminInviteRouteGuard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
  }

  if (!user?.permissions) {
    return <LoadingState label="Checking access…" />;
  }

  if (!user.permissions.includes(PLATFORM_ADMIN_INVITE)) {
    return (
      <Suspended>
        <NotFoundPage />
      </Suspended>
    );
  }

  return (
    <Suspended>
      <AdminPlatformAdminsPage />
    </Suspended>
  );
}

export default AdminInviteRouteGuard;
