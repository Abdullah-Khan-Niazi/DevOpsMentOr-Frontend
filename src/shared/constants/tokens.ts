/**
 * Universal telemetry & observability design tokens.
 * Paper & Ink Contract v8 palette with distinct metric channels.
 */
export const TELEMETRY_TOKENS = {
  hostCpu: '#D71921',
  cpuMaxSpike: '#FB7185',
  hostRam: '#2563EB',
  usedRam: '#8B5CF6',
  processHeap: '#06B6D4',
  activePods: '#0D9488',
  queuedPods: '#D97706',
  allocatedCores: '#38BDF8',
  redisMemory: '#E11D48',
  cacheHitRatio: '#0D9488',
  mysqlQueries: '#2563EB',
  aiTokens: '#A855F7',
  webRequests: '#EC4899',
  activeLearners: '#0D9488',
  activeSessions: '#A855F7',
  newSignups: '#2563EB',
  completions: '#D97706',
} as const;

export type TelemetryTokenKey = keyof typeof TELEMETRY_TOKENS;

/**
 * JS mirror of the Paper & Ink surface tokens (globals.css).
 * Needed ONLY where CSS var() cannot resolve: SVG/Recharts attributes.
 * Keep values in sync with globals.css.
 */
export const SURFACE_TOKENS = {
  paper: '#FAF9F6',
  paperDim: '#F1EFE9',
  paperLine: '#E2DFD5',
  pearl100: '#FDFCFA',
  pearl200: '#F3F1EC',
  pearl300: '#E7E4DC',
  ink: '#14140F',
  inkSoft: '#232320',
  inkFaint: '#3A3A35',
} as const;

export type SurfaceTokenKey = keyof typeof SURFACE_TOKENS;
