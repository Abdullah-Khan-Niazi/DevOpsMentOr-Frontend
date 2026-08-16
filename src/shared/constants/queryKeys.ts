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
    organizations: (params: string) => ['admin', 'organizations', params] as const,
    organizationDetail: (orgId: string | number) =>
      ['admin', 'organizations', String(orgId)] as const,
  },
  org: {
    me: ['org', 'me'] as const,
    professors: ['org', 'professors'] as const,
    classes: ['org', 'classes'] as const,
    classDetail: (classId: string | number) => ['org', 'classes', String(classId)] as const,
    roster: (classId: string | number) => ['org', 'classes', String(classId), 'students'] as const,
    invitations: (classId: string | number) =>
      ['org', 'classes', String(classId), 'invitations'] as const,
  },
  enrollment: {
    validate: (token: string) => ['enroll', 'validate', token] as const,
    myClass: ['student', 'my-class'] as const,
  },
  curriculum: {
    adminCourse: ['admin', 'curriculum', 'course'] as const,
    adminModules: (params: string) => ['admin', 'curriculum', 'modules', params] as const,
    moduleEditor: (moduleId: string | number) =>
      ['admin', 'curriculum', 'modules', String(moduleId)] as const,
    lessonEditor: (lessonId: string | number) =>
      ['admin', 'curriculum', 'lessons', String(lessonId)] as const,
    quizEditor: (quizId: string | number) =>
      ['admin', 'curriculum', 'quizzes', String(quizId)] as const,
    tags: ['admin', 'curriculum', 'tags'] as const,
  },
  learn: {
    overview: ['learn', 'overview'] as const,
    module: (moduleId: string | number) => ['learn', 'modules', String(moduleId)] as const,
    moduleLessons: (moduleId: string | number) =>
      ['learn', 'modules', String(moduleId), 'lessons'] as const,
    lesson: (lessonId: string | number) => ['learn', 'lessons', String(lessonId)] as const,
    quizzes: (moduleId: string | number) =>
      ['learn', 'modules', String(moduleId), 'quizzes'] as const,
  },
  progress: {
    course: ['progress', 'course'] as const,
    modules: ['progress', 'modules'] as const,
    continue: ['progress', 'continue'] as const,
    activity: (limit: number) => ['progress', 'activity', String(limit)] as const,
    quizMeta: (quizId: string | number) => ['progress', 'quizzes', String(quizId)] as const,
    quizQuestions: (quizId: string | number) =>
      ['progress', 'quizzes', String(quizId), 'questions'] as const,
    quizAttempts: (quizId: string | number) =>
      ['progress', 'quizzes', String(quizId), 'attempts'] as const,
    classStudents: (classId: string | number) =>
      ['progress', 'classes', String(classId), 'students'] as const,
    studentDetail: (classId: string | number, userId: number | null) =>
      ['progress', 'classes', String(classId), 'students', String(userId)] as const,
    orgStudents: (orgId: number | null) => ['progress', 'orgs', String(orgId), 'students'] as const,
    adminUser: (userId: string | number) => ['progress', 'admin', 'users', String(userId)] as const,
  },
  labs: {
    all: ['labs'] as const,
    detail: (labId: string | number) => ['labs', String(labId)] as const,
    detailBySlug: (slug: string) => ['labs', 'slug', slug] as const,
    activeInstance: ['labs', 'instances', 'active'] as const,
    vpnConfig: ['labs', 'vpn', 'config'] as const,
    tracks: ['tracks'] as const,
    trackDetail: (trackId: string | number) => ['tracks', String(trackId)] as const,
    trackProgress: (trackId: string | number) => ['tracks', String(trackId), 'progress'] as const,
    aiMentorSession: (lessonId: number) =>
      ['labs', 'ai-mentor', 'session', String(lessonId)] as const,
  },
  adminLabs: {
    labs: (params: string) => ['admin', 'labs', params] as const,
    tracks: (params: string) => ['admin', 'tracks', params] as const,
    instances: (params: string) => ['admin', 'lab-instances', params] as const,
  },
} as const;
