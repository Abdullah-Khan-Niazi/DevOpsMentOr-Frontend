import type { ReactNode } from 'react';
import { AppChrome } from '@/shared/components/Layout/AppChrome';
import { ROUTES } from '@/shared/constants';

/**
 * F3 contract §09: OrgAdminShell used by all org workspace screens. The
 * sidebar is dynamically scoped to the user's active persona.
 */
export function OrgAdminShell({ children }: { children: ReactNode }) {
  return (
    <AppChrome logoTo={ROUTES.ORG_DASHBOARD}>
      {children}
    </AppChrome>
  );
}

export default OrgAdminShell;
