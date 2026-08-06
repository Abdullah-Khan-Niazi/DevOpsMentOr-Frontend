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
  CURRICULUM: '/curriculum',
  PRICING: '/pricing',
  ABOUT: '/about',
  SECURITY_TRUST: '/security',
  CONTACT: '/contact',
  FOR_INSTITUTIONS: '/for-institutions',
  FAQ: '/faq',
  // ─── Secondary site pages (footer destinations, no orphans) ───────────────
  CAREERS: '/careers',
  DOCUMENTATION: '/docs',
  MODULE_CATALOG: '/catalog',
  LEARNING_PATH: '/learning-path',
  INSTRUCTOR_TOOLS: '/instructor-tools',
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
