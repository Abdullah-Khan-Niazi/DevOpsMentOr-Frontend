import { Outlet } from 'react-router-dom';
import { AppChrome } from './AppChrome';

/**
 * Personal/class shell. The logo target is derived from the active URL
 * context by AppChrome, so it always points at the workspace being viewed.
 */
export function AppShell() {
  return (
    <AppChrome>
      <Outlet />
    </AppChrome>
  );
}
