import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { DashboardSkeleton } from '@/shared/components/Skeleton';
import { ROUTES } from '@/shared/constants';
import { useAuthReady } from '../hooks/useAuthBootstrap';
import { useAuthStore } from '../stores/authStore';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const ready = useAuthReady();
  const location = useLocation();

  // The boot-time refresh may still restore the session: do not redirect yet.
  if (!ready) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
