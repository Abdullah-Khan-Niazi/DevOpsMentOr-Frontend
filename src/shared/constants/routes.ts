export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  OAUTH_CALLBACK: '/api/auth/callback/:provider',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  ROLES: '/roles',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  // ─── Public site routes (public, no auth) ───────────────────────────────────
  HOW_IT_WORKS: '/how-it-works',
  // NOTE: Routes below are Dev C scope but not yet added to routes.tsx — added per session.
  SECURITY_TRUST: '/security',
  CONTACT: '/contact',
  FOR_INSTITUTIONS: '/for-institutions',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
