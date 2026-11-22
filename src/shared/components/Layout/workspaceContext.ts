import { ROUTES } from '@/shared/constants';
import type { AuthUser } from '@/features/auth/types';

/**
 * Workspace context is derived from the URL, never from localStorage.
 *
 * The URL describes which surface the user is *viewing*. It grants nothing:
 * every org/class API independently verifies roles, org scope, roster
 * membership and class ownership. This keeps tabs, refreshes and the
 * back/forward buttons consistent without creating a second, stale source
 * of authorization.
 */
export type WorkspaceKind = 'personal' | 'org' | 'class' | 'platform';

export function isPlatformAdmin(user: AuthUser | null): boolean {
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];
  return roles.includes('platform_admin') || permissions.includes('platform.admin.access');
}

/** Per-organization role as returned by `GET /org/my-memberships`. */
export interface WorkspaceMembership {
  role: 'org_admin' | 'professor' | 'org_student';
}

/**
 * Org staff = an org_admin or professor membership in any organization. The
 * memberships list is authoritative (multi-org); the session roles cover the
 * window before the list has loaded.
 */
export function isOrgStaff(
  user: AuthUser | null,
  memberships: readonly WorkspaceMembership[] = [],
): boolean {
  if (memberships.some((membership) => membership.role !== 'org_student')) {
    return true;
  }
  const roles = user?.roles ?? [];
  return roles.includes('org_admin') || roles.includes('professor');
}

export function isOrgStudent(user: AuthUser | null): boolean {
  return (user?.roles ?? []).includes('org_student');
}

/** Derive the active workspace from the route the user is actually on. */
export function resolveWorkspaceKind(pathname: string, user: AuthUser | null): WorkspaceKind {
  // Platform administrators only have the platform surface.
  if (isPlatformAdmin(user)) {
    return 'platform';
  }

  if (
    isOrgStudent(user) &&
    (pathname === ROUTES.STUDENT_MY_CLASS || pathname.startsWith('/student/'))
  ) {
    return 'class';
  }

  if (pathname.startsWith('/org') || pathname.startsWith('/professor')) {
    return 'org';
  }

  if (pathname.startsWith('/admin')) {
    return 'platform';
  }

  return 'personal';
}

/** Canonical home route for a workspace. */
export function workspaceHome(kind: WorkspaceKind): string {
  switch (kind) {
    case 'org':
      return ROUTES.ORG_DASHBOARD;
    case 'class':
      return ROUTES.STUDENT_MY_CLASS;
    case 'platform':
      return ROUTES.ADMIN_DASHBOARD;
    case 'personal':
    default:
      return ROUTES.DASHBOARD;
  }
}

/** The workspace switcher is only useful when there is more than one place
 * to go, or when the user can still join/create one. */
export function hasMultipleWorkspaces(options: {
  isStaff: boolean;
  hasOrg: boolean;
  hasClass: boolean;
  canCreateOrg: boolean;
  canJoinClass: boolean;
}): boolean {
  const destinations = 1 + (options.isStaff && options.hasOrg ? 1 : 0) + (options.hasClass ? 1 : 0);
  return destinations > 1 || options.canCreateOrg || options.canJoinClass;
}
