export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  ROLES: '/roles',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
