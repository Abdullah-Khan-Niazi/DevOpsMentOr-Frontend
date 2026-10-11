import { Outlet } from 'react-router-dom';
import { AppChrome } from './AppChrome';
import { ROUTES } from '@/shared/constants';

export function AppShell() {
  return (
    <AppChrome logoTo={ROUTES.DASHBOARD}>
      <Outlet />
    </AppChrome>
  );
}
