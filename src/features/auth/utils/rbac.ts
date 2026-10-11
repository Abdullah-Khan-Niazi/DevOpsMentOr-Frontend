import { ROUTES } from '@/shared/constants';
import type { AuthUser } from '../types';

/**
 * Contract §04 / §09: Strict RBAC default landing route resolver.
 * Ensures each role lands on their dedicated dashboard instead of a generic view.
 */
export function getDefaultRouteForUser(user: AuthUser | null): string {
  if (!user) return ROUTES.LOGIN;

  const roles = new Set(user.roles ?? []);
  const permissions = new Set(user.permissions ?? []);

  // Platform admin -> Platform administration dashboard
  if (roles.has('platform_admin') || permissions.has('platform.admin.access')) {
    return ROUTES.ADMIN_DASHBOARD;
  }

  // Organization admin -> Organization dashboard
  if (roles.has('org_admin') || permissions.has('org:manage')) {
    return ROUTES.ORG_DASHBOARD;
  }

  // Professor / Instructor -> Organization workspace / cohort overview
  if (roles.has('professor') || permissions.has('progress.org.read')) {
    return ROUTES.ORG_DASHBOARD;
  }

  // Students & Individual learners -> Learner dashboard
  return ROUTES.DASHBOARD;
}
