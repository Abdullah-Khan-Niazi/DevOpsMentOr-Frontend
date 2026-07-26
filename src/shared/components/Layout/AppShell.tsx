import { NavLink, Outlet } from 'react-router-dom';
import { ENV, ROUTES } from '@/shared/constants';
import { useUiStore } from '@/shared/stores/uiStore';
import { cn } from '@/shared/utils';
import { Button } from '@/shared/components/Button';

const navItems = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.USERS, label: 'Users' },
  { to: ROUTES.ROLES, label: 'Roles' },
  { to: ROUTES.REPORTS, label: 'Reports' },
  { to: ROUTES.SETTINGS, label: 'Settings' },
] as const;

export function AppShell() {
  const { isSidebarOpen, toggleSidebar } = useUiStore();

  return (
    <div className="flex min-h-screen bg-surface">
      <aside
        className={cn(
          'border-r border-border bg-white transition-all duration-200',
          isSidebarOpen ? 'w-60' : 'w-16',
        )}
      >
        <div className="flex h-14 items-center border-b border-border px-4">
          <span
            className={cn('truncate font-semibold text-brand-700', !isSidebarOpen && 'sr-only')}
          >
            {ENV.APP_NAME}
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100',
                  isActive && 'bg-brand-50 text-brand-700',
                  !isSidebarOpen && 'text-center',
                )
              }
            >
              {isSidebarOpen ? item.label : item.label.charAt(0)}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4">
          <Button variant="ghost" size="sm" onClick={toggleSidebar} aria-label="Toggle sidebar">
            Menu
          </Button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
