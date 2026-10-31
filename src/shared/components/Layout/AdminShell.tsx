import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AppChrome } from './AppChrome';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { isPlatformAdmin } from './workspaceContext';

/** Contract §09: AdminShell layout for all F2 platform-admin screens. */
export function AdminShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);

  // Defense in depth: even if a route guard is misconfigured, a non-platform
  // account must never render the platform shell.
  if (!isPlatformAdmin(user)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <AppChrome>{children}</AppChrome>;
}

export default AdminShell;
