import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { LogoutButton } from '@/features/auth/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { cn } from '@/shared/utils';

/**
 * F3 contract §09: OrgAdminShell used by all org workspace screens. Nav items
 * are gated by the org role's resolved permissions (§04 RBAC surface control).
 */
export function OrgAdminShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];

  const canRead = permissions.includes('org:read');
  const canManage = permissions.includes('org:manage');
  const canSeeProfessors = permissions.includes('org:professors:invite');

  const items = [
    { to: ROUTES.ORG_DASHBOARD, label: 'Dashboard', show: canRead },
    { to: ROUTES.ORG_CLASSES, label: 'Classes', show: canRead },
    { to: ROUTES.ORG_PROFESSORS, label: 'Professors', show: canSeeProfessors },
    { to: ROUTES.ORG_SETTINGS, label: 'Settings', show: canManage },
  ].filter((item) => item.show);

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="w-60 border-r border-border bg-white">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="truncate font-semibold text-brand-700">Organization</span>
        </div>
        <nav className="flex flex-col gap-1 p-2">
          {items.map((item) => (
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
          <span className="text-sm font-medium text-slate-700">Organization workspace</span>
          <LogoutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default OrgAdminShell;
