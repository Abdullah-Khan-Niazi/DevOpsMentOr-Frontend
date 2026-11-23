import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { SiteLogo } from '@/shared/components/Logo';
import { Icon } from '@/shared/components/Icon';
import { TabRowNav } from '@/shared/components/TabRow';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { hasOpenOverlay } from '@/shared/components/Overlay';
import { toast } from '@/shared/components/Toast';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useLogout } from '@/features/auth/hooks';
import { useMyClass } from '@/features/enrollment/hooks';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useUiStore } from '@/shared/stores';
import { QUERY_KEYS, ROUTES } from '@/shared/constants';
import { cn } from '@/shared/utils';
import { AnnouncementBanner } from '@/features/notifications/components/AnnouncementBanner';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { usePublishedAnnouncements } from '@/features/notifications/hooks/useNotifications';
import { gamificationService } from '@/features/achievements/services/gamificationService';
import { buildNavItems, type AppNavItem } from './navigation';
import {
  isPlatformAdmin as isPlatformAdminUser,
  resolveWorkspaceKind,
  workspaceHome,
} from './workspaceContext';
import './AppChrome.css';

// Unified authenticated chrome, responsive layout:
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

/** Toasts achievements and badges unlocked after the first load of this session, once per id. */
function useAchievementWatcher(enabled: boolean) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: QUERY_KEYS.gamification.profile,
    queryFn: () => gamificationService.getMyProfile(),
    enabled,
    retry: false,
  });
  const seenRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!data) return;
    const unlocked = [
      ...data.achievements.map((achievement) => ({
        key: `achievement:${achievement.achievementId}`,
        name: achievement.name,
      })),
      ...data.badges.map((badge) => ({
        key: `badge:${badge.badgeId}`,
        name: badge.badgeName,
      })),
    ];
    const seen = seenRef.current;
    if (seen === null) {
      // First snapshot: existing unlocks are the baseline, not news.
      seenRef.current = new Set(unlocked.map((item) => item.key));
      return;
    }
    const fresh = unlocked.filter((item) => !seen.has(item.key));
    if (fresh.length === 0) return;
    for (const item of fresh) {
      seen.add(item.key);
      toast.success(`Achievement unlocked: ${item.name}`);
    }
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount });
  }, [data, queryClient]);
}

export function AppChrome({ navItems, logoTo, children }: AppChromeProps) {
  const { isSidebarOpen, toggleSidebar } = useUiStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<{ text: string; top: number } | null>(null);
  const topbarRef = useRef<HTMLElement>(null);
  const scrollSentinelRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const location = useLocation();
  const { data: announcements } = usePublishedAnnouncements();
  const permissions = new Set(user?.permissions ?? []);
  const canSeeNotifications = permissions.has('notifications:inbox:read');
  const canSeeGamification = permissions.has('gamification:profile:read');

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

  useAchievementWatcher(canSeeGamification);

  // The top bar gains its elevation once the page scrolls under it. Only main
  // scrolls (full-height shell), so main is the observer root.
  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    const topbar = topbarRef.current;
    if (!sentinel || !topbar || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        topbar.dataset.scrolled = String(!entry.isIntersecting);
      },
      { root: sentinel.parentElement },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [location.pathname, showTopbarNav]);

  // Escape closes the mobile drawer unless a modal opened from it is on top.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || hasOpenOverlay()) return;
      setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

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
        <header className="app-chrome__topbar" ref={topbarRef}>
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

            {/* Center: primary navigation */}
            <div className="app-chrome__topbar-nav">
              <TabRowNav
                ariaLabel="Learner Primary"
                items={topbarItems.map((item) => ({
                  to: item.to,
                  label: item.label,
                  icon: item.icon,
                }))}
              />
            </div>

            {/* Right: notifications & profile menu */}
            <div className="flex items-center gap-3">
              {canSeeNotifications && <NotificationBell />}

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="app-chrome__profile-trigger"
                    aria-label="User menu"
                  >
                    <span className="w-8 h-8 rounded-full bg-ink text-pearl-100 flex items-center justify-center font-bold text-xs shrink-0">
                      {userInitials(profileName)}
                    </span>
                    <Icon name="chevron-down" size={12} className="text-muted" />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-(--z-dropdown) w-56 rounded-xl border border-border bg-card shadow-lg py-1.5 text-card-foreground"
                  >
                    <DropdownMenu.Label className="px-3.5 py-2 text-xs font-semibold text-card-foreground truncate">
                      {profileName}
                    </DropdownMenu.Label>

                    <div className="py-1">
                      <DropdownMenu.Item asChild>
                        <Link
                          to={profileTo}
                          className="flex cursor-pointer select-none items-center gap-2.5 px-3.5 py-2 text-xs outline-none data-[highlighted]:bg-surface-hover transition-colors"
                        >
                          <Icon name="users" size={14} className="text-muted" />
                          <span>View Profile</span>
                        </Link>
                      </DropdownMenu.Item>

                      <DropdownMenu.Item asChild>
                        <Link
                          to={ROUTES.SETTINGS}
                          className="flex cursor-pointer select-none items-center gap-2.5 px-3.5 py-2 text-xs outline-none data-[highlighted]:bg-surface-hover transition-colors"
                        >
                          <Icon name="settings" size={14} className="text-muted" />
                          <span>Account Settings</span>
                        </Link>
                      </DropdownMenu.Item>
                    </div>

                    <div className="pt-1">
                      <DropdownMenu.Item
                        disabled={logout.isPending}
                        onSelect={() => logout.mutate()}
                        className="flex w-full cursor-pointer select-none items-center gap-2.5 px-3.5 py-2 text-xs text-error outline-none data-[highlighted]:bg-surface-hover transition-colors data-[disabled]:opacity-50"
                      >
                        <Icon name="logout" size={14} />
                        <span>Sign Out</span>
                      </DropdownMenu.Item>
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
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
              <div className="px-4 py-3">
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
                      {({ isActive }) => (
                        <>
                          <Icon
                            name={item.icon}
                            className="app-chrome__nav-icon"
                            selected={isActive}
                          />
                          <span className="app-chrome__nav-label">{item.label}</span>
                        </>
                      )}
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
            <div className="px-3 py-2">
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
                    {({ isActive }) => (
                      <>
                        <Icon
                          name={item.icon}
                          className="app-chrome__nav-icon"
                          selected={isActive}
                        />
                        <span className="app-chrome__nav-label">{item.label}</span>
                      </>
                    )}
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
      {/* Column that fills the rest of the shell: the offline bar sits under the
          top bar / mobile header (and beside the staff sidebar), main scrolls. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <main key={location.pathname} className="app-chrome__main motion-page">
          <div ref={scrollSentinelRef} aria-hidden="true" style={{ height: 1, flex: 'none' }} />
          {announcements && announcements.length > 0 ? (
            <AnnouncementBanner announcements={announcements} />
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
