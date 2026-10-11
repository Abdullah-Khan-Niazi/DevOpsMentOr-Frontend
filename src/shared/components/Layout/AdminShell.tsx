import type { ReactNode } from 'react';
import { AppChrome } from './AppChrome';
import { ROUTES } from '@/shared/constants';

/** Contract §09: AdminShell layout for all F2 platform-admin screens. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AppChrome logoTo={ROUTES.ADMIN_DASHBOARD}>
      {children}
    </AppChrome>
  );
}

export default AdminShell;
