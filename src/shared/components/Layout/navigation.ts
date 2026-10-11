import type { IconName } from '@/shared/components/Icon';
import { ROUTES } from '@/shared/constants';
import type { AuthUser } from '@/features/auth/types';

// Single source of truth for the authenticated sidebar.
// Items are strictly permission-gated (§04 RBAC surface control):
// unauthorized nav is completely unrendered.
//
// Role & Capability Design:
// - platform_admin: complete platform administration, system settings & account governance.
// - org_admin: organization governance, classes, professors & student progress.
//   Also includes curriculum and labs so an admin/lead who wants to learn or teach
//   can access learning resources directly without artificial restrictions.
// - professor: class rosters, student progression, curriculum and lab sessions.
// - org_student: cohort syllabus, class progress, curriculum and labs.
// - individual_learner: personal dashboard, tracks, labs, progress and personal billing.

export type NavSection = 'Workspace' | 'Administration';

export interface AppNavItem {
  to: string;
  label: string;
  icon: IconName;
  section: NavSection;
}

export function buildNavItems(user: AuthUser | null): AppNavItem[] {
  if (!user) return [];

  const permissions = new Set(user.permissions ?? []);
  const roles = new Set(user.roles ?? []);
  const isPlatformAdmin = roles.has('platform_admin');
  const items: AppNavItem[] = [];

  // ─── Platform Administration ──────────────────────────────────────────────
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
        label: 'Settings',
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
    // Platform admin account preferences and security
    items.push({
      to: ROUTES.SETTINGS,
      label: 'Account settings',
      icon: 'settings',
      section: 'Administration',
    });
    return items;
  }

  // ─── Organization Administration & Management ─────────────────────────────
  if (roles.has('org_admin')) {
    items.push({
      to: ROUTES.ORG_DASHBOARD,
      label: 'Overview',
      icon: 'organization',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.ORG_CLASSES,
      label: 'Cohorts',
      icon: 'classes',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.ORG_PROFESSORS,
      label: 'Professors',
      icon: 'professors',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.ORG_STUDENTS_PROGRESS,
      label: 'Student progress',
      icon: 'reports',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.ORG_SETTINGS,
      label: 'Settings',
      icon: 'settings',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.BILLING,
      label: 'Billing & seats',
      icon: 'card',
      section: 'Workspace',
    });

    // An Org Admin who also teaches or learns has full access to curriculum & labs
    items.push({
      to: ROUTES.LEARN,
      label: 'Curriculum',
      icon: 'roles',
      section: 'Workspace',
    });
    items.push(
      { to: ROUTES.LABS, label: 'Labs', icon: 'lab', section: 'Workspace' },
      { to: ROUTES.TRACKS, label: 'Tracks', icon: 'track', section: 'Workspace' },
    );
    items.push({
      to: ROUTES.ACHIEVEMENTS,
      label: 'Achievements',
      icon: 'award',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.LEADERBOARD,
      label: 'Leaderboard',
      icon: 'leaderboard',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.EVENTS,
      label: 'Events',
      icon: 'calendar',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.ANNOUNCEMENTS,
      label: 'Announcements',
      icon: 'megaphone',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.SETTINGS,
      label: 'Account settings',
      icon: 'settings',
      section: 'Workspace',
    });
    return items;
  }

  // ─── Professor / Faculty ──────────────────────────────────────────────────
  if (roles.has('professor')) {
    items.push({
      to: ROUTES.ORG_CLASSES,
      label: 'My cohorts',
      icon: 'classes',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.ORG_STUDENTS_PROGRESS,
      label: 'Student progress',
      icon: 'reports',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.LEARN,
      label: 'Curriculum',
      icon: 'roles',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.LABS,
      label: 'Labs',
      icon: 'lab',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.EVENTS,
      label: 'Events',
      icon: 'calendar',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.ANNOUNCEMENTS,
      label: 'Announcements',
      icon: 'megaphone',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.SETTINGS,
      label: 'Settings',
      icon: 'settings',
      section: 'Workspace',
    });
    return items;
  }

  // ─── Org Student ──────────────────────────────────────────────────────────
  if (roles.has('org_student')) {
    items.push({
      to: ROUTES.STUDENT_MY_CLASS,
      label: 'My class',
      icon: 'my-class',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.LEARN,
      label: 'Learn',
      icon: 'roles',
      section: 'Workspace',
    });
    items.push(
      { to: ROUTES.LABS, label: 'Labs', icon: 'lab', section: 'Workspace' },
      { to: ROUTES.TRACKS, label: 'Tracks', icon: 'track', section: 'Workspace' },
    );
    items.push({
      to: ROUTES.ACHIEVEMENTS,
      label: 'Achievements',
      icon: 'award',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.LEADERBOARD,
      label: 'Leaderboard',
      icon: 'leaderboard',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.EVENTS,
      label: 'Events',
      icon: 'calendar',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.ANNOUNCEMENTS,
      label: 'Announcements',
      icon: 'megaphone',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.SETTINGS,
      label: 'Settings',
      icon: 'settings',
      section: 'Workspace',
    });
    return items;
  }

  // ─── Individual Learner (Default Member Navigation) ───────────────────────
  if (permissions.has('dashboard:read') || roles.has('individual_learner')) {
    items.push({
      to: ROUTES.DASHBOARD,
      label: 'Dashboard',
      icon: 'dashboard',
      section: 'Workspace',
    });
  }
  items.push({
    to: ROUTES.LEARN,
    label: 'Learn',
    icon: 'roles',
    section: 'Workspace',
  });
  items.push(
    { to: ROUTES.LABS, label: 'Labs', icon: 'lab', section: 'Workspace' },
    { to: ROUTES.TRACKS, label: 'Tracks', icon: 'track', section: 'Workspace' },
  );
  items.push({
    to: ROUTES.ACHIEVEMENTS,
    label: 'Achievements',
    icon: 'award',
    section: 'Workspace',
  });
  items.push({
    to: ROUTES.LEADERBOARD,
    label: 'Leaderboard',
    icon: 'leaderboard',
    section: 'Workspace',
  });
  items.push({
    to: ROUTES.EVENTS,
    label: 'Events',
    icon: 'calendar',
    section: 'Workspace',
  });
  items.push({
    to: ROUTES.ANNOUNCEMENTS,
    label: 'Announcements',
    icon: 'megaphone',
    section: 'Workspace',
  });
  items.push({
    to: ROUTES.SETTINGS,
    label: 'Settings',
    icon: 'settings',
    section: 'Workspace',
  });
  if (permissions.has('billing:subscription:read') || roles.has('individual_learner')) {
    items.push({
      to: ROUTES.BILLING,
      label: 'Billing',
      icon: 'card',
      section: 'Workspace',
    });
  }

  return items;
}
