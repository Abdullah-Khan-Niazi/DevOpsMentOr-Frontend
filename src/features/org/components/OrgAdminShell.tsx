import type { ReactNode } from 'react';
import { AppChrome } from '@/shared/components/Layout/AppChrome';
import { buildNavItems } from '@/shared/components/Layout/navigation';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ROUTES } from '@/shared/constants';

/**
 * F3 contract §09: OrgAdminShell used by all org workspace screens. The
 * sidebar is the shared permission-gated navigation (§04 RBAC surface
 * control) — the same list in every shell, so it never morphs.
 */
export function OrgAdminShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);

  return (
    <AppChrome navItems={buildNavItems(user)} logoTo={ROUTES.ORG_DASHBOARD}>
      {children}
    </AppChrome>
  );
}

export default OrgAdminShell;
