import type { IconName } from '@/shared/components/Icon';
import { ROUTES } from '@/shared/constants';
import type { AuthUser } from '@/features/auth/types';

// Single source of truth for the authenticated sidebar. Every shell renders
// this same list, so the navigation NEVER morphs when switching areas.
// Items are strictly permission-gated (§04 RBAC surface control: unauthorized
// nav is completely unrendered) AND endpoint-gated — only pages the backend
// actually serves are listed. Member Reports/Settings endpoints do not exist
// server-side yet, so those items are intentionally omitted until they do.
//
// Platform admins get ONLY the Administration console: their member-side
// items (Dashboard/Users/Organization/…) duplicate the admin surfaces and
// their org/enrollment endpoints 403/404 anyway since they hold no
// organization membership. Keeping the two worlds separate also removes
// duplicate nav labels.

export type NavSection = 'Workspace' | 'Administration';

export interface AppNavItem {
  to: string;
  label: string;
  icon: IconName;
  section: NavSection;
}

export function buildNavItems(user: AuthUser | null): AppNavItem[] {
  const permissions = new Set(user?.permissions ?? []);
  const isPlatformAdmin = user?.roles.includes('platform_admin');
  const items: AppNavItem[] = [];

  if (isPlatformAdmin) {
    items.push(
      {
        to: ROUTES.ADMIN_DASHBOARD,
        label: 'Dashboard',
        icon: 'dashboard',
        section: 'Administration',
      },
      { to: ROUTES.ADMIN_USERS, label: 'Users', icon: 'users', section: 'Administration' },
      {
        to: ROUTES.ADMIN_ORGANIZATIONS,
        label: 'Organizations',
        icon: 'organization',
        section: 'Administration',
      },
      {
        to: ROUTES.ADMIN_SETTINGS,
        label: 'System settings',
        icon: 'settings',
        section: 'Administration',
      },
      {
        to: ROUTES.ADMIN_AUDIT_LOGS,
        label: 'Audit logs',
        icon: 'audit-logs',
        section: 'Administration',
      },
      {
        to: ROUTES.ADMIN_PLATFORM_ADMINS,
        label: 'Platform admins',
        icon: 'platform-admins',
        section: 'Administration',
      },
      {
        to: ROUTES.ADMIN_CURRICULUM,
        label: 'Curriculum',
        icon: 'roles',
        section: 'Administration',
      },
    );
    return items;
  }

  if (permissions.has('dashboard:read')) {
    items.push({
      to: ROUTES.DASHBOARD,
      label: 'Dashboard',
      icon: 'dashboard',
      section: 'Workspace',
    });
  }
  if (permissions.has('users:read')) {
    items.push({ to: ROUTES.USERS, label: 'Users', icon: 'users', section: 'Workspace' });
  }
  if (permissions.has('roles:read')) {
    items.push({ to: ROUTES.ROLES, label: 'Roles', icon: 'roles', section: 'Workspace' });
  }
  if (permissions.has('org:read')) {
    items.push({
      to: ROUTES.ORG_DASHBOARD,
      label: 'Organization',
      icon: 'organization',
      section: 'Workspace',
    });
    items.push({ to: ROUTES.ORG_CLASSES, label: 'Classes', icon: 'classes', section: 'Workspace' });
  }
  if (permissions.has('org:professors:invite')) {
    items.push({
      to: ROUTES.ORG_PROFESSORS,
      label: 'Professors',
      icon: 'professors',
      section: 'Workspace',
    });
  }
  if (permissions.has('org:manage')) {
    items.push({
      to: ROUTES.ORG_SETTINGS,
      label: 'Settings',
      icon: 'settings',
      section: 'Workspace',
    });
  }
  if (permissions.has('enrollment:read')) {
    items.push({
      to: ROUTES.STUDENT_MY_CLASS,
      label: 'My class',
      icon: 'my-class',
      section: 'Workspace',
    });
  }
  if (permissions.has('curriculum:read')) {
    items.push({
      to: ROUTES.LEARN,
      label: 'Learn',
      icon: 'roles',
      section: 'Workspace',
    });
  }
  if (permissions.has('progress.org.read')) {
    items.push({
      to: ROUTES.ORG_STUDENTS_PROGRESS,
      label: 'Student progress',
      icon: 'professors',
      section: 'Workspace',
    });
  }

  return items;
}
