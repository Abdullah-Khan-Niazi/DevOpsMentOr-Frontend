import type { ReactNode } from 'react';
import { AppChrome } from './AppChrome';
import { buildNavItems } from './navigation';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ROUTES } from '@/shared/constants';

/** Contract §09: AdminShell layout for all F2 platform-admin screens. */
export function AdminShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);

  return (
    <AppChrome navItems={buildNavItems(user)} logoTo={ROUTES.ADMIN_DASHBOARD}>
      {children}
    </AppChrome>
  );
}

export default AdminShell;
