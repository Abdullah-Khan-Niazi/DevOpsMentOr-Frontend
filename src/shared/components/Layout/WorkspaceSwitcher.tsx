import { useCallback, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, FieldError, Input, Modal, Spinner, toast } from '@/shared/components';
import { Icon, type IconName } from '@/shared/components/Icon';
import { QUERY_KEYS, ROUTES } from '@/shared/constants';
import { getErrorMessage } from '@/shared/services';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { refreshAuthSession } from '@/features/auth/utils/refreshAuthSession';
import { useMyMemberships, useSwitchOrg, useCreateOrg } from '@/features/org/hooks/useOrg';
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

/** Mirrors `createOrgSchema` (backend `org.validator.ts`). */
const slugPattern = /^[a-z0-9-]+$/;
const createOrgSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters.').max(255),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters.')
    .max(255)
    .regex(slugPattern, 'Slug may only contain lowercase letters, digits and hyphens.'),
  industry: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
});
type CreateOrgValues = z.infer<typeof createOrgSchema>;

const CLASS_CODE_PATTERN = /^[A-Z0-9]{6,12}$/;

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
  /** Muted word shown at the end of the row (for example a role). */
  trailing?: string;
  active: boolean;
  pending?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

function WorkspaceItem({
  icon,
  label,
  trailing,
  active,
  pending = false,
  disabled = false,
  onSelect,
}: WorkspaceItemProps) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs outline-none transition-colors',
        'data-[highlighted]:bg-surface-hover data-[disabled]:cursor-default data-[disabled]:opacity-60',
        active && 'bg-surface',
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Icon name={icon} size={14} className="shrink-0 text-muted" />
        <span className="block truncate font-medium text-card-foreground">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {trailing ? <span className="text-xs text-muted">{trailing}</span> : null}
        {pending ? (
          <Spinner className="size-3.5" label="Switching workspace" />
        ) : active ? (
          <Icon name="check" size={14} selected className="text-ink" />
        ) : null}
      </span>
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
  const [slugTouched, setSlugTouched] = useState(false);
  const [isJoinClassOpen, setIsJoinClassOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [classCodeError, setClassCodeError] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [switchingOrgId, setSwitchingOrgId] = useState<number | null>(null);

  const createOrgForm = useForm<CreateOrgValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: '', slug: '', industry: '', description: '' },
  });

  const platformAdmin = isPlatformAdmin(user);

  // Only ask the API for data the user can actually own. Learners can belong
  // to several classes, so the full class list is the switcher's source of truth.
  const membershipsQuery = useMyMemberships(!platformAdmin);
  const switchOrg = useSwitchOrg();
  const classQuery = useMyClasses(isOrgStudent(user));
  const createOrg = useCreateOrg();

  const memberships = membershipsQuery.data ?? [];
  const orgMemberships = memberships.filter((membership) => membership.role !== 'org_student');
  const activeOrgMembership = orgMemberships.find((membership) => membership.isPrimary) ?? null;
  const myClasses = classQuery.data ?? [];
  const staff = isOrgStaff(user, memberships);
  const requestedClassId = Number(new URLSearchParams(location.search).get('classId'));
  const selectedClass =
    myClasses.find((entry) => entry.classId === requestedClassId) ?? myClasses[0] ?? null;
  const activeKind = resolveWorkspaceKind(location.pathname, user);

  // Learners and individual accounts may always join another class. Staff and
  // platform admins cannot redeem a student code.
  const canJoinClass = !platformAdmin && !staff;
  // Multi-org: anyone may found another organization unless they already
  // administer one (the server enforces the same rule in createMyOrg).
  const hasOrgAdminMembership = memberships.some((membership) => membership.role === 'org_admin');
  const canCreateOrg = !platformAdmin && !hasOrgAdminMembership;

  const closeCreateOrg = () => {
    createOrgForm.reset();
    setSlugTouched(false);
    setIsCreateOrgOpen(false);
  };
  const closeJoinClass = useCallback(() => {
    setClassCode('');
    setClassCodeError(null);
    setIsJoinClassOpen(false);
  }, []);
  const closeInvite = useCallback(() => {
    setInviteLink('');
    setInviteError(null);
    setIsInviteOpen(false);
  }, []);

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
      hasOrg: orgMemberships.length > 0,
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

  const invalidateWorkspaceData = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['org'] }),
      queryClient.invalidateQueries({ queryKey: ['progress', 'orgs'] }),
      queryClient.invalidateQueries({ queryKey: ['leaderboard', 'org'] }),
      queryClient.invalidateQueries({ queryKey: ['student'] }),
    ]);

  /**
   * Multi-org switch: the backend validates the membership and repoints the
   * active scope. The access token is re-minted so the new org's role is in
   * the JWT; org guards then resolve the role from `organization_memberships`,
   * so no privilege can leak across tenants.
   */
  const handleSwitchOrg = async (membership: (typeof orgMemberships)[number]) => {
    // Already the active organization: no POST, just open its workspace.
    if (membership.isPrimary) {
      void invalidateWorkspaceData();
      onAfterSwitch?.();
      navigate(ROUTES.ORG_DASHBOARD);
      return;
    }

    setSwitchingOrgId(membership.organizationId);
    try {
      const result = await switchOrg.mutateAsync(membership.organizationId);
      const refreshed = await refreshAuthSession();
      if (!refreshed) {
        toast.error('Could not refresh your session. Please try again.');
        return;
      }
      await invalidateWorkspaceData();
      toast.success(`Switched to ${result.organizationName}.`);
      onAfterSwitch?.();
      navigate(ROUTES.ORG_DASHBOARD);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to switch organization.'));
    } finally {
      setSwitchingOrgId(null);
    }
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

  const handleCreateOrg = async (values: CreateOrgValues) => {
    try {
      await createOrg.mutateAsync({
        name: values.name,
        slug: values.slug,
        industry: values.industry || undefined,
        description: values.description || undefined,
      });
    } catch (error) {
      createOrgForm.setError('root', {
        message: getErrorMessage(error, 'Failed to create organization.'),
      });
      return;
    }

    const identityReady = await refreshIdentity();
    createOrgForm.reset();
    setSlugTouched(false);
    setIsCreateOrgOpen(false);
    toast.success('Organization created successfully.');
    onAfterSwitch?.();
    navigate(identityReady ? ROUTES.ORG_DASHBOARD : ROUTES.DASHBOARD);
  };

  const handleJoinClass = async (event: FormEvent) => {
    event.preventDefault();
    const code = classCode.trim().toUpperCase();
    if (!CLASS_CODE_PATTERN.test(code)) {
      setClassCodeError('Class codes are 6 to 12 letters and digits.');
      return;
    }
    setClassCodeError(null);

    setIsJoining(true);
    try {
      const result = await enrollmentService.joinWithCode(code);
      const identityReady = await refreshIdentity();
      setClassCode('');
      setClassCodeError(null);
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
      setClassCodeError(getErrorMessage(error, 'Unable to join this class.'));
    } finally {
      setIsJoining(false);
    }
  };

  /**
   * Accepts a pasted invitation link. The link must be same-origin and point
   * at one of the two accept pages; the token travels in the query string of
   * that page, which strips it from the address bar on arrival.
   */
  const handleJoinWithLink = (event: FormEvent) => {
    event.preventDefault();
    let url: URL;
    try {
      url = new URL(inviteLink.trim(), window.location.origin);
    } catch {
      setInviteError('Paste the full invitation link.');
      return;
    }
    if (url.origin !== window.location.origin) {
      setInviteError('This link does not belong to this site.');
      return;
    }
    if (url.pathname !== ROUTES.ENROLL_ACCEPT && url.pathname !== ROUTES.ORG_ADMIN_ACCEPT) {
      setInviteError('This is not an organization invitation link.');
      return;
    }
    const token = url.searchParams.get('token')?.trim() ?? '';
    if (!token) {
      setInviteError('This invitation link is missing its token.');
      return;
    }

    closeInvite();
    onAfterSwitch?.();
    navigate(`${url.pathname}?token=${encodeURIComponent(token)}`);
  };

  let activeLabel = 'Personal';
  if (activeKind === 'org') {
    activeLabel = activeOrgMembership?.organizationName ?? 'Organization';
  } else if (activeKind === 'class') {
    activeLabel = selectedClass?.className ?? 'My class';
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
      ? 'flex max-w-48 cursor-pointer items-center gap-2 rounded-lg bg-transparent px-3 py-1.5 text-xs text-card-foreground transition-colors hover:bg-surface-hover'
      : isCollapsed
        ? 'mx-auto flex size-10 cursor-pointer items-center justify-center rounded-lg bg-transparent text-card-foreground transition-colors hover:bg-surface-hover'
        : 'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg bg-transparent px-3 py-2 text-xs text-card-foreground transition-colors hover:bg-surface-hover';

  const createOrgErrors = createOrgForm.formState.errors;

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={triggerClassName}
            aria-label={`Switch workspace. Current: ${activeLabel}`}
            title={activeLabel}
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
            className="z-(--z-dropdown) min-w-72 rounded-xl border border-border bg-card p-1.5 text-card-foreground shadow-xl"
          >
            <WorkspaceItem
              icon="dashboard"
              label="Personal"
              active={activeKind === 'personal'}
              disabled={switchingOrgId !== null}
              onSelect={() => switchTo(ROUTES.DASHBOARD)}
            />

            {membershipsQuery.isError ? (
              <WorkspaceAction
                icon="refresh"
                label="Could not load organizations. Retry"
                onSelect={() => void membershipsQuery.refetch()}
              />
            ) : null}

            {orgMemberships.map((membership) => (
              <WorkspaceItem
                key={membership.organizationId}
                icon="organization"
                label={membership.organizationName}
                trailing={membership.role === 'org_admin' ? 'Admin' : 'Professor'}
                active={activeKind === 'org' && membership.isPrimary}
                pending={switchingOrgId === membership.organizationId}
                disabled={switchingOrgId !== null}
                onSelect={() => void handleSwitchOrg(membership)}
              />
            ))}

            {myClasses.map((entry) => (
              <WorkspaceItem
                key={entry.classId}
                icon="my-class"
                label={entry.className}
                active={activeKind === 'class' && selectedClass?.classId === entry.classId}
                disabled={switchingOrgId !== null}
                onSelect={() => switchTo(`${ROUTES.STUDENT_MY_CLASS}?classId=${entry.classId}`)}
              />
            ))}

            {canJoinClass ? (
              <WorkspaceAction
                icon="my-class"
                label="Join class with code"
                onSelect={() => setIsJoinClassOpen(true)}
              />
            ) : null}

            <WorkspaceAction
              icon="link"
              label="Join with invite link"
              onSelect={() => setIsInviteOpen(true)}
            />

            {canCreateOrg ? (
              <WorkspaceAction
                icon="organization"
                label={
                  orgMemberships.length > 0 ? 'Create another organization' : 'Create organization'
                }
                onSelect={() => setIsCreateOrgOpen(true)}
              />
            ) : null}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Modal open={isJoinClassOpen} onClose={closeJoinClass} title="Join a class">
        <form onSubmit={handleJoinClass} className="space-y-4">
          <Input
            label="Class code"
            placeholder="e.g. A7K2M9QX"
            maxLength={12}
            value={classCode}
            error={classCodeError ?? undefined}
            onChange={(event) => {
              setClassCodeError(null);
              setClassCode(event.target.value.toUpperCase());
            }}
            autoFocus
            required
          />

          <div className="modal-panel__actions">
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

      <Modal open={isInviteOpen} onClose={closeInvite} title="Join with invite link">
        <form onSubmit={handleJoinWithLink} className="space-y-4">
          <Input
            label="Invitation link"
            placeholder="Paste the link from your invitation email"
            value={inviteLink}
            error={inviteError ?? undefined}
            onChange={(event) => {
              setInviteError(null);
              setInviteLink(event.target.value);
            }}
            autoFocus
            required
          />

          <div className="modal-panel__actions">
            <Button type="button" variant="secondary" size="sm" onClick={closeInvite}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Continue
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={isCreateOrgOpen} onClose={closeCreateOrg} title="Create organization">
        <form
          onSubmit={createOrgForm.handleSubmit(handleCreateOrg)}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Organization name"
            placeholder="e.g. FAST NUCES Computer Science"
            error={createOrgErrors.name?.message}
            {...createOrgForm.register('name', {
              onChange: (event: { target: { value: string } }) => {
                if (!slugTouched) {
                  createOrgForm.setValue('slug', slugify(event.target.value));
                }
              },
            })}
          />

          <Input
            label="Organization slug"
            placeholder="e.g. fast-nuces"
            error={createOrgErrors.slug?.message}
            {...createOrgForm.register('slug', {
              onChange: (event: { target: { value: string } }) => {
                setSlugTouched(true);
                createOrgForm.setValue('slug', slugify(event.target.value));
              },
            })}
          />

          <Input
            label="Industry or field (optional)"
            placeholder="e.g. Higher education"
            error={createOrgErrors.industry?.message}
            {...createOrgForm.register('industry')}
          />

          <Input
            label="Description (optional)"
            placeholder="A short description of your organization"
            error={createOrgErrors.description?.message}
            {...createOrgForm.register('description')}
          />

          <FieldError message={createOrgErrors.root?.message} />

          <div className="modal-panel__actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={closeCreateOrg}
              disabled={createOrgForm.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createOrgForm.formState.isSubmitting}
            >
              Create organization
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default WorkspaceSwitcher;
