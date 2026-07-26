export const QUERY_KEYS = {
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
  },
  roles: {
    all: ['roles'] as const,
    detail: (id: string) => ['roles', id] as const,
  },
  reports: {
    all: ['reports'] as const,
    detail: (id: string) => ['reports', id] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
} as const;
