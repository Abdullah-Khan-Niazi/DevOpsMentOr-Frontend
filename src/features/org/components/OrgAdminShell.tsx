import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AppChrome } from '@/shared/components/Layout/AppChrome';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { isOrgStaff, isPlatformAdmin } from '@/shared/components/Layout/workspaceContext';

/**
 * F3 contract §09: OrgAdminShell used by all org workspace screens. The
 * sidebar is dynamically scoped to the user's active persona.
 *
 * Role guard is defense in depth. PermissionRouteGuard remains the primary
 * gate, but the shell also refuses to render for platform admins and for
 * accounts with no org staff role.
 */
export function OrgAdminShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);

  if (isPlatformAdmin(user)) {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  }

  if (!isOrgStaff(user)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <AppChrome>{children}</AppChrome>;
}

export default OrgAdminShell;
