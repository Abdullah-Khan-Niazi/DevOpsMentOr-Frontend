import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { SiteLogo } from '@/shared/components/Logo';
import { Icon } from '@/shared/components/Icon';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
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

export function AppChrome({ navItems, logoTo = ROUTES.DASHBOARD, children }: AppChromeProps) {
  const { isSidebarOpen, toggleSidebar } = useUiStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<{ text: string; top: number } | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const location = useLocation();
  const { data: announcements } = usePublishedAnnouncements();
  const canSeeNotifications = (user?.permissions ?? []).includes('notifications:inbox:read');

  const roles = new Set(user?.roles ?? []);

  // ─── Active Context Resolution ─────────────────────────────────────────────
  // Priority: URL path > localStorage workspace selection > role inference
  const isAdminPath = location.pathname.startsWith('/admin');
  const isOrgPath = location.pathname.startsWith('/org');

  let activeWorkspace = 'default';
  try {
    activeWorkspace = localStorage.getItem('stardust_active_workspace') || 'default';
  } catch {
    // ignore
  }

  // Determine the active context for nav scoping
  let activeContext: 'personal' | 'org' | 'platform' = 'personal';
  if (isAdminPath || (roles.has('platform_admin') && activeWorkspace === 'platform')) {
    activeContext = 'platform';
  } else if (isOrgPath || ((roles.has('org_admin') || roles.has('professor')) && activeWorkspace === 'org')) {
    activeContext = 'org';
  } else {
    activeContext = 'personal';
  }

  // Learner roles always show topbar; staff show sidebar UNLESS they've switched to personal context
  const isNaturalLearner =
    roles.has('individual_learner') ||
    roles.has('org_student') ||
    (!roles.has('platform_admin') && !roles.has('org_admin') && !roles.has('professor'));

  // showTopbarNav: learner roles OR staff who switched to personal workspace
  const showTopbarNav =
    isNaturalLearner || (activeContext === 'personal' && activeWorkspace === 'personal');

  // showSidebarNav: staff in their org/platform context
  const showSidebarNav = !showTopbarNav;

  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
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
    <div className={cn('app-chrome', showTopbarNav && 'app-chrome--topbar')}>
      {/* ─── Learner Top Navigation Bar (d.webp layout) ────────────────────────── */}
      {showTopbarNav && (
        <header className="app-chrome__topbar">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
            {/* Left: Site Logo & Workspace Context Switcher */}
            <div className="flex items-center gap-4">
              <Link to={logoTo} className="flex items-center text-pearl-100 hover:opacity-85 transition-opacity" aria-label="DevOpsMentor home">
                <SiteLogo />
              </Link>
              <WorkspaceSwitcher variant="topbar" />
            </div>

            {/* Center: Segmented Navigation Pills (as in d.webp) */}
            <nav className="flex items-center gap-1.5 p-1 rounded-full bg-white/10 dark:bg-white/5 border border-white/10" aria-label="Learner Primary">
              <NavLink
                to={ROUTES.DASHBOARD}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all',
                    isActive
                      ? 'bg-pearl-100 text-ink dark:bg-pearl-100 dark:text-ink font-semibold shadow-xs'
                      : 'text-pearl-100/70 hover:text-pearl-100 hover:bg-white/5',
                  )
                }
              >
                <Icon name="dashboard" size={14} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to={ROUTES.LEARN}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all',
                    isActive
                      ? 'bg-pearl-100 text-ink dark:bg-pearl-100 dark:text-ink font-semibold shadow-xs'
                      : 'text-pearl-100/70 hover:text-pearl-100 hover:bg-white/5',
                  )
                }
              >
                <Icon name="roles" size={14} />
                <span>Curriculum</span>
              </NavLink>

              <NavLink
                to={ROUTES.LABS}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all',
                    isActive
                      ? 'bg-pearl-100 text-ink dark:bg-pearl-100 dark:text-ink font-semibold shadow-xs'
                      : 'text-pearl-100/70 hover:text-pearl-100 hover:bg-white/5',
                  )
                }
              >
                <Icon name="terminal" size={14} />
                <span>Sandboxes</span>
              </NavLink>

              <NavLink
                to={ROUTES.TRACKS}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all',
                    isActive
                      ? 'bg-pearl-100 text-ink dark:bg-pearl-100 dark:text-ink font-semibold shadow-xs'
                      : 'text-pearl-100/70 hover:text-pearl-100 hover:bg-white/5',
                  )
                }
              >
                <Icon name="track" size={14} />
                <span>Career Paths</span>
              </NavLink>
            </nav>

            {/* Right: Notifications & User Profile Chip */}
            <div className="flex items-center gap-3">
              {canSeeNotifications && <NotificationBell />}

              {/* Profile Chip with Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-left"
                  aria-expanded={profileDropdownOpen}
                  aria-label="User menu"
                >
                  <span className="w-8 h-8 rounded-full bg-pearl-100 text-ink flex items-center justify-center font-bold text-xs shrink-0">
                    {userInitials(profileName)}
                  </span>
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-semibold text-pearl-100 leading-tight truncate max-w-[120px]">
                      Hi, {user?.fullName?.split(' ')[0] || user?.username || 'Learner'}!
                    </span>
                    <span className="text-[10px] text-pearl-100/60 truncate max-w-[120px] font-mono">
                      {user?.email ?? ''}
                    </span>
                  </div>
                  <Icon
                    name={profileDropdownOpen ? 'chevrons-right' : 'chevrons-left'}
                    size={12}
                    className="text-pearl-100/60 -rotate-90"
                  />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg py-1.5 z-50 text-card-foreground">
                    <div className="px-3.5 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-card-foreground truncate">{profileName}</p>
                      <p className="text-[11px] text-muted truncate font-mono">{user?.email}</p>
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
                        to={ROUTES.ACHIEVEMENTS}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-surface-hover transition-colors"
                      >
                        <Icon name="award" size={14} className="text-muted" />
                        <span>Achievements</span>
                      </Link>

                      <Link
                        to={ROUTES.SETTINGS}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-surface-hover transition-colors"
                      >
                        <Icon name="settings" size={14} className="text-muted" />
                        <span>Account Settings</span>
                      </Link>

                      <Link
                        to={ROUTES.BILLING}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-surface-hover transition-colors"
                      >
                        <Icon name="card" size={14} className="text-muted" />
                        <span>Billing & Seats</span>
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
                to={logoTo}
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

            <div className="px-4 py-3 border-b border-border">
              <WorkspaceSwitcher variant="mobile" />
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
            <Link to={logoTo} className="app-chrome__logo" aria-label="DevOpsMentor home">
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

          <div className="px-3 py-2 border-b border-border">
            <WorkspaceSwitcher variant="sidebar" isCollapsed={!isSidebarOpen} />
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
