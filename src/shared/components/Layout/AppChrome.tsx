import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { SiteLogo } from '@/shared/components/Logo';
import { Icon } from '@/shared/components/Icon';
import { useLogout } from '@/features/auth/hooks';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useUiStore } from '@/shared/stores';
import { ROUTES } from '@/shared/constants';
import { cn } from '@/shared/utils';
import { AnnouncementBanner } from '@/features/notifications/components/AnnouncementBanner';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { usePublishedAnnouncements } from '@/features/notifications/hooks/useNotifications';
import { buildNavItems, type AppNavItem } from './navigation';
import './AppChrome.css';

// Unified authenticated chrome — responsive layout:
//   mobile (< 768px): top navigation header + slide-out drawer + 100% width content area
//   desktop & tablet (>= 768px): Gemini-style collapsible sidebar with clean dock grouping
// Zero intrusive banners, zero redundant switcher clutter.

interface AppChromeProps {
  navItems?: AppNavItem[];
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const { data: announcements } = usePublishedAnnouncements();
  const canSeeNotifications = (user?.permissions ?? []).includes('notifications:inbox:read');

  const profileName = user?.fullName ?? user?.username ?? 'Account';
  const profileTo = user?.userId
    ? ROUTES.PROFILE_VIEW.replace(':userId', String(user.userId))
    : ROUTES.PROFILE_EDIT;

  const currentNavItems = navItems ?? buildNavItems(user);

  const groups = currentNavItems.reduce<Array<{ section: string; items: AppNavItem[] }>>((acc, item) => {
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
      {/* ─── Mobile Top Header (Screens < 768px only) ────────────────────────── */}
      <header className="app-chrome__mobile-header">
        <Link to={logoTo} className="app-chrome__mobile-logo" aria-label="DevOpsMentor home">
          <SiteLogo />
        </Link>
        <div className="flex items-center gap-2">
          {canSeeNotifications && <NotificationBell />}
          <Link to={profileTo} className="app-chrome__mobile-avatar" title={profileName}>
            {userInitials(profileName)}
          </Link>
          <button
            type="button"
            className="app-chrome__mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileMenuOpen}
          >
            <Icon name={mobileMenuOpen ? 'x' : 'menu'} />
          </button>
        </div>
      </header>

      {/* ─── Mobile Drawer (Screens < 768px only) ───────────────────────────── */}
      {mobileMenuOpen && (
        <div className="app-chrome__mobile-drawer-root">
          <div
            className="app-chrome__mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="app-chrome__mobile-drawer">
            <div className="app-chrome__mobile-drawer-top">
              <Link
                to={logoTo}
                onClick={() => setMobileMenuOpen(false)}
                className="app-chrome__logo"
                aria-label="DevOpsMentor home"
              >
                <SiteLogo />
              </Link>
              <button
                type="button"
                className="app-chrome__collapse"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
              >
                <Icon name="x" />
              </button>
            </div>

            <nav className="app-chrome__mobile-nav" aria-label="Mobile Primary">
              {groups.map((group) => (
                <div key={group.section} className="app-chrome__nav-group">
                  {groups.length > 1 ? (
                    <p className="app-chrome__nav-section">{group.section}</p>
                  ) : null}
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
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

            <div className="app-chrome__mobile-drawer-footer">
              <Link
                to={profileTo}
                onClick={() => setMobileMenuOpen(false)}
                className="app-chrome__profile"
                title={profileName}
              >
                <span className="app-chrome__avatar" aria-hidden="true">
                  {userInitials(profileName)}
                </span>
                <span className="app-chrome__profile-name">{profileName}</span>
              </Link>
              <button
                type="button"
                className="app-chrome__logout"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout.mutate();
                }}
                disabled={logout.isPending}
                title={logout.isPending ? 'Logging out…' : 'Log out'}
                aria-label="Log out"
              >
                <Icon name="logout" className="app-chrome__logout-icon" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ─── Desktop & Tablet Sidebar (Screens >= 768px only) ───────────────── */}
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

          {isSidebarOpen && canSeeNotifications ? <NotificationBell /> : null}
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
          <Link to={profileTo} className="app-chrome__profile" title={profileName}>
            <span className="app-chrome__avatar" aria-hidden="true">
              {userInitials(profileName)}
            </span>
            {isSidebarOpen ? (
              <span className="app-chrome__profile-name">{profileName}</span>
            ) : null}
          </Link>

          {isSidebarOpen ? (
            <button
              type="button"
              className="app-chrome__logout"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              title={logout.isPending ? 'Logging out…' : 'Log out'}
              aria-label="Log out"
            >
              <Icon name="logout" className="app-chrome__logout-icon" />
            </button>
          ) : null}
        </div>
      </aside>

      {/* ─── Main Content Shell ────────────────────────────────────────────── */}
      <main className="app-chrome__main">
        {announcements && announcements.length > 0 ? (
          <AnnouncementBanner announcements={announcements} />
        ) : null}
        {children}
      </main>
    </div>
  );
}
