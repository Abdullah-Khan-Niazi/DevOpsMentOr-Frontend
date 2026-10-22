import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, toast } from '@/shared/components';
import { Icon } from '@/shared/components/Icon';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { AuthUser } from '@/features/auth/types';
import { authService } from '@/features/auth/services';
import { useMyOrg, useCreateOrg } from '@/features/org/hooks/useOrg';
import { useMyClass } from '@/features/enrollment/hooks';

interface WorkspaceSwitcherProps {
  variant?: 'topbar' | 'sidebar' | 'mobile';
  isCollapsed?: boolean;
}

function slugify(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export function WorkspaceSwitcher({ variant = 'topbar', isCollapsed = false }: WorkspaceSwitcherProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isJoinCohortOpen, setIsJoinCohortOpen] = useState(false);
  const [cohortCode, setCohortCode] = useState('');

  // Active workspace stored in localStorage
  const [activeMode, setActiveMode] = useState<string>(() => {
    try {
      return localStorage.getItem('stardust_active_workspace') || 'default';
    } catch {
      return 'default';
    }
  });

  // Create Org Form State
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const roles = new Set(user?.roles ?? []);
  const isPlatformAdmin = roles.has('platform_admin');
  const isOrgAdmin = roles.has('org_admin');
  const isProfessor = roles.has('professor');
  const isOrgStudent = roles.has('org_student');

  // Queries
  const { query: orgQuery } = useMyOrg();
  const classQuery = useMyClass();
  const createOrg = useCreateOrg();

  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isOpen]);

  const enrolledClass = classQuery.data ?? null;
  const myOrg = orgQuery.data ?? null;

  // Active workspace label calculation
  let activeWorkspaceName = 'Personal Space';
  if (activeMode === 'personal') {
    activeWorkspaceName = 'Personal Space';
  } else if (isPlatformAdmin) {
    activeWorkspaceName = 'Platform Admin';
  } else if (isOrgAdmin || isProfessor) {
    activeWorkspaceName = myOrg?.name ?? 'Organization Space';
  } else if (isOrgStudent && enrolledClass) {
    activeWorkspaceName = enrolledClass.className;
  }

  const switchWorkspace = (mode: string, route: string) => {
    setActiveMode(mode);
    try {
      localStorage.setItem('stardust_active_workspace', mode);
    } catch {
      // storage quota or private mode
    }
    setIsOpen(false);
    navigate(route);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error('Organization name is required.');
      return;
    }
    const finalSlug = orgSlug.trim() || slugify(orgName);
    try {
      await createOrg.mutateAsync({
        name: orgName.trim(),
        slug: finalSlug,
        industry: industry.trim() || undefined,
        description: description.trim() || undefined,
      });

      // Refresh session user state so org permissions are instantly updated
      const freshMe = await authService.getMe();
      useAuthStore.getState().setUser(freshMe as unknown as AuthUser);

      try {
        localStorage.setItem('stardust_active_workspace', 'org');
      } catch {
        // ignore
      }
      setActiveMode('org');
      toast.success('Organization created successfully!');
      setIsCreateOrgOpen(false);
      setOrgName('');
      setOrgSlug('');
      setDescription('');
      navigate(ROUTES.ORG_DASHBOARD);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to create organization.');
    }
  };

  const handleJoinCohort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortCode.trim()) {
      toast.error('Enter an invitation or cohort code.');
      return;
    }
    setIsJoinCohortOpen(false);
    navigate(`${ROUTES.ENROLL_ACCEPT}?token=${encodeURIComponent(cohortCode.trim())}`);
  };

  return (
    <div
      className="relative inline-block"
      ref={dropdownRef}
      data-dropdown-open={isOpen ? 'true' : undefined}
    >
      {/* ─── Trigger Button ──────────────────────────────────────────────── */}
      {variant === 'topbar' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-pearl-100 text-xs font-medium transition-all cursor-pointer max-w-[200px]"
          aria-expanded={isOpen}
          aria-label="Switch workspace"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">{activeWorkspaceName}</span>
          <span className="text-[10px] text-pearl-100/60 font-mono">▾</span>
        </button>
      ) : isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 mx-auto rounded-lg border border-border bg-card flex items-center justify-center text-card-foreground hover:bg-surface-hover transition-colors cursor-pointer"
          title={`Active Workspace: ${activeWorkspaceName}`}
          aria-label="Switch workspace"
        >
          <Icon name="organization" size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-surface-hover text-card-foreground text-xs font-medium transition-all cursor-pointer"
          aria-expanded={isOpen}
          aria-label="Switch workspace"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate font-semibold">{activeWorkspaceName}</span>
          </div>
          <span className="text-muted text-[10px] font-mono shrink-0">▾</span>
        </button>
      )}

      {/* ─── Dropdown Menu ───────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-64 rounded-xl border border-border bg-card shadow-xl py-1.5 text-card-foreground animate-in fade-in zoom-in-95 duration-100 ${
            variant === 'sidebar' && isCollapsed ? 'left-14 top-0' : 'left-0'
          }`}
        >
          <div className="px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-wider text-muted border-b border-border">
            Workspaces
          </div>

          <div className="py-1">
            {/* Personal Space (always available to everyone) */}
            <button
              type="button"
              onClick={() => switchWorkspace('personal', ROUTES.DASHBOARD)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs hover:bg-surface-hover transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon name="dashboard" size={14} className="text-muted shrink-0" />
                <span className="truncate">Personal Learning Space</span>
              </div>
              {activeWorkspaceName === 'Personal Space' && (
                <span className="text-xs font-bold text-emerald-500">✓</span>
              )}
            </button>

            {/* Platform Admin Console (if platform admin) */}
            {isPlatformAdmin && (
              <button
                type="button"
                onClick={() => switchWorkspace('platform', ROUTES.ADMIN_DASHBOARD)}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs hover:bg-surface-hover transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon name="settings" size={14} className="text-muted shrink-0" />
                  <span className="truncate">Platform Administration</span>
                </div>
                {activeWorkspaceName === 'Platform Admin' && (
                  <span className="text-xs font-bold text-emerald-500">✓</span>
                )}
              </button>
            )}

            {/* Organization Workspace (if org admin, professor, or has org) */}
            {(isOrgAdmin || isProfessor || myOrg) && (
              <button
                type="button"
                onClick={() => switchWorkspace('org', ROUTES.ORG_DASHBOARD)}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs hover:bg-surface-hover transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon name="organization" size={14} className="text-muted shrink-0" />
                  <span className="truncate">{myOrg?.name ?? 'Organization Space'}</span>
                </div>
                {activeWorkspaceName === (myOrg?.name ?? 'Organization Space') && (
                  <span className="text-xs font-bold text-emerald-500">✓</span>
                )}
              </button>
            )}

            {/* Enrolled Class Cohort (if student) */}
            {enrolledClass && (
              <button
                type="button"
                onClick={() => switchWorkspace('class', ROUTES.STUDENT_MY_CLASS)}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs hover:bg-surface-hover transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon name="my-class" size={14} className="text-muted shrink-0" />
                  <span className="truncate">{enrolledClass.className}</span>
                </div>
                {activeWorkspaceName === enrolledClass.className && (
                  <span className="text-xs font-bold text-emerald-500">✓</span>
                )}
              </button>
            )}
          </div>

          {/* Action Links */}
          <div className="pt-1 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsJoinCohortOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-surface-hover transition-colors text-left cursor-pointer text-muted hover:text-card-foreground"
            >
              <span className="font-bold">＋</span>
              <span>Join Cohort with Code</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsCreateOrgOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-surface-hover transition-colors text-left cursor-pointer text-muted hover:text-card-foreground"
            >
              <span className="font-bold">＋</span>
              <span>Create Organization</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal 1: Join Cohort with Code ──────────────────────────────── */}
      {isJoinCohortOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-card-foreground tracking-tight">
                Join a Class or Cohort
              </h3>
              <button
                type="button"
                onClick={() => setIsJoinCohortOpen(false)}
                className="text-muted hover:text-card-foreground p-1 rounded-md"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Enter the invitation code or token provided by your instructor or organization administrator.
            </p>

            <form onSubmit={handleJoinCohort} className="space-y-4">
              <Input
                label="Invitation Code / Token"
                placeholder="e.g. cs401-fall2026-xyz"
                value={cohortCode}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCohortCode(e.target.value)}
                autoFocus
                required
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsJoinCohortOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Join Cohort
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Create Organization ─────────────────────────────────── */}
      {isCreateOrgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-card-foreground tracking-tight">
                Create Organization Workspace
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOrgOpen(false)}
                className="text-muted hover:text-card-foreground p-1 rounded-md"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Create an isolated organization workspace to manage cohorts, invite instructors, and track student progression.
            </p>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <Input
                label="Organization Name"
                placeholder="e.g. FAST NUCES Computer Science"
                value={orgName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const val = e.target.value;
                  setOrgName(val);
                  if (!slugTouched) {
                    setOrgSlug(slugify(val));
                  }
                }}
                required
              />

              <Input
                label="Organization Slug (URL identifier)"
                placeholder="e.g. fast-nuces"
                value={orgSlug}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setSlugTouched(true);
                  setOrgSlug(slugify(e.target.value));
                }}
                required
              />

              <Input
                label="Industry / Field (Optional)"
                placeholder="e.g. Higher Education, Software Engineering"
                value={industry}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setIndustry(e.target.value)}
              />

              <Input
                label="Description (Optional)"
                placeholder="Brief description of your school or company workspace"
                value={description}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateOrgOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createOrg.isPending}
                >
                  {createOrg.isPending ? 'Creating…' : 'Create Workspace'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
