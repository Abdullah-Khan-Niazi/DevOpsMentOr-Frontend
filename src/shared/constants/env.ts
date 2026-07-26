export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'DevOps Mentor',
} as const;
