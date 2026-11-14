import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input, Modal, toast } from '@/shared/components';
import { Icon, type IconName } from '@/shared/components/Icon';
import { QUERY_KEYS, ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { refreshAuthSession } from '@/features/auth/utils/refreshAuthSession';
import { useMyOrg, useCreateOrg } from '@/features/org/hooks/useOrg';
import { useMyClasses } from '@/features/enrollment/hooks';
import { enrollmentService } from '@/features/enrollment/services';
import { cn } from '@/shared/utils';
import {
  hasMultipleWorkspaces,
  isOrgStaff,
  isOrgStudent,
  isPlatformAdmin,
  resolveWorkspaceKind,
  type WorkspaceKind,
} from './workspaceContext';

interface WorkspaceSwitcherProps {
  variant?: 'topbar' | 'sidebar' | 'mobile';
  isCollapsed?: boolean;
  /** Called after a successful workspace switch (e.g. to close the mobile drawer). */
  onAfterSwitch?: () => void;
}

function slugify(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function workspaceIcon(kind: WorkspaceKind): IconName {
  switch (kind) {
    case 'org':
      return 'organization';
    case 'class':
      return 'my-class';
    case 'platform':
      return 'platform-admins';
    case 'personal':
    default:
      return 'dashboard';
  }
}

interface WorkspaceItemProps {
  icon: IconName;
  label: string;
  description?: string;
  active: boolean;
  onSelect: () => void;
}

function WorkspaceItem({ icon, label, description, active, onSelect }: WorkspaceItemProps) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs outline-none transition-colors',
        'data-[highlighted]:bg-surface-hover',
        active && 'bg-surface',
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Icon name={icon} size={14} className="shrink-0 text-muted" />
        <span className="min-w-0">
          <span className="block truncate font-medium text-card-foreground">{label}</span>
          {description ? (
            <span className="block truncate font-mono text-xs text-muted">{description}</span>
          ) : null}
        </span>
      </span>
      {active ? <Icon name="check" size={14} className="shrink-0 text-ink" /> : null}
    </DropdownMenu.Item>
  );
}

interface WorkspaceActionProps {
  icon: IconName;
  label: string;
  onSelect: () => void;
}

function WorkspaceAction({ icon, label, onSelect }: WorkspaceActionProps) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted outline-none transition-colors data-[highlighted]:bg-surface-hover data-[highlighted]:text-card-foreground"
    >
      <Icon name={icon} size={14} className="shrink-0" />
      <span>{label}</span>
    </DropdownMenu.Item>
  );
}

/**
 * URL-first workspace switcher.
 *
 * There is deliberately no persisted "active workspace" value. The current
 * workspace is derived from the route, and switching is just navigation.
 * Server-side authorization remains the only thing that can grant access.
 */
export function WorkspaceSwitcher({
  variant = 'topbar',
  isCollapsed = false,
  onAfterSwitch,
}: WorkspaceSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isJoinClassOpen, setIsJoinClassOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [classCode, setClassCode] = useState('');

  const platformAdmin = isPlatformAdmin(user);
  const staff = isOrgStaff(user);
  const student = isOrgStudent(user);

  // Only ask the API for data the user can actually own. This prevents
  // 403/404 noise for learners and avoids fetching an org directory they
  // can never switch to. Learners can belong to several classes, so the full
  // list is the switcher's source of truth.
  const orgQuery = useMyOrg(staff).query;
  const classQuery = useMyClasses(student);
  const createOrg = useCreateOrg();

  const org = orgQuery.data ?? null;
  const myClasses = classQuery.data ?? [];
  const requestedClassId = Number(new URLSearchParams(location.search).get('classId'));
  const selectedClass =
    myClasses.find((entry) => entry.classId === requestedClassId) ?? myClasses[0] ?? null;
  const activeKind = resolveWorkspaceKind(location.pathname, user);

  // Learners and individual accounts may always join another class. Staff and
  // platform admins cannot redeem a student code.
  const canJoinClass = !platformAdmin && !staff;
  const canCreateOrg = !platformAdmin && !staff && !student;
  const showOrg = staff && Boolean(org);

  const closeCreateOrg = useCallback(() => setIsCreateOrgOpen(false), []);
  const closeJoinClass = useCallback(() => setIsJoinClassOpen(false), []);

  // Platform administrators have one platform surface: no switcher at all.
  // Placed after hooks so hook order is stable.
  if (platformAdmin) {
    return null;
  }

  // Always keep a way back to Personal while standing on an org/class URL.
  // The org/class lookup may fail when the record was deleted or the scope is
  // stale; hiding the switcher in that state would strand the user.
  const isWorkspaceRoute = activeKind === 'org' || activeKind === 'class';

  if (
    !isWorkspaceRoute &&
    !hasMultipleWorkspaces({
      isStaff: staff,
      hasOrg: Boolean(org),
      hasClass: myClasses.length > 0,
      canCreateOrg,
      canJoinClass,
    })
  ) {
    return null;
  }

  const switchTo = (route: string) => {
    // Navigation is the switch. Invalidate the destination's server state so
    // a previously visited workspace cannot paint stale data while refetching.
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.me });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollment.myClasses });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollment.myClass() });
    onAfterSwitch?.();
    navigate(route);
  };

  const refreshIdentity = async (): Promise<boolean> => {
    const refreshed = await refreshAuthSession();
    if (!refreshed) {
      return false;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.me }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollment.myClasses }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollment.myClass() }),
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
    ]);
    return true;
  };

  const handleCreateOrg = async (event: FormEvent) => {
    event.preventDefault();
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create organization.');
      return;
    }

    const identityReady = await refreshIdentity();
    setOrgName('');
    setOrgSlug('');
    setSlugTouched(false);
    setIndustry('');
    setDescription('');
    setIsCreateOrgOpen(false);
    toast.success('Organization created successfully.');
    onAfterSwitch?.();
    navigate(identityReady ? ROUTES.ORG_DASHBOARD : ROUTES.DASHBOARD);
  };

  const handleJoinClass = async (event: FormEvent) => {
    event.preventDefault();
    const code = classCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,12}$/.test(code)) {
      toast.error('Enter a valid class code (6–12 letters and digits).');
      return;
    }

    setIsJoining(true);
    try {
      const result = await enrollmentService.joinWithCode(code);
      const identityReady = await refreshIdentity();
      setClassCode('');
      setIsJoinClassOpen(false);
      toast.success(
        result.alreadyEnrolled
          ? `You are already enrolled in ${result.className}.`
          : `Joined ${result.className}.`,
      );
      onAfterSwitch?.();
      navigate(
        identityReady ? `${ROUTES.STUDENT_MY_CLASS}?classId=${result.classId}` : ROUTES.DASHBOARD,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to join this class.');
    } finally {
      setIsJoining(false);
    }
  };

  let activeLabel = 'Personal';
  let activeDescription: string | undefined;
  if (activeKind === 'org') {
    activeLabel = org?.name ?? 'Organization';
    activeDescription = 'Organization workspace';
  } else if (activeKind === 'class') {
    activeLabel = selectedClass?.className ?? 'My class';
    activeDescription = selectedClass?.organizationName;
  }

  const triggerContent = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <Icon name={workspaceIcon(activeKind)} size={14} className="shrink-0 text-muted" />
        <span className="truncate font-medium">{activeLabel}</span>
      </span>
      <Icon name="chevron-down" size={12} className="shrink-0 text-muted" />
    </>
  );

  const triggerClassName =
    variant === 'topbar'
      ? 'flex max-w-48 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-card-foreground transition-colors hover:bg-surface-hover'
      : isCollapsed
        ? 'mx-auto flex size-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-card-foreground transition-colors hover:bg-surface-hover'
        : 'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-card-foreground transition-colors hover:bg-surface-hover';

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={triggerClassName}
            aria-label={`Switch workspace. Current: ${activeLabel}`}
            title={activeDescription ? `${activeLabel} — ${activeDescription}` : activeLabel}
          >
            {isCollapsed && variant !== 'topbar' ? (
              <Icon name={workspaceIcon(activeKind)} size={16} />
            ) : (
              triggerContent
            )}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side={variant === 'sidebar' && isCollapsed ? 'right' : 'bottom'}
            align="start"
            sideOffset={8}
            onCloseAutoFocus={(event) => event.preventDefault()}
            className="z-50 min-w-72 rounded-xl border border-border bg-card p-1.5 text-card-foreground shadow-xl"
          >
            <DropdownMenu.Label className="px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted">
              Workspaces
            </DropdownMenu.Label>

            <WorkspaceItem
              icon="dashboard"
              label="Personal"
              description="Your own learning space"
              active={activeKind === 'personal'}
              onSelect={() => switchTo(ROUTES.DASHBOARD)}
            />

            {showOrg ? (
              <WorkspaceItem
                icon="organization"
                label={org?.name ?? 'Organization'}
                description="Organization workspace"
                active={activeKind === 'org'}
                onSelect={() => switchTo(ROUTES.ORG_DASHBOARD)}
              />
            ) : null}

            {myClasses.map((entry) => (
              <WorkspaceItem
                key={entry.classId}
                icon="my-class"
                label={entry.className}
                description={entry.organizationName}
                active={activeKind === 'class' && selectedClass?.classId === entry.classId}
                onSelect={() => switchTo(`${ROUTES.STUDENT_MY_CLASS}?classId=${entry.classId}`)}
              />
            ))}

            {canJoinClass || canCreateOrg ? (
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
            ) : null}

            {canJoinClass ? (
              <WorkspaceAction
                icon="my-class"
                label="Join class with code"
                onSelect={() => setIsJoinClassOpen(true)}
              />
            ) : null}

            {canCreateOrg ? (
              <WorkspaceAction
                icon="organization"
                label="Create organization"
                onSelect={() => setIsCreateOrgOpen(true)}
              />
            ) : null}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Modal open={isJoinClassOpen} onClose={closeJoinClass} title="Join a class">
        <form onSubmit={handleJoinClass} className="space-y-5">
          <p className="text-xs leading-relaxed text-muted">
            Enter the reusable class code shared by your instructor. Codes expire automatically.
            Staff accounts cannot join a class as students.
          </p>

          <Input
            label="Class code"
            placeholder="e.g. A7K2M9QX"
            value={classCode}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setClassCode(event.target.value.toUpperCase())
            }
            hint="6–12 letters and digits."
            autoFocus
            required
          />

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={closeJoinClass}
              disabled={isJoining}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isJoining}>
              Join class
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={isCreateOrgOpen} onClose={closeCreateOrg} title="Create organization">
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <p className="text-xs leading-relaxed text-muted">
            An organization workspace lets you manage cohorts, invite instructors, and track learner
            progress. An account can belong to one organization at a time.
          </p>

          <Input
            label="Organization name"
            placeholder="e.g. FAST NUCES Computer Science"
            value={orgName}
            onChange={(event) => {
              const value = event.target.value;
              setOrgName(value);
              if (!slugTouched) {
                setOrgSlug(slugify(value));
              }
            }}
            required
          />

          <Input
            label="Organization slug"
            placeholder="e.g. fast-nuces"
            value={orgSlug}
            onChange={(event) => {
              setSlugTouched(true);
              setOrgSlug(slugify(event.target.value));
            }}
            hint="Used in URLs. Lowercase letters, numbers, and hyphens."
            required
          />

          <Input
            label="Industry or field (optional)"
            placeholder="e.g. Higher education"
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
          />

          <Input
            label="Description (optional)"
            placeholder="A short description of your organization"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={closeCreateOrg}
              disabled={createOrg.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createOrg.isPending}>
              Create organization
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default WorkspaceSwitcher;
