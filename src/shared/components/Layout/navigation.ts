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
    if (permissions.has('platform.labs.manage')) {
      items.push(
        { to: ROUTES.ADMIN_LABS, label: 'Labs', icon: 'lab', section: 'Administration' },
        { to: ROUTES.ADMIN_TRACKS, label: 'Tracks', icon: 'track', section: 'Administration' },
      );
    }
    if (permissions.has('platform.labs.admin')) {
      items.push({
        to: ROUTES.ADMIN_LAB_INSTANCES,
        label: 'Lab instances',
        icon: 'classes',
        section: 'Administration',
      });
    }
    if (permissions.has('platform.gamification.manage')) {
      items.push(
        {
          to: ROUTES.ADMIN_GAMIFICATION,
          label: 'Gamification',
          icon: 'award',
          section: 'Administration',
        },
        { to: ROUTES.ADMIN_BADGES, label: 'Badges', icon: 'award', section: 'Administration' },
        {
          to: ROUTES.ADMIN_ACHIEVEMENTS,
          label: 'Achievements',
          icon: 'leaderboard',
          section: 'Administration',
        },
        { to: ROUTES.ADMIN_SEASONS, label: 'Seasons', icon: 'track', section: 'Administration' },
      );
    }
    // ─── F8 analytics, notifications & platform operations (§04 surface
    //      control — every item below is permission-gated) ─────────────
    if (permissions.has('platform.content.moderate')) {
      items.push(
        {
          to: ROUTES.ADMIN_ANNOUNCEMENTS,
          label: 'Announcements',
          icon: 'megaphone',
          section: 'Administration',
        },
        {
          to: ROUTES.ADMIN_MODERATION,
          label: 'Moderation',
          icon: 'flag',
          section: 'Administration',
        },
        {
          to: ROUTES.ADMIN_REPORTS,
          label: 'Report queue',
          icon: 'reports',
          section: 'Administration',
        },
      );
    }
    if (permissions.has('platform.admin.access')) {
      items.push(
        { to: ROUTES.ADMIN_EVENTS, label: 'Events', icon: 'calendar', section: 'Administration' },
        {
          to: ROUTES.ADMIN_EMAIL_TEMPLATES,
          label: 'Email templates',
          icon: 'email',
          section: 'Administration',
        },
        { to: ROUTES.ADMIN_FILES, label: 'Files', icon: 'file', section: 'Administration' },
      );
    }
    if (permissions.has('platform.analytics.read')) {
      items.push({
        to: ROUTES.ADMIN_ANALYTICS,
        label: 'Analytics',
        icon: 'chart',
        section: 'Administration',
      });
    }
    if (permissions.has('platform.billing.manage')) {
      items.push({
        to: ROUTES.ADMIN_BILLING,
        label: 'Billing',
        icon: 'card',
        section: 'Administration',
      });
    }
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
  if (permissions.has('labs:instance:read')) {
    items.push(
      { to: ROUTES.LABS, label: 'Labs', icon: 'lab', section: 'Workspace' },
      { to: ROUTES.TRACKS, label: 'Tracks', icon: 'track', section: 'Workspace' },
    );
  }
  // ─── F7 achievements & leaderboards (§04 surface control) ──────────────
  if (permissions.has('gamification:profile:read')) {
    items.push({
      to: ROUTES.ACHIEVEMENTS,
      label: 'Achievements',
      icon: 'award',
      section: 'Workspace',
    });
  }
  items.push({
    to: ROUTES.LEADERBOARD,
    label: 'Leaderboard',
    icon: 'leaderboard',
    section: 'Workspace',
  });
  // ─── F8 events (public surface, no permission gate) ──────────────────
  items.push({
    to: ROUTES.EVENTS,
    label: 'Events',
    icon: 'calendar',
    section: 'Workspace',
  });
  // ─── F8 announcements (public surface, no permission gate) ────────────
  items.push({
    to: ROUTES.ANNOUNCEMENTS,
    label: 'Announcements',
    icon: 'megaphone',
    section: 'Workspace',
  });
  // ─── F8 notification preferences (§04 surface control) ────────────────
  if (permissions.has('notifications:preferences:write')) {
    items.push({
      to: ROUTES.NOTIFICATION_PREFERENCES,
      label: 'Notification settings',
      icon: 'settings',
      section: 'Workspace',
    });
  }
  // ─── F9 billing (§04 surface control) ─────────────────────────────────
  if (permissions.has('billing:subscription:read')) {
    items.push({
      to: ROUTES.BILLING,
      label: 'Billing',
      icon: 'card',
      section: 'Workspace',
    });
  }

  return items;
}
