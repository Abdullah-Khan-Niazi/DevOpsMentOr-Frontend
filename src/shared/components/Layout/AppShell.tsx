import { Outlet } from 'react-router-dom';
import { AppChrome } from './AppChrome';
import { buildNavItems } from './navigation';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ROUTES } from '@/shared/constants';

export function AppShell() {
  const user = useAuthStore((state) => state.user);

  return (
    <AppChrome navItems={buildNavItems(user)} logoTo={ROUTES.DASHBOARD}>
      <Outlet />
    </AppChrome>
  );
}
