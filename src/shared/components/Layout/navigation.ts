import type { IconName } from '@/shared/components/Icon';
import { ROUTES } from '@/shared/constants';
import type { AuthUser } from '@/features/auth/types';

// Single source of truth for authenticated navigation.
// Items are strictly permission-gated (§04 RBAC surface control):
// unauthorized nav is completely unrendered.
//
// Role & Capability Design:
// - platform_admin: platform administration only. No personal/org switcher.
// - org_admin: organization governance, cohorts, staff, progress, billing.
// - professor: assigned cohorts, rosters, class progress, curriculum.
// - org_student: personal dashboard, own class, curriculum, achievements.
// - individual_learner: personal dashboard, curriculum, achievements, billing.
//
// `context` is derived from the current URL (see workspaceContext.ts). It
// scopes the menu to the workspace being viewed; it never grants access.

export type NavSection = 'Workspace' | 'Administration';

export interface AppNavItem {
  to: string;
  label: string;
  icon: IconName;
  section: NavSection;
}

function hasAny(permissions: Set<string>, names: string[]): boolean {
  return names.some((name) => permissions.has(name));
}

export function buildNavItems(
  user: AuthUser | null,
  context: 'personal' | 'org' | 'class' | 'platform' = 'personal',
): AppNavItem[] {
  if (!user) return [];

  const permissions = new Set(user.permissions ?? []);
  const roles = new Set(user.roles ?? []);
  const items: AppNavItem[] = [];
  const isPlatformAdmin = roles.has('platform_admin') || permissions.has('platform.admin.access');
  const isOrgStudent = roles.has('org_student');

  // ─── Platform Administration ──────────────────────────────────────────────
  // Platform admins only ever see the platform surface. No personal or org
  // navigation leaks into their shell.
  if (context === 'platform' || isPlatformAdmin) {
    if (!isPlatformAdmin) return [];

    items.push(
      {
        to: ROUTES.ADMIN_DASHBOARD,
        label: 'Dashboard',
        icon: 'dashboard',
        section: 'Administration',
      },
      {
        to: ROUTES.ADMIN_ANALYTICS,
        label: 'Analytics',
        icon: 'chart',
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
    if (permissions.has('platform.billing.manage')) {
      items.push({
        to: ROUTES.ADMIN_BILLING,
        label: 'Billing',
        icon: 'card',
        section: 'Administration',
      });
    }
    items.push({
      to: ROUTES.SETTINGS,
      label: 'Account settings',
      icon: 'settings',
      section: 'Administration',
    });
    return items;
  }

  // ─── Organization Administration & Management ─────────────────────────────
  if (context === 'org' && roles.has('org_admin')) {
    if (hasAny(permissions, ['org:manage', 'org:read'])) {
      items.push({
        to: ROUTES.ORG_DASHBOARD,
        label: 'Overview',
        icon: 'organization',
        section: 'Workspace',
      });
    }
    if (permissions.has('org:classes:manage')) {
      items.push({
        to: ROUTES.ORG_CLASSES,
        label: 'Cohorts',
        icon: 'classes',
        section: 'Workspace',
      });
    }
    if (
      hasAny(permissions, [
        'org:professors:invite',
        'org:students:invite',
        'class:students:read',
      ])
    ) {
      items.push({
        to: ROUTES.ORG_PROFESSORS,
        label: 'Students & Professors',
        icon: 'professors',
        section: 'Workspace',
      });
    }
    if (permissions.has('progress.org.read')) {
      items.push({
        to: ROUTES.ORG_STUDENTS_PROGRESS,
        label: 'Student progress',
        icon: 'reports',
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
    if (permissions.has('billing:org:manage')) {
      items.push({
        to: ROUTES.BILLING,
        label: 'Billing & seats',
        icon: 'card',
        section: 'Workspace',
      });
    }
    if (permissions.has('curriculum:read') || permissions.has('curriculum.read')) {
      items.push({
        to: ROUTES.LEARN,
        label: 'Curriculum',
        icon: 'roles',
        section: 'Workspace',
      });
    }
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
    items.push({
      to: ROUTES.SETTINGS,
      label: 'Account settings',
      icon: 'settings',
      section: 'Workspace',
    });
    return items;
  }

  // ─── Professor / Faculty ──────────────────────────────────────────────────
  if (context === 'org' && roles.has('professor')) {
    items.push({
      to: ROUTES.ORG_DASHBOARD,
      label: 'Dashboard',
      icon: 'dashboard',
      section: 'Workspace',
    });
    items.push({
      to: ROUTES.ORG_CLASSES,
      label: 'My cohorts',
      icon: 'classes',
      section: 'Workspace',
    });
    if (permissions.has('curriculum:read') || permissions.has('curriculum.read')) {
      items.push({
        to: ROUTES.LEARN,
        label: 'Curriculum',
        icon: 'roles',
        section: 'Workspace',
      });
    }
    items.push({
      to: ROUTES.SETTINGS,
      label: 'Settings',
      icon: 'settings',
      section: 'Workspace',
    });
    return items;
  }

  // ─── Student workspace (personal or class context) ────────────────────────
  // Only student-applicable links. No hardcoded Events/Announcements and no
  // staff/personal billing links unless the account actually holds the
  // matching permission.
  if (isOrgStudent || context === 'class') {
    if (permissions.has('dashboard:read')) {
      items.push({
        to: ROUTES.DASHBOARD,
        label: 'Dashboard',
        icon: 'dashboard',
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
    if (permissions.has('curriculum:read') || permissions.has('curriculum.read')) {
      items.push({
        to: ROUTES.LEARN,
        label: 'Learn',
        icon: 'roles',
        section: 'Workspace',
      });
    }
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
    items.push({
      to: ROUTES.SETTINGS,
      label: 'Settings',
      icon: 'settings',
      section: 'Workspace',
    });
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

  // ─── Individual learner / staff personal space ────────────────────────────
  // Staff reach this branch only when they are in the personal context.
  if (permissions.has('dashboard:read')) {
    items.push({
      to: ROUTES.DASHBOARD,
      label: 'Dashboard',
      icon: 'dashboard',
      section: 'Workspace',
    });
  }
  if (permissions.has('curriculum:read') || permissions.has('curriculum.read')) {
    items.push({
      to: ROUTES.LEARN,
      label: 'Learn',
      icon: 'roles',
      section: 'Workspace',
    });
  }
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
  items.push({
    to: ROUTES.SETTINGS,
    label: 'Settings',
    icon: 'settings',
    section: 'Workspace',
  });
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
