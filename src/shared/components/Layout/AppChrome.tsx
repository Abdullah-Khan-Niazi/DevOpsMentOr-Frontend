import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { SiteLogo } from '@/shared/components/Logo';
import { Icon } from '@/shared/components/Icon';
import { useLogout } from '@/features/auth/hooks';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useUiStore } from '@/shared/stores/uiStore';
import { ROUTES } from '@/shared/constants';
import { cn } from '@/shared/utils';
import { AnnouncementBanner } from '@/features/notifications/components/AnnouncementBanner';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { usePublishedAnnouncements } from '@/features/notifications/hooks/useNotifications';
import type { AppNavItem } from './navigation';
import './AppChrome.css';

// Unified authenticated chrome — everything lives inside the sidebar:
//   top: brand logo + collapse control (logo is mark-only when collapsed,
//        full lockup when expanded)
//   middle: navigation (icon + label when open, icon only when collapsed,
//           grouped by section — labels only when multiple sections exist)
//   bottom: profile + logout — the only home for both
// There is no top header and nothing is duplicated anywhere else.

interface AppChromeProps {
  navItems: AppNavItem[];
  logoTo?: string;
  children: ReactNode;
}

function userInitials(fullName?: string | null): string {
  if (!fullName) return 'A';
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function AppChrome({ navItems, logoTo = ROUTES.DASHBOARD, children }: AppChromeProps) {
  const { isSidebarOpen, toggleSidebar } = useUiStore();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const { data: announcements } = usePublishedAnnouncements();
  const canSeeNotifications = (user?.permissions ?? []).includes('notifications:inbox:read');

  const profileName = user?.fullName ?? user?.username ?? 'Account';
  const profileTo = user?.userId
    ? ROUTES.PROFILE_VIEW.replace(':userId', String(user.userId))
    : ROUTES.PROFILE_EDIT;

  const groups = navItems.reduce<Array<{ section: string; items: AppNavItem[] }>>((acc, item) => {
    const last = acc[acc.length - 1];
    if (last && last.section === item.section) {
      last.items.push(item);
    } else {
      acc.push({ section: item.section, items: [item] });
    }
    return acc;
  }, []);

  return (
    <div className="app-chrome">
      <aside className={cn('app-chrome__sidebar', isSidebarOpen && 'app-chrome__sidebar--open')}>
        <div className="app-chrome__top">
          <Link to={logoTo} className="app-chrome__logo" aria-label="DevOpsMentor home">
            <SiteLogo />
          </Link>

          <button
            type="button"
            className="app-chrome__collapse"
            onClick={toggleSidebar}
            aria-expanded={isSidebarOpen}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Icon
              name={isSidebarOpen ? 'chevrons-left' : 'chevrons-right'}
              className="app-chrome__collapse-icon"
            />
          </button>

          {canSeeNotifications ? <NotificationBell /> : null}
        </div>

        <nav className="app-chrome__nav" aria-label="Primary">
          {groups.map((group) => (
            <div key={group.section} className="app-chrome__nav-group">
              {groups.length > 1 ? (
                <p className="app-chrome__nav-section">{group.section}</p>
              ) : null}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={isSidebarOpen ? undefined : item.label}
                  className={({ isActive }) =>
                    cn('app-chrome__nav-item', isActive && 'app-chrome__nav-item--active')
                  }
                >
                  <Icon name={item.icon} className="app-chrome__nav-icon" />
                  <span className="app-chrome__nav-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="app-chrome__footer">
          <Link to={profileTo} className="app-chrome__profile">
            <span className="app-chrome__avatar" aria-hidden="true">
              {userInitials(profileName)}
            </span>
            <span className="app-chrome__profile-name">{profileName}</span>
          </Link>

          <button
            type="button"
            className="app-chrome__logout"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <Icon name="logout" className="app-chrome__logout-icon" />
            <span className="app-chrome__logout-label">
              {logout.isPending ? 'Logging out…' : 'Log out'}
            </span>
          </button>
        </div>
      </aside>

      <main className="app-chrome__main">
        {announcements && announcements.length > 0 ? (
          <AnnouncementBanner announcements={announcements} />
        ) : null}
        {children}
      </main>
    </div>
  );
}
