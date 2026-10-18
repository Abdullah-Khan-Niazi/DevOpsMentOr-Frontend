import { useState, useRef } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  DetailFormSkeleton,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  TabRow,
  type TabItem,
  toast,
} from '@/shared/components';
import type { OrgAdminDetailDto } from '@/features/org/types';
import { useAdminOrganizationDetail } from '../hooks';
import type { UpdateOrgPayload } from '../hooks';
import { adminOrgService } from '../services';
import { adminService } from '../../services';
import { useAdminUsers } from '../../hooks';
import type { AdminUserListItem } from '../../types';
import { ROUTES } from '@/shared/constants';

interface FormHelpers {
  onSuccess: () => void;
  onError: (error: { message?: string }) => void;
}

interface OrgDetailFormProps {
  org: OrgAdminDetailDto;
  onSave: (payload: UpdateOrgPayload, helpers: FormHelpers) => void;
  onAssign: (userId: number, helpers: FormHelpers) => void;
  savePending: boolean;
  assignPending: boolean;
}

const TABS: TabItem[] = [
  { id: 'details', label: 'Organization Details' },
  { id: 'leadership', label: 'Leadership & Admins' },
  { id: 'cohorts', label: 'Workspaces & Classes' },
  { id: 'analytics', label: 'Organization Analytics' },
];

/** F3 contract §09 SCR-F3-02: editable org detail + admin assignment (ORG-03/04/05). */
export function OrgDetailForm({
  org,
  onSave,
  onAssign,
  savePending,
  assignPending,
}: OrgDetailFormProps) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const locationState = location.state as {
    activeTab?: string;
    selectedClassId?: number;
  } | undefined;

  const initialTab = searchParams.get('tab') || locationState?.activeTab || 'details';
  const initialClassId = searchParams.get('classId')
    ? Number(searchParams.get('classId'))
    : (locationState?.selectedClassId ?? null);

  const [activeTab, setActiveTabState] = useState(initialTab);
  const [selectedClassId, setSelectedClassIdState] = useState<number | null>(initialClassId);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        if (tab !== 'cohorts') next.delete('classId');
        return next;
      },
      { replace: true },
    );
  };

  const setSelectedClassId = (clsId: number | null) => {
    setSelectedClassIdState(clsId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (clsId !== null) {
          next.set('classId', String(clsId));
          next.set('tab', 'cohorts');
        } else {
          next.delete('classId');
        }
        return next;
      },
      { replace: true },
    );
  };

  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description ?? '');
  const [website, setWebsite] = useState(org.website ?? '');
  const [industry, setIndustry] = useState(org.industry ?? '');
  const [billingEmail, setBillingEmail] = useState(org.billingEmail ?? '');

  // Admin selector state
  const [adminMode, setAdminMode] = useState<'search' | 'email'>('search');
  const [userSearch, setUserSearch] = useState('');
  const [adminUserPage, setAdminUserPage] = useState(1);
  const ADMIN_USERS_PAGE_SIZE = 8;
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [pendingInviteSentTo, setPendingInviteSentTo] = useState<string | null>(null);

  // Org user invite drawer state
  const [isInviteDrawerOpen, setIsInviteDrawerOpen] = useState(false);
  const [drawerRole, setDrawerRole] = useState<'org_student' | 'professor' | 'org_admin'>('org_student');
  const [drawerEmails, setDrawerEmails] = useState('');
  const [isDrawerDraggingCsv, setIsDrawerDraggingCsv] = useState(false);
  const [drawerCsvParsedCount, setDrawerCsvParsedCount] = useState<number | null>(null);
  const drawerFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadSampleCsv = () => {
    const content =
      'email,role,fullName\n' +
      'student1@example.com,student,Alice Johnson\n' +
      'student2@example.com,student,Bob Martinez\n' +
      'prof1@example.com,professor,Dr. Mark Vance\n' +
      'admin1@example.com,admin,Elena Rostova\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sample_${org.slug}_members.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDrawerCsvFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const parsedEmails: string[] = [];

      for (const line of lines) {
        if (/^email\s*,/i.test(line)) continue;
        const parts = line.split(',');
        const emailCandidate = parts[0]?.trim();
        if (emailCandidate && /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(emailCandidate)) {
          parsedEmails.push(emailCandidate.toLowerCase());
        } else {
          const matches = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi) || [];
          for (const m of matches) parsedEmails.push(m.toLowerCase());
        }
      }

      const extracted = Array.from(new Set(parsedEmails));
      if (extracted.length === 0) {
        toast.error('No valid email addresses detected in CSV file.');
        return;
      }
      setDrawerEmails((prev) => {
        const existing = prev
          .split(/[\n,]+/)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        const combined = Array.from(new Set([...existing, ...extracted]));
        return combined.join('\n');
      });
      setDrawerCsvParsedCount(extracted.length);
      toast.success(`Loaded ${extracted.length} recipient email(s) from ${file.name}`);
    } catch {
      toast.error('Unable to parse CSV file.');
    }
  };

  const usersQuery = useAdminUsers(
    { page: adminUserPage, pageSize: ADMIN_USERS_PAGE_SIZE, search: userSearch.trim() || undefined, isActive: 'true' },
    activeTab === 'leadership',
  );

  // Fetch classes for this org
  const classesQuery = useQuery({
    queryKey: ['admin', 'org', org.organizationId, 'classes'],
    queryFn: () => adminOrgService.listClasses(org.organizationId),
    enabled: activeTab === 'cohorts',
  });

  // Fetch selected class cohort detail
  const classDetailQuery = useQuery({
    queryKey: ['admin', 'org', org.organizationId, 'class', selectedClassId],
    queryFn: () => adminOrgService.getClassDetail(org.organizationId, selectedClassId!),
    enabled: activeTab === 'cohorts' && selectedClassId !== null,
  });

  // Fetch analytics for this org
  const analyticsQuery = useQuery({
    queryKey: ['admin', 'org', org.organizationId, 'analytics'],
    queryFn: () => adminOrgService.getOrgAnalytics(org.organizationId),
    enabled: activeTab === 'analytics',
  });

  // Admin invitation mutation
  const inviteAdminMutation = useMutation({
    mutationFn: (target: string | number) => adminOrgService.inviteOrgAdmin(org.organizationId, target),
    onSuccess: (data) => {
      toast.success(`Admin invitation dispatched to ${data.email}. The user will become Organization Admin once they click the link.`);
      setPendingInviteSentTo(data.email);
      setSelectedUser(null);
      setInviteEmailInput('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'org', String(org.organizationId)] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? 'Failed to send admin invitation.');
    },
  });

  // Member invite mutation
  const inviteMembersMutation = useMutation({
    mutationFn: (payload: { emails: string[]; role: 'org_student' | 'professor' | 'org_admin' }) =>
      adminService.inviteUsers({
        emails: payload.emails,
        type: 'organization',
        organizationId: org.organizationId,
        role: payload.role,
      }),
    onSuccess: (res) => {
      toast.success(`Successfully dispatched ${res.sent} member invitation(s).`);
      setIsInviteDrawerOpen(false);
      setDrawerEmails('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'org', org.organizationId, 'analytics'] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? 'Failed to invite members.');
    },
  });

  const handleSendDrawerInvites = () => {
    const list = drawerEmails
      .split(/[\n,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes('@'));

    if (list.length === 0) {
      toast.error('Please enter at least one valid email address.');
      return;
    }

    inviteMembersMutation.mutate({ emails: list, role: drawerRole });
  };

  const saveDetails = () => {
    if (!name.trim()) {
      toast.error('Organization name is required.');
      return;
    }
    onSave(
      {
        name: name.trim(),
        description: description.trim() || null,
        website: website.trim() || null,
        industry: industry.trim() || null,
        billingEmail: billingEmail.trim() || null,
      },
      {
        onSuccess: () => toast.success('Organization updated.'),
        onError: (error) => toast.error(error.message ?? 'Update failed.'),
      },
    );
  };

  const handleSendAdminInvite = () => {
    if (adminMode === 'search') {
      if (!selectedUser) {
        toast.error('Select a user from the menu to send an invitation.');
        return;
      }
      inviteAdminMutation.mutate(selectedUser.userId);
    } else {
      const email = inviteEmailInput.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        toast.error('Please enter a valid email address.');
        return;
      }
      inviteAdminMutation.mutate(email);
    }
  };

  const assignDirect = () => {
    if (!selectedUser) {
      toast.error('Select a user to assign as Organization Admin.');
      return;
    }
    onAssign(selectedUser.userId, {
      onSuccess: () => {
        toast.success(`Assigned ${selectedUser.fullName ?? selectedUser.email} as Organization Admin directly.`);
        setSelectedUser(null);
        setUserSearch('');
      },
      onError: (error) => toast.error(error.message ?? 'Assignment failed.'),
    });
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title={org.name}
        backTo={ROUTES.ADMIN_ORGANIZATIONS}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setIsInviteDrawerOpen(true)}>
              + Invite Member(s)
            </Button>
          </div>
        }
      />

      <TabRow items={TABS} activeId={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Organization Details */}
      {activeTab === 'details' ? (
        <Card className="space-y-4 p-6 rounded-none">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <div>
              <label className="input-label">URL slug</label>
              <div className="input-field bg-surface text-muted cursor-not-allowed select-all rounded-none">
                {org.slug}
              </div>
              <p className="mt-1 text-xs text-muted">Immutable tenant workspace identifier.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <Input
            label="Billing email"
            type="email"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
          />
          <div>
            <label htmlFor="org-admin-desc" className="input-label">
              Description
            </label>
            <textarea
              id="org-admin-desc"
              rows={3}
              className="input-field w-full rounded-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={saveDetails} isLoading={savePending}>
              Save details
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Tab 2: Leadership & Admins */}
      {activeTab === 'leadership' ? (
        <div className="space-y-6">
          <Card className="p-6 rounded-none">
            <h3 className="text-base font-semibold text-card-foreground">Current Organization Admin</h3>
            <div className="mt-3 border border-border p-4 bg-surface rounded-none">
              {org.adminUserId && org.adminEmail ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium text-card-foreground">{org.adminEmail}</p>
                    <p className="text-xs text-muted">Platform User #{org.adminUserId}</p>
                  </div>
                  <span className="border border-border-strong bg-accent/10 px-2.5 py-1 text-xs font-medium text-card-foreground rounded-none">
                    Active Org Admin
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  No organization admin assigned yet. Dispatch an email invitation below to grant administrative access.
                </p>
              )}
            </div>

            {pendingInviteSentTo && (
              <div className="mt-3 border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-900 rounded-none">
                <p className="font-semibold">Pending Invitation Sent</p>
                <p className="mt-0.5">
                  An email invitation link was dispatched to <span className="font-mono font-bold">{pendingInviteSentTo}</span>. The user will be automatically assigned as Organization Admin upon clicking the link.
                </p>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4 rounded-none">
            <div>
              <h3 className="text-base font-semibold text-card-foreground">
                {org.adminUserId ? 'Reassign / Transfer Admin' : 'Assign Organization Admin'}
              </h3>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <button
                type="button"
                onClick={() => {
                  setAdminMode('search');
                  setSelectedUser(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors rounded-none ${
                  adminMode === 'search'
                    ? 'border-brand-600 bg-brand-50/20 text-brand-600 font-bold'
                    : 'border-border text-muted hover:text-card-foreground'
                }`}
              >
                Select Registered User
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminMode('email');
                  setSelectedUser(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors rounded-none ${
                  adminMode === 'email'
                    ? 'border-brand-600 bg-brand-50/20 text-brand-600 font-bold'
                    : 'border-border text-muted hover:text-card-foreground'
                }`}
              >
                Invite via Email Directly
              </button>
            </div>

            {adminMode === 'email' ? (
              <div className="space-y-4 max-w-xl">
                <Input
                  label="Recipient Email Address"
                  type="email"
                  placeholder="admin@organization.edu"
                  value={inviteEmailInput}
                  onChange={(e) => setInviteEmailInput(e.target.value)}
                  hint="An email with a secure invitation link will be sent to this address."
                />
                <Button
                  variant="primary"
                  onClick={handleSendAdminInvite}
                  isLoading={inviteAdminMutation.isPending}
                >
                  Send Admin Invitation Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-w-xl">
                {selectedUser && (
                  <div className="border border-border bg-surface p-4 rounded-none space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-medium text-card-foreground">
                          {selectedUser.fullName ?? selectedUser.username}
                        </p>
                        <p className="text-xs text-muted">
                          @{selectedUser.username} · {selectedUser.email} · User #{selectedUser.userId}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                          Clear
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSendAdminInvite}
                          isLoading={inviteAdminMutation.isPending}
                        >
                          Send Invitation Link
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={assignDirect}
                          isLoading={assignPending}
                          title="Direct bypass without email confirmation"
                        >
                          Direct Assign
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted">
                      Clicking "Send Invitation Link" dispatches an email with a secure link. Once the user clicks the link, they are automatically designated as the Organization Admin.
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="admin-filter-input" className="input-label">
                    Filter Registered Users
                  </label>
                  <input
                    id="admin-filter-input"
                    className="input-field w-full mt-1 rounded-none"
                    placeholder="Type name, username or email to filter list…"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setAdminUserPage(1);
                    }}
                  />
                </div>

                <div className="max-h-56 overflow-y-auto border border-border divide-y divide-border/60 bg-card rounded-none">
                  {usersQuery.isLoading ? (
                    <div className="p-3 text-center text-xs text-muted">Loading registered platform users…</div>
                  ) : (usersQuery.data?.data.length ?? 0) === 0 ? (
                    <div className="p-3 text-center text-xs text-muted">
                      No registered users found.
                    </div>
                  ) : (
                    usersQuery.data?.data.map((u) => {
                      const isSelected = selectedUser?.userId === u.userId;
                      return (
                        <button
                          key={u.userId}
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className={`w-full text-left px-3.5 py-3 transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer group rounded-none border-l-2 ${
                            isSelected
                              ? 'bg-accent/10 border-l-accent'
                              : 'border-l-transparent hover:bg-surface-hover hover:border-l-border-strong active:bg-surface-active'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-mono font-medium truncate ${
                                isSelected ? 'text-accent font-bold' : 'text-card-foreground group-hover:text-accent transition-colors'
                              }`}
                            >
                              {u.fullName ?? u.username}
                            </p>
                            <p className="text-[11px] font-mono text-muted truncate">
                              @{u.username} · {u.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0 text-xs font-mono">
                            <span className="text-[11px] text-muted">#{u.userId}</span>
                            {isSelected ? (
                              <span className="text-accent font-bold text-xs">✓</span>
                            ) : (
                              <span className="text-muted/40 group-hover:text-muted transition-colors text-xs">→</span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {usersQuery.data && usersQuery.data.totalPages > 1 && (
                  <div className="pt-2">
                    <Pagination
                      page={adminUserPage}
                      pageSize={ADMIN_USERS_PAGE_SIZE}
                      total={usersQuery.data.total}
                      totalPages={usersQuery.data.totalPages}
                      onPageChange={setAdminUserPage}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* Tab 3: Workspaces & Classes */}
      {activeTab === 'cohorts' ? (
        selectedClassId !== null ? (
          <div className="space-y-6">
            {/* Back to Classes Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedClassId(null)}
                className="rounded-none flex items-center gap-1.5"
              >
                <span>←</span> Back to Classes
              </Button>
              {classDetailQuery.data?.detail && (
                <span className="font-mono text-xs text-muted">
                  Class #{classDetailQuery.data.detail.classId} · {classDetailQuery.data.detail.studentCount} student(s) enrolled
                </span>
              )}
            </div>

            {classDetailQuery.isLoading ? (
              <p className="py-6 text-sm text-muted">Loading class cohort details, students & telemetry…</p>
            ) : classDetailQuery.isError ? (
              <ErrorState
                message={classDetailQuery.error?.message ?? 'Failed to load class details.'}
                onRetry={() => void classDetailQuery.refetch()}
              />
            ) : classDetailQuery.data ? (
              <>
                {/* Class Header Card */}
                <Card className="p-5 rounded-none space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-bold text-card-foreground">
                        {classDetailQuery.data.detail.className}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-brand-600 bg-brand-50/20 px-2 py-0.5 border border-brand-200 rounded-none">
                          /{classDetailQuery.data.detail.slug}
                        </span>
                        <span className="text-xs text-muted">
                          Created {new Date(classDetailQuery.data.detail.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {classDetailQuery.data.detail.description && (
                        <p className="text-sm text-muted mt-2">
                          {classDetailQuery.data.detail.description}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs text-muted uppercase tracking-wider block">Roster Capacity</span>
                      <span className="text-lg font-mono font-bold text-card-foreground">
                        {classDetailQuery.data.detail.studentCount} / {classDetailQuery.data.detail.maxStudents}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Assigned Professor Card */}
                <Card className="p-5 rounded-none">
                  <div className="text-xs uppercase text-muted font-medium mb-2">Assigned Professor</div>
                  {classDetailQuery.data.professor ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border p-3 bg-surface rounded-none">
                      <div>
                        <p className="font-medium text-card-foreground">
                          {classDetailQuery.data.professor.fullName ?? classDetailQuery.data.professor.email}
                        </p>
                        <p className="text-xs text-muted font-mono">
                          {classDetailQuery.data.professor.email} · User #{classDetailQuery.data.professor.userId}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(ROUTES.ADMIN_USER_DETAIL.replace(':userId', String(classDetailQuery.data?.professor?.userId)), {
                            state: {
                              fromOrgId: org.organizationId,
                              fromTab: 'cohorts',
                              fromClassId: selectedClassId,
                            },
                          })
                        }
                        className="rounded-none text-xs"
                      >
                        View Professor Profile →
                      </Button>
                    </div>
                  ) : (
                    <div className="border border-border/80 p-3 bg-surface/50 text-xs text-muted rounded-none">
                      No instructor assigned to this class.
                    </div>
                  )}
                </Card>

                {/* Class Telemetry & Compute Resources */}
                <div>
                  <h5 className="text-xs uppercase font-medium text-muted tracking-wider mb-2">
                    Cohort Telemetry & Compute Resources
                  </h5>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4 rounded-none">
                      <span className="text-xs uppercase text-muted">Module Progression</span>
                      <p className="mt-1 text-2xl font-bold text-card-foreground">
                        {classDetailQuery.data.analytics.avgProgress}%
                      </p>
                      <div className="w-full bg-secondary h-1.5 mt-2 rounded-none">
                        <div
                          className="bg-brand-600 h-1.5 transition-all"
                          style={{ width: `${Math.min(100, classDetailQuery.data.analytics.avgProgress)}%` }}
                        />
                      </div>
                    </Card>

                    <Card className="p-4 rounded-none">
                      <span className="text-xs uppercase text-muted">Active Compute Pods</span>
                      <p className="mt-1 text-2xl font-bold text-card-foreground">
                        {classDetailQuery.data.analytics.activePods}
                      </p>
                      <p className="text-xs text-muted mt-1">Live sandbox containers</p>
                    </Card>

                    <Card className="p-4 rounded-none">
                      <span className="text-xs uppercase text-muted">RAM Consumption</span>
                      <p className="mt-1 text-2xl font-bold text-card-foreground">
                        {classDetailQuery.data.analytics.avgRam} GB
                      </p>
                      <p className="text-xs text-muted mt-1">Allocated memory</p>
                    </Card>

                    <Card className="p-4 rounded-none">
                      <span className="text-xs uppercase text-muted">CPU Compute Load</span>
                      <p className="mt-1 text-2xl font-bold text-card-foreground">
                        {classDetailQuery.data.analytics.avgCpu} Cores
                      </p>
                      <p className="text-xs text-muted mt-1">Allocated core usage</p>
                    </Card>
                  </div>
                </div>

                {/* Top Performing Student Leaderboard */}
                <Card className="p-5 rounded-none space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h5 className="text-sm font-semibold text-card-foreground">Top Performing Student Leaderboard</h5>
                      <p className="text-xs text-muted">Ranked by module completion, hands-on lab points, and total score.</p>
                    </div>
                    <span className="text-xs font-mono text-muted">{classDetailQuery.data.leaderboard.length} Ranked</span>
                  </div>

                  {classDetailQuery.data.leaderboard.length === 0 ? (
                    <p className="text-xs text-muted py-3">No student activities recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                            <th className="px-3 py-2 font-medium">Rank</th>
                            <th className="px-3 py-2 font-medium">Learner</th>
                            <th className="px-3 py-2 font-medium text-center">Modules</th>
                            <th className="px-3 py-2 font-medium text-center">Labs</th>
                            <th className="px-3 py-2 font-medium text-right">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classDetailQuery.data.leaderboard.map((student, idx) => (
                            <tr
                              key={student.userId}
                              onClick={() =>
                                navigate(ROUTES.ADMIN_USER_DETAIL.replace(':userId', String(student.userId)), {
                                  state: {
                                    fromOrgId: org.organizationId,
                                    fromTab: 'cohorts',
                                    fromClassId: selectedClassId,
                                  },
                                })
                              }
                              className="border-b border-border/60 last:border-0 hover:bg-surface/80 cursor-pointer transition-colors group"
                            >
                              <td className="px-3 py-3 font-mono text-xs font-bold text-muted-foreground">
                                #{idx + 1}
                              </td>
                              <td className="px-3 py-3">
                                <div className="font-medium text-card-foreground group-hover:text-brand-600 transition-colors">
                                  {student.fullName ?? student.email}
                                </div>
                                <div className="text-xs text-muted font-mono">{student.email}</div>
                              </td>
                              <td className="px-3 py-3 text-center text-xs font-mono">{student.completedModules}</td>
                              <td className="px-3 py-3 text-center text-xs font-mono">{student.completedLabs}</td>
                              <td className="px-3 py-3 text-right text-xs font-bold font-mono text-brand-600">
                                {student.totalScore} pts
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                {/* Enrolled Students Roster */}
                <Card className="p-5 rounded-none space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h5 className="text-sm font-semibold text-card-foreground">Enrolled Students Roster</h5>
                      <p className="text-xs text-muted">Complete roster for this class. Click any learner to inspect user governance and progress.</p>
                    </div>
                    <span className="text-xs font-mono text-muted">{classDetailQuery.data.roster.length} Enrolled</span>
                  </div>

                  {classDetailQuery.data.roster.length === 0 ? (
                    <p className="text-xs text-muted py-3">No students enrolled yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                            <th className="px-3 py-2 font-medium">Student Name</th>
                            <th className="px-3 py-2 font-medium">Email</th>
                            <th className="px-3 py-2 font-medium text-right">Enrolled Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classDetailQuery.data.roster.map((st) => (
                            <tr
                              key={st.userId}
                              onClick={() =>
                                navigate(ROUTES.ADMIN_USER_DETAIL.replace(':userId', String(st.userId)), {
                                  state: {
                                    fromOrgId: org.organizationId,
                                    fromTab: 'cohorts',
                                    fromClassId: selectedClassId,
                                  },
                                })
                              }
                              className="border-b border-border/60 last:border-0 hover:bg-surface/80 cursor-pointer transition-colors group"
                            >
                              <td className="px-3 py-3">
                                <div className="font-medium text-card-foreground group-hover:text-brand-600 transition-colors">
                                  {st.fullName ?? st.email}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-xs font-mono text-muted">{st.email}</td>
                              <td className="px-3 py-3 text-xs text-muted tabular-nums text-right">
                                {new Date(st.enrolledAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </>
            ) : null}
          </div>
        ) : (
          <Card className="p-6 space-y-4 rounded-none">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="text-base font-semibold text-card-foreground">Workspaces & Class Rosters</h3>
              </div>
            </div>

            {classesQuery.isLoading ? (
              <p className="py-6 text-sm text-muted">Loading classes and rosters…</p>
            ) : classesQuery.isError ? (
              <ErrorState
                message={classesQuery.error?.message ?? 'Unable to load classes.'}
                onRetry={() => void classesQuery.refetch()}
              />
            ) : (classesQuery.data?.data.length ?? 0) === 0 ? (
              <EmptyState
                title="No classes provisioned yet"
                description="No classes or cohort workspaces have been created for this organization."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                      <th className="px-3 py-2 font-medium">Class Name</th>
                      <th className="px-3 py-2 font-medium">Slug</th>
                      <th className="px-3 py-2 font-medium">Professor</th>
                      <th className="px-3 py-2 font-medium">Roster Capacity</th>
                      <th className="px-3 py-2 font-medium text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classesQuery.data?.data.map((cls) => (
                      <tr
                        key={cls.classId}
                        onClick={() => setSelectedClassId(cls.classId)}
                        className="border-b border-border/60 last:border-0 hover:bg-surface/80 cursor-pointer transition-colors group"
                      >
                        <td className="px-3 py-3">
                          <div className="font-medium text-card-foreground group-hover:text-brand-600 transition-colors">
                            {cls.className}
                          </div>
                          {cls.description && <div className="text-xs text-muted">{cls.description}</div>}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{cls.slug}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {cls.professorName ?? 'Unassigned'}
                        </td>
                        <td className="px-3 py-3">
                          <span className="tabular-nums font-mono text-xs">
                            {cls.studentCount} / {cls.maxStudents}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground text-right text-xs tabular-nums">
                          {new Date(cls.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )
      ) : null}

      {/* Tab 4: Organization Analytics */}
      {activeTab === 'analytics' ? (
        <div className="space-y-6">
          {analyticsQuery.isLoading ? (
            <p className="py-6 text-sm text-muted">Calculating organization analytics & telemetry…</p>
          ) : analyticsQuery.isError ? (
            <ErrorState
              message={analyticsQuery.error?.message ?? 'Unable to load analytics.'}
              onRetry={() => void analyticsQuery.refetch()}
            />
          ) : (
            <>
              {/* Top Row KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4 rounded-none">
                  <span className="text-xs uppercase text-muted">Revenue & Payments</span>
                  <p className="mt-1 text-2xl font-bold text-card-foreground">
                    ${analyticsQuery.data?.revenue.totalRevenue.toLocaleString() ?? 0}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {analyticsQuery.data?.revenue.paidOrdersCount ?? 0} paid order(s) · {analyticsQuery.data?.revenue.subscriptionPlan} Plan
                  </p>
                </Card>

                <Card className="p-4 rounded-none">
                  <span className="text-xs uppercase text-muted">Total Learners & Staff</span>
                  <p className="mt-1 text-2xl font-bold text-card-foreground">
                    {analyticsQuery.data?.members.totalMembers ?? 0}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {analyticsQuery.data?.members.studentsCount ?? 0} Students · {analyticsQuery.data?.members.professorsCount ?? 0} Professors · {analyticsQuery.data?.members.adminsCount ?? 0} Admins
                  </p>
                </Card>

                <Card className="p-4 rounded-none">
                  <span className="text-xs uppercase text-muted">Daily Active Learners</span>
                  <p className="mt-1 text-2xl font-bold text-card-foreground">
                    {analyticsQuery.data?.dau.avgDau ?? 0}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Range: {analyticsQuery.data?.dau.minDau ?? 0} min · {analyticsQuery.data?.dau.maxDau ?? 0} peak
                  </p>
                </Card>

                <Card className="p-4 rounded-none">
                  <span className="text-xs uppercase text-muted">Active Lab Containers</span>
                  <p className="mt-1 text-2xl font-bold text-card-foreground">
                    {analyticsQuery.data?.compute.activePods ?? 0}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Avg RAM: {analyticsQuery.data?.compute.avgRam ?? 0} GB · Avg CPU: {analyticsQuery.data?.compute.avgCpu ?? 0} cores
                  </p>
                </Card>
              </div>

              {/* Curriculum Progress & Resource Consumption Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6 rounded-none space-y-4">
                  <h3 className="text-sm font-semibold text-card-foreground">Curriculum & Lab Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-muted">Module Completion Rate</span>
                        <span className="text-card-foreground font-bold">{analyticsQuery.data?.progress.avgModuleCompletionRate ?? 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary overflow-hidden rounded-none">
                        <div
                          className="h-full bg-brand-600 transition-all duration-300 rounded-none"
                          style={{ width: `${analyticsQuery.data?.progress.avgModuleCompletionRate ?? 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-muted">Lab Progression Rate</span>
                        <span className="text-card-foreground font-bold">{analyticsQuery.data?.progress.avgLabCompletionRate ?? 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary overflow-hidden rounded-none">
                        <div
                          className="h-full bg-cyan-600 transition-all duration-300 rounded-none"
                          style={{ width: `${analyticsQuery.data?.progress.avgLabCompletionRate ?? 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="border border-border p-3 bg-surface rounded-none">
                        <span className="text-[10px] uppercase text-muted">Completed Modules</span>
                        <p className="mt-1 text-lg font-bold text-card-foreground">
                          {analyticsQuery.data?.progress.totalModuleCompletions ?? 0}
                        </p>
                      </div>
                      <div className="border border-border p-3 bg-surface rounded-none">
                        <span className="text-[10px] uppercase text-muted">Completed Labs</span>
                        <p className="mt-1 text-lg font-bold text-card-foreground">
                          {analyticsQuery.data?.progress.totalLabCompletions ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 rounded-none space-y-4">
                  <h3 className="text-sm font-semibold text-card-foreground">Compute Resource Consumption</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-border p-4 bg-surface rounded-none">
                      <span className="text-xs font-medium text-muted">RAM Consumption</span>
                      <p className="mt-2 text-xl font-bold text-card-foreground">
                        {analyticsQuery.data?.compute.avgRam ?? 0} GB <span className="text-xs font-normal text-muted">avg</span>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Min: {analyticsQuery.data?.compute.minRam ?? 0} GB · Max: {analyticsQuery.data?.compute.maxRam ?? 0} GB
                      </p>
                    </div>

                    <div className="border border-border p-4 bg-surface rounded-none">
                      <span className="text-xs font-medium text-muted">CPU Allocation</span>
                      <p className="mt-2 text-xl font-bold text-card-foreground">
                        {analyticsQuery.data?.compute.avgCpu ?? 0} <span className="text-xs font-normal text-muted">cores avg</span>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Min: {analyticsQuery.data?.compute.minCpu ?? 0} · Max: {analyticsQuery.data?.compute.maxCpu ?? 0} cores
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 14-Day Activity Trend */}
              <Card className="p-6 rounded-none">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-card-foreground">14-Day Daily Active Learners</h3>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setIsInviteDrawerOpen(true)}>
                    + Invite More Learners
                  </Button>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 pt-2">
                  {analyticsQuery.data?.dau.dailyTrend.map((pt) => (
                    <div key={pt.date} className="flex flex-col items-center">
                      <div className="h-24 w-full flex items-end justify-center bg-secondary/30 p-1 rounded-none">
                        <div
                          className="w-full bg-brand-600 rounded-none transition-all duration-300"
                          style={{
                            height: `${Math.max(8, Math.min(100, (pt.activeUsers / Math.max(1, analyticsQuery.data?.dau.maxDau ?? 1)) * 100))}%`,
                          }}
                          title={`${pt.date}: ${pt.activeUsers} active learner(s), ${pt.labCompletions} lab completion(s)`}
                        />
                      </div>
                      <span className="mt-1 text-[10px] font-mono text-muted">{pt.date}</span>
                      <span className="text-[10px] font-bold text-card-foreground tabular-nums">{pt.activeUsers}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      ) : null}

      {/* Right Slide Drawer for Inviting Members to This Organization */}
      {isInviteDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsInviteDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-lg bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 rounded-none">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground">Invite to {org.name}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInviteDrawerOpen(false)}
                    className="p-1.5 text-muted hover:text-card-foreground transition-colors"
                    aria-label="Close drawer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="drawer-org-role" className="input-label">
                      Role in Organization
                    </label>
                    <select
                      id="drawer-org-role"
                      className="input-field w-full mt-1 rounded-none"
                      value={drawerRole}
                      onChange={(e) =>
                        setDrawerRole(e.target.value as 'org_student' | 'professor' | 'org_admin')
                      }
                    >
                      <option value="org_student">Student (org_student)</option>
                      <option value="professor">Professor (professor)</option>
                      <option value="org_admin">Organization Admin (org_admin)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="input-label mb-0">Import from CSV File</label>
                      <button
                        type="button"
                        onClick={handleDownloadSampleCsv}
                        className="text-xs font-mono text-brand-600 hover:underline cursor-pointer"
                      >
                        ↓ Download Sample CSV Template
                      </button>
                    </div>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDrawerDraggingCsv(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDrawerDraggingCsv(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDrawerDraggingCsv(false);
                        void handleDrawerCsvFile(e.dataTransfer.files);
                      }}
                      onClick={() => drawerFileInputRef.current?.click()}
                      className={`mt-1 border border-dashed p-3 text-center cursor-pointer transition-colors rounded-none ${
                        isDrawerDraggingCsv
                          ? 'border-brand-600 bg-brand-50/20'
                          : 'border-border bg-surface/50 hover:bg-surface'
                      }`}
                    >
                      <input
                        ref={drawerFileInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => void handleDrawerCsvFile(e.target.files)}
                      />
                      <div className="text-xs font-medium text-card-foreground">
                        Drag & drop a CSV file here, or{' '}
                        <span className="text-brand-600 underline">browse</span>
                      </div>
                      <div className="text-[11px] text-muted mt-0.5">
                        Accepts format: <span className="font-mono text-card-foreground">email,role,fullName</span> (roles: student, professor, admin) or plain list of emails.
                      </div>
                      {drawerCsvParsedCount !== null && (
                        <div className="mt-1.5 text-xs text-card-foreground font-mono font-medium">
                          ✓ Imported {drawerCsvParsedCount} email(s) from CSV
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="drawer-org-emails" className="input-label">
                      Email Address(es)
                    </label>
                    <textarea
                      id="drawer-org-emails"
                      rows={5}
                      className="input-field w-full mt-1 font-mono text-xs rounded-none"
                      placeholder={'student1@acme.edu\nstudent2@acme.edu, professor@acme.edu'}
                      value={drawerEmails}
                      onChange={(e) => setDrawerEmails(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-6">
                <Button variant="secondary" onClick={() => setIsInviteDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendDrawerInvites} isLoading={inviteMembersMutation.isPending}>
                  Send Invitations
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Platform admin org detail page (contract SCR-F3-02). */
export function AdminOrganizationDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { query, update, assignAdmin } = useAdminOrganizationDetail(orgId);

  if (query.isLoading || !query.data) {
    return <DetailFormSkeleton />;
  }

  if (query.isError) {
    return (
      <div>
        <PageHeader title="Organization" backTo={ROUTES.ADMIN_ORGANIZATIONS} />
        <ErrorState
          message={query.error?.message ?? 'Unable to load this organization.'}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const org = query.data;
  return (
    <OrgDetailForm
      key={org.organizationId}
      org={org}
      onSave={(payload, helpers) => update.mutate(payload, helpers)}
      onAssign={(userId, helpers) => assignAdmin.mutate(userId, helpers)}
      savePending={update.isPending}
      assignPending={assignAdmin.isPending}
    />
  );
}

export default AdminOrganizationDetailPage;
