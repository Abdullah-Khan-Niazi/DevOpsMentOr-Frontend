import type { ReactNode } from 'react';

// App icon set — inline stroke SVGs only (no icon library dependency).
// Icons inherit `currentColor` and are sized via `size` on the Icon component.
// Draw in a 24×24 grid, stroke 1.75, round caps/joins, matching the brand's
// minimal line language.

export const iconNames = [
  'dashboard',
  'users',
  'roles',
  'reports',
  'settings',
  'organization',
  'my-class',
  'classes',
  'professors',
  'audit-logs',
  'platform-admins',
  'lab',
  'track',
  'award',
  'leaderboard',
  'x-circle',
  'logout',
  'chevrons-left',
  'chevrons-right',
  'bell',
  'megaphone',
  'calendar',
  'chart',
  'email',
  'file',
  'flag',
  'pin',
  'card',
] as const;

export type IconName = (typeof iconNames)[number];

export const ICONS: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 4.7a3.5 3.5 0 0 1 0 6.6" />
      <path d="M17.5 15.3c1.9.8 3 2.2 3 4.7" />
    </>
  ),
  roles: (
    <>
      <path d="M12 3l7 2.6v5.4c0 4.4-2.9 7.6-7 9.5-4.1-1.9-7-5.1-7-9.5V5.6z" />
      <path d="M9 11.5l2 2 4-4" />
    </>
  ),
  reports: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-6" />
      <path d="M12 20V9" />
      <path d="M17 20V5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
    </>
  ),
  organization: (
    <>
      <path d="M4 21V5.5L11 3.5V21M11 21V8h9v13M4 21h16" />
      <path d="M7 8h.5M7 11h.5M7 14h.5" />
      <path d="M15 11h.5M15 14h.5M15 17h.5" />
    </>
  ),
  'my-class': (
    <>
      <path d="M12 4L2.5 9 12 14l9.5-5z" />
      <path d="M6.5 11.5V16c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.5" />
      <path d="M21.5 9v5" />
    </>
  ),
  classes: (
    <>
      <path d="M12 6.5C10.5 5.1 8 4.6 4 4.6v13.6c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2V4.6c-4 0-6.5.5-8 1.9z" />
      <path d="M12 6.5v13.7" />
    </>
  ),
  professors: (
    <>
      <circle cx="9.5" cy="7.5" r="3" />
      <path d="M4.5 19.5c0-2.8 2.2-4.5 5-4.5 1 0 1.9.2 2.6.7" />
      <path d="M16.5 14.5l3.5 2.2-3.5 2.2v-3z" />
    </>
  ),
  'audit-logs': (
    <>
      <path d="M8.5 6H20M8.5 12H20M8.5 18H20" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth="2.4" />
    </>
  ),
  'platform-admins': (
    <>
      <path d="M12 3l7 2.6v5.4c0 4.4-2.9 7.6-7 9.5-4.1-1.9-7-5.1-7-9.5V5.6z" />
      <circle cx="9.5" cy="9.5" r="2.3" />
      <path d="M6.5 15.5c.5-1.7 1.6-2.6 3-2.6s2.5.9 3 2.6" />
    </>
  ),
  lab: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M8 9h8M8 13h5" />
      <path d="M9.5 16.5h.01M12.5 16.5h.01" strokeWidth="2.4" />
    </>
  ),
  track: (
    <>
      <path d="M12 3.5v17" />
      <path d="M12 6.5c-2.8 0-5-1.5-5-3s2.2-3 5-3 5 1.5 5 3-2.2 3-5 3z" />
      <path d="M12 12.5c-2.8 0-5-1.5-5-3s2.2-3 5-3 5 1.5 5 3-2.2 3-5 3z" />
      <path d="M12 18.5c-2.8 0-5-1.5-5-3s2.2-3 5-3 5 1.5 5 3-2.2 3-5 3z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  'chevrons-left': (
    <>
      <path d="M11 6l-6 6 6 6" />
      <path d="M18 6l-6 6 6 6" />
    </>
  ),
  'chevrons-right': (
    <>
      <path d="M13 6l6 6-6 6" />
      <path d="M6 6l6 6-6 6" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.2L7.5 21l4.5-2.4L16.5 21 15 13.2" />
      <path d="M8.8 8.5L6 5.5M15.2 8.5L18 5.5" />
    </>
  ),
  leaderboard: (
    <>
      <path d="M4 20h16" />
      <path d="M7.5 20v-6" />
      <path d="M12 20V9" />
      <path d="M16.5 20V4.5" />
    </>
  ),
  'x-circle': (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 11v2a1 1 0 0 0 1 1h2l8 4.5V5.5L7 10H5a1 1 0 0 0-1 1z" />
      <path d="M18 8.5a4.5 4.5 0 0 1 0 7" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 2.5V6M16 2.5V6" />
      <path d="M7.5 14h.01M12 14h.01M16.5 14h.01M7.5 17.5h.01M12 17.5h.01" strokeWidth="2.4" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M6.5 16.5v-5M11 16.5V6.5M15.5 16.5v-8M20 16.5V9.5" />
    </>
  ),
  email: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4.5 7l7.5 6 7.5-6" />
    </>
  ),
  card: (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M7.5 15h4" />
    </>
  ),
  file: (
    <>
      <path d="M6 3.5h8l4 4V20.5H6z" />
      <path d="M14 3.5v4h4M9 12h6M9 15.5h6" />
    </>
  ),
  flag: (
    <>
      <path d="M5.5 21V4" />
      <path d="M5.5 5c0-1.5 2.5-2 5-2s5 .5 5 2-2.5 2-5 2-5-.5-5-2z" />
      <path d="M5.5 9.5c0-1.5 2.5-2 5-2s5 .5 5 2-2.5 2-5 2-5-.5-5-2z" />
    </>
  ),
  pin: (
    <>
      <path d="M9 4h6l-1 5 3 3v2H7v-2l3-3z" />
      <path d="M12 14v6.5" />
    </>
  ),
};
