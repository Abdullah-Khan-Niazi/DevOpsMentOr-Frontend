import { Outlet } from 'react-router-dom';
import { AppChrome } from './AppChrome';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { getDefaultRouteForUser } from '@/features/auth/utils/rbac';

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  return (
    <AppChrome logoTo={getDefaultRouteForUser(user)}>
      <Outlet />
    </AppChrome>
  );
}
