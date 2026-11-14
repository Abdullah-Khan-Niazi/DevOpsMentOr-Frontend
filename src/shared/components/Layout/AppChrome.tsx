import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { SiteLogo } from '@/shared/components/Logo';
import { Icon } from '@/shared/components/Icon';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useLogout } from '@/features/auth/hooks';
import { useMyClass } from '@/features/enrollment/hooks';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useUiStore } from '@/shared/stores';
import { ROUTES } from '@/shared/constants';
import { cn } from '@/shared/utils';
import { AnnouncementBanner } from '@/features/notifications/components/AnnouncementBanner';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { usePublishedAnnouncements } from '@/features/notifications/hooks/useNotifications';
import { buildNavItems, type AppNavItem } from './navigation';
import {
  isPlatformAdmin as isPlatformAdminUser,
  resolveWorkspaceKind,
  workspaceHome,
} from './workspaceContext';
import './AppChrome.css';

// Unified authenticated chrome — responsive layout:
//   mobile & tablet (< 1024px): top navigation header + dedicated slide-out drawer
//   desktop (>= 1024px): Gemini-style collapsible sidebar with instant dock tooltips

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

export function AppChrome({ navItems, logoTo, children }: AppChromeProps) {
  const { isSidebarOpen, toggleSidebar } = useUiStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<{ text: string; top: number } | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const location = useLocation();
  const { data: announcements } = usePublishedAnnouncements();
  const permissions = new Set(user?.permissions ?? []);
  const canSeeNotifications = permissions.has('notifications:inbox:read');

  const roles = new Set(user?.roles ?? []);
  const platformAdmin = isPlatformAdminUser(user);
  const myClassQuery = useMyClass(roles.has('org_student'));

  // ─── Active Context Resolution ─────────────────────────────────────────────
  // The route is the only source of truth. There is no persisted workspace
  // mode, so another tab/account can never move this user's context.
  const activeContext = resolveWorkspaceKind(location.pathname, user);
  const showTopbarNav = activeContext === 'personal' || activeContext === 'class';
  const showSidebarNav = !showTopbarNav;
  const resolvedLogoTo = logoTo ?? workspaceHome(activeContext);

  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  const profileName = user?.fullName ?? user?.username ?? 'Account';
  const profileTo = user?.userId
    ? ROUTES.PROFILE_VIEW.replace(':userId', String(user.userId))
    : ROUTES.PROFILE_EDIT;

  // Scope nav items to active context
  const currentNavItems = navItems ?? buildNavItems(user, activeContext);

  // Topbar is a compact subset of the learner nav. "My class" appears only
  // when an enrollment actually exists, so no link can dead-end.
  const topbarRoutes = new Set<string>([
    ROUTES.DASHBOARD,
    ROUTES.STUDENT_MY_CLASS,
    ROUTES.LEARN,
    ROUTES.ACHIEVEMENTS,
    ROUTES.LEADERBOARD,
  ]);
  const hasEnrolledClass = Boolean(myClassQuery.data);
  const visibleNavItems = currentNavItems.filter(
    (item) => item.to !== ROUTES.STUDENT_MY_CLASS || hasEnrolledClass,
  );
  const topbarItems = visibleNavItems.filter((item) => topbarRoutes.has(item.to));

  const groups = visibleNavItems.reduce<Array<{ section: string; items: AppNavItem[] }>>(
    (acc, item) => {
      const last = acc[acc.length - 1];
      if (last && last.section === item.section) {
        last.items.push(item);
      } else {
        acc.push({ section: item.section, items: [item] });
      }
      return acc;
    },
    [],
  );

  return (
    <div className={cn('app-chrome', showTopbarNav && 'app-chrome--topbar')}>
      {/* ─── Learner Top Navigation Bar (d.webp layout) ────────────────────────── */}
      {showTopbarNav && (
        <header className="app-chrome__topbar">
          <div className="app-chrome__topbar-inner">
            {/* Left: Site Logo & Workspace Context Switcher */}
            <div className="flex items-center gap-4">
              <Link
                to={resolvedLogoTo}
                className="flex items-center hover:opacity-85 transition-opacity"
                aria-label="DevOpsMentor home"
              >
                <SiteLogo />
              </Link>
              {!platformAdmin && <WorkspaceSwitcher variant="topbar" />}
            </div>

            {/* Center: Role-aware navigation (CSS-migration tab switcher) */}
            <nav className="tab-switcher" aria-label="Learner Primary">
              {topbarItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn('tab-switcher__tab', isActive && 'tab-switcher__tab--active')
                  }
                >
                  <Icon name={item.icon} size={14} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right: Notifications & User Profile Chip */}
            <div className="flex items-center gap-3">
              {canSeeNotifications && <NotificationBell />}

              {/* Profile Chip with Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-border hover:bg-pearl-200 transition-colors cursor-pointer text-left"
                  aria-expanded={profileDropdownOpen}
                  aria-label="User menu"
                >
                  <span className="w-8 h-8 rounded-full bg-ink text-pearl-100 flex items-center justify-center font-bold text-xs shrink-0">
                    {userInitials(profileName)}
                  </span>
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-semibold text-ink leading-tight truncate max-w-[7.5rem]">
                      Hi, {user?.fullName?.split(' ')[0] || user?.username || 'Learner'}!
                    </span>
                    <span className="text-[0.625rem] text-muted truncate max-w-[7.5rem] font-mono">
                      {user?.email ?? ''}
                    </span>
                  </div>
                  <Icon
                    name={profileDropdownOpen ? 'chevrons-right' : 'chevrons-left'}
                    size={12}
                    className="text-muted -rotate-90"
                  />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg py-1.5 z-50 text-card-foreground">
                    <div className="px-3.5 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-card-foreground truncate">
                        {profileName}
                      </p>
                      <p className="text-[0.6875rem] text-muted truncate font-mono">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        to={profileTo}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-surface-hover transition-colors"
                      >
                        <Icon name="users" size={14} className="text-muted" />
                        <span>View Profile</span>
                      </Link>

                      <Link
                        to={ROUTES.SETTINGS}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-surface-hover transition-colors"
                      >
                        <Icon name="settings" size={14} className="text-muted" />
                        <span>Account Settings</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-border">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout.mutate();
                        }}
                        disabled={logout.isPending}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-error hover:bg-surface-hover transition-colors cursor-pointer text-left"
                      >
                        <Icon name="logout" size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}
      {/* ─── Mobile Top Header (Screens < 1024px) ────────────────────────────── */}
      <header className="app-chrome__mobile-header">
        <Link
          to={resolvedLogoTo}
          className="app-chrome__mobile-logo"
          aria-label="DevOpsMentor home"
        >
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
            <span
              className={cn(
                'app-chrome__hamburger-bar',
                mobileMenuOpen && 'app-chrome__hamburger-bar--open-1',
              )}
            />
            <span
              className={cn(
                'app-chrome__hamburger-bar',
                mobileMenuOpen && 'app-chrome__hamburger-bar--open-2',
              )}
            />
            <span
              className={cn(
                'app-chrome__hamburger-bar',
                mobileMenuOpen && 'app-chrome__hamburger-bar--open-3',
              )}
            />
          </button>
        </div>
      </header>

      {/* ─── Mobile Drawer (Screens < 1024px) ─────────────────────────────────── */}
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
                to={resolvedLogoTo}
                onClick={() => setMobileMenuOpen(false)}
                className="app-chrome__logo"
                aria-label="DevOpsMentor home"
              >
                <SiteLogo />
              </Link>
              <button
                type="button"
                className="app-chrome__mobile-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
              >
                <Icon name="x" />
              </button>
            </div>

            {!platformAdmin && (
              <div className="px-4 py-3 border-b border-border">
                <WorkspaceSwitcher
                  variant="mobile"
                  onAfterSwitch={() => setMobileMenuOpen(false)}
                />
              </div>
            )}

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
                aria-label="Log out"
              >
                <Icon name="logout" className="app-chrome__logout-icon" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ─── Desktop Sidebar (Staff only: Platform Admin, Org Admin, Professor) ── */}
      {showSidebarNav && (
        <aside className={cn('app-chrome__sidebar', isSidebarOpen && 'app-chrome__sidebar--open')}>
          <div className="app-chrome__top">
            <Link to={resolvedLogoTo} className="app-chrome__logo" aria-label="DevOpsMentor home">
              <SiteLogo />
            </Link>

            <button
              type="button"
              className="app-chrome__collapse"
              onClick={() => {
                setHoveredTooltip(null);
                toggleSidebar();
              }}
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

          {!platformAdmin && (
            <div className="px-3 py-2 border-b border-border">
              <WorkspaceSwitcher variant="sidebar" isCollapsed={!isSidebarOpen} />
            </div>
          )}

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
                    className={({ isActive }) =>
                      cn('app-chrome__nav-item', isActive && 'app-chrome__nav-item--active')
                    }
                    onMouseEnter={(e) => {
                      if (!isSidebarOpen) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredTooltip({ text: item.label, top: rect.top + rect.height / 2 });
                      }
                    }}
                    onMouseLeave={() => setHoveredTooltip(null)}
                    onClick={() => setHoveredTooltip(null)}
                  >
                    <Icon name={item.icon} className="app-chrome__nav-icon" />
                    <span className="app-chrome__nav-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="app-chrome__footer">
            <Link
              to={profileTo}
              className="app-chrome__profile"
              onMouseEnter={(e) => {
                if (!isSidebarOpen) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredTooltip({ text: profileName, top: rect.top + rect.height / 2 });
                }
              }}
              onMouseLeave={() => setHoveredTooltip(null)}
              onClick={() => setHoveredTooltip(null)}
            >
              <span className="app-chrome__avatar" aria-hidden="true">
                {userInitials(profileName)}
              </span>
              {isSidebarOpen ? (
                <span className="app-chrome__profile-name">{profileName}</span>
              ) : null}
            </Link>

            {isSidebarOpen && (
              <button
                type="button"
                className="app-chrome__logout"
                onClick={() => {
                  setHoveredTooltip(null);
                  logout.mutate();
                }}
                disabled={logout.isPending}
                aria-label="Log out"
              >
                <Icon name="logout" className="app-chrome__logout-icon" />
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Floating portal-level tooltip for collapsed sidebar dock */}
      {showSidebarNav && !isSidebarOpen && hoveredTooltip && (
        <div
          className="app-chrome__floating-portal-tooltip"
          style={{ top: `${hoveredTooltip.top}px` }}
          role="tooltip"
        >
          {hoveredTooltip.text}
        </div>
      )}

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
