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
  profile: {
    me: ['profile', 'me'] as const,
    public: (userId: string | number) => ['profile', String(userId)] as const,
    mySkills: ['profile', 'me', 'skills'] as const,
    skillsCatalog: ['profile', 'catalog', 'skills'] as const,
    countries: ['profile', 'catalog', 'countries'] as const,
  },
  preferences: {
    mySettings: ['preferences', 'my-settings'] as const,
  },
  admin: {
    users: (params: string) => ['admin', 'users', params] as const,
    userDetail: (userId: string | number) => ['admin', 'users', String(userId)] as const,
    dashboard: ['admin', 'dashboard'] as const,
    auditLogs: (params: string) => ['admin', 'audit-logs', params] as const,
    systemSettings: ['admin', 'system-settings'] as const,
  },
} as const;
