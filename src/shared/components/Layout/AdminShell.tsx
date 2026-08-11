import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { LogoutButton } from '@/features/auth/components';
import { ROUTES } from '@/shared/constants';
import { cn } from '@/shared/utils';

const adminNavItems = [
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.ADMIN_USERS, label: 'Users' },
  { to: ROUTES.ADMIN_ORGANIZATIONS, label: 'Organizations' },
  { to: ROUTES.ADMIN_SETTINGS, label: 'System settings' },
  { to: ROUTES.ADMIN_AUDIT_LOGS, label: 'Audit logs' },
  { to: ROUTES.ADMIN_PLATFORM_ADMINS, label: 'Platform admins' },
] as const;

/** Contract §09: AdminShell layout for all F2 platform-admin screens. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="w-60 border-r border-border bg-white">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="truncate font-semibold text-brand-700">Admin console</span>
        </div>
        <nav className="flex flex-col gap-1 p-2">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100',
                  isActive && 'bg-brand-50 text-brand-700',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4">
          <span className="text-sm font-medium text-slate-700">Platform administration</span>
          <LogoutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default AdminShell;
