export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'DevOps Mentor',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  GITHUB_CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID ?? '',
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '',
  /** Labs engine static assets base URL (no trailing slash). */
  LABS_ASSETS_URL: (import.meta.env.VITE_LABS_ASSETS_URL || 'http://localhost:5050/assets').replace(
    /\/+$/,
    '',
  ),
} as const;
