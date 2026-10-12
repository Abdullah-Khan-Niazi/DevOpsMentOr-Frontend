import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Card, ErrorState, PageHeader, Pagination, toast } from '@/shared/components';
import { apiClient } from '@/shared/services';
import { useAdminUsers } from '../hooks';
import { useAdminOrganizations } from '../organizations/hooks';
import { adminService } from '../services';
import { AdminUserTable } from '../components/AdminUserTable';

const PAGE_SIZE = 25;

type StatusFilter = 'active' | 'inactive' | 'deleted' | 'banned' | 'all';

interface AppliedFilters {
  page: number;
  search: string;
  role: string;
  status: StatusFilter;
  organizationId?: number;
  country?: string;
}

interface CountryCatalogItem {
  countryId: number;
  countryCode: string;
  countryName: string;
}

export function AdminUsersPage() {
  const [draft, setDraft] = useState('');
  const [filters, setFilters] = useState<AppliedFilters>({
    page: 1,
    search: '',
    role: '',
    status: 'active',
    organizationId: undefined,
    country: undefined,
  });

  // Slide drawer state for user invitations
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteType, setInviteType] = useState<'individual_learner' | 'organization'>('individual_learner');
  const [inviteOrgId, setInviteOrgId] = useState<number | undefined>(undefined);
  const [inviteRole, setInviteRole] = useState<'individual_learner' | 'org_admin' | 'professor' | 'org_student'>('individual_learner');
  const [inviteEmails, setInviteEmails] = useState('');
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const [csvParsedCount, setCsvParsedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    link.setAttribute('download', 'sample_user_invites.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvFile = async (files: FileList | null) => {
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
      setInviteEmails((prev) => {
        const existing = prev
          .split(/[\n,]+/)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        const combined = Array.from(new Set([...existing, ...extracted]));
        return combined.join('\n');
      });
      setCsvParsedCount(extracted.length);
      toast.success(`Loaded ${extracted.length} recipient email(s) from ${file.name}`);
    } catch {
      toast.error('Unable to parse CSV file.');
    }
  };

  // Fetch organizations for filter dropdown and invite modal
  const { data: orgsData } = useAdminOrganizations({ page: 1, pageSize: 100 });

  // Fetch countries catalog for filter dropdown
  const [countries, setCountries] = useState<CountryCatalogItem[]>([]);
  useEffect(() => {
    apiClient
      .get<{ data: CountryCatalogItem[] }>('/countries')
      .then((res) => {
        if (res.data?.data) {
          setCountries(res.data.data);
        }
      })
      .catch(() => undefined);
  }, []);

  const queryParams = {
    page: filters.page,
    pageSize: PAGE_SIZE,
    search: filters.search || undefined,
    role: filters.role || undefined,
    organizationId: filters.organizationId,
    country: filters.country || undefined,
    isActive:
      filters.status === 'active'
        ? ('true' as const)
        : filters.status === 'inactive'
          ? ('false' as const)
          : undefined,
    isBanned:
      filters.status === 'banned'
        ? ('true' as const)
        : filters.status === 'active'
          ? ('false' as const)
          : undefined,
    isDeleted:
      filters.status === 'deleted'
        ? ('true' as const)
        : filters.status === 'all'
          ? undefined
          : ('false' as const),
  };

  const { data, isLoading, isError, error, refetch } = useAdminUsers(queryParams);

  const inviteMutation = useMutation({
    mutationFn: (payload: {
      emails: string[];
      type: 'individual_learner' | 'organization';
      organizationId?: number;
      role: 'individual_learner' | 'org_admin' | 'professor' | 'org_student';
    }) => adminService.inviteUsers(payload),
    onSuccess: (res) => {
      toast.success(`Successfully dispatched ${res.sent} invitation(s).`);
      setIsInviteOpen(false);
      setInviteEmails('');
      void refetch();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? 'Failed to send invitations.');
    },
  });

  const handleSendInvites = () => {
    const rawList = inviteEmails
      .split(/[\n,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes('@'));

    if (rawList.length === 0) {
      toast.error('Please enter at least one valid email address.');
      return;
    }

    if (inviteType === 'organization' && !inviteOrgId) {
      toast.error('Please select an organization for this invite.');
      return;
    }

    inviteMutation.mutate({
      emails: rawList,
      type: inviteType,
      organizationId: inviteType === 'organization' ? inviteOrgId : undefined,
      role: inviteType === 'individual_learner' ? 'individual_learner' : inviteRole,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = draft.trim();
      if (trimmed !== filters.search && (trimmed.length === 0 || trimmed.length >= 2)) {
        setFilters((prev) => ({ ...prev, search: trimmed, page: 1 }));
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, filters.search]);

  const applyFilters = (next: Partial<AppliedFilters> & { page?: number }) => {
    const candidate = { ...filters, ...next };
    setFilters(candidate);
  };

  const resetFilters = () => {
    setDraft('');
    setFilters({
      page: 1,
      search: '',
      role: '',
      status: 'active',
      organizationId: undefined,
      country: undefined,
    });
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title="Users"
        actions={
          <Button variant="primary" size="sm" onClick={() => setIsInviteOpen(true)}>
            + Invite User(s)
          </Button>
        }
      />

      <Card>
        <div className="mb-4 flex items-center gap-1.5 w-full">
          <input
            id="admin-search"
            className="filter-input flex-1 min-w-0 transition-colors focus:border-accent"
            placeholder="Search name, username, email…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          <select
            id="admin-role"
            className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
            value={filters.role}
            onChange={(e) => applyFilters({ role: e.target.value, page: 1 })}
          >
            <option value="">All roles</option>
            <option value="individual_learner">Learner</option>
            <option value="org_admin">Org Admin</option>
            <option value="professor">Professor</option>
            <option value="org_student">Student</option>
            <option value="platform_admin">Platform Admin</option>
          </select>

          <select
            id="admin-org"
            className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
            value={filters.organizationId ?? ''}
            onChange={(e) =>
              applyFilters({
                organizationId: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
          >
            <option value="">All Orgs</option>
            {orgsData?.data.map((org) => (
              <option key={org.organizationId} value={org.organizationId}>
                {org.name}
              </option>
            ))}
          </select>

          <select
            id="admin-country"
            className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
            value={filters.country ?? ''}
            onChange={(e) =>
              applyFilters({
                country: e.target.value || undefined,
                page: 1,
              })
            }
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c.countryId} value={c.countryCode}>
                {c.countryName}
              </option>
            ))}
          </select>

          <select
            id="admin-status"
            className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
            value={filters.status}
            onChange={(e) =>
              applyFilters({ status: e.target.value as StatusFilter, page: 1 })
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deleted">Soft-deleted</option>
            <option value="banned">Banned</option>
            <option value="all">All statuses</option>
          </select>

          {(filters.search || filters.role || filters.organizationId || filters.country || filters.status !== 'active') && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-[11px] rounded-none px-2 shrink-0 transition-transform active:scale-[0.98]" style={{ borderRadius: 0 }}>
              Reset
            </Button>
          )}
        </div>

        {isError ? (
          <ErrorState
            message={error?.message ?? 'Unable to load users.'}
            onRetry={() => void refetch()}
          />
        ) : (
          <>
            <AdminUserTable
              users={data?.data ?? []}
              isLoading={isLoading}
            />
            {data ? (
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                totalPages={data.totalPages}
                onPageChange={(page) => applyFilters({ page })}
              />
            ) : null}
          </>
        )}
      </Card>

      {/* Right Slide-Over Drawer for Inviting User(s) */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsInviteOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 rounded-none">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground">Invite User(s)</h2>
                    <p className="text-xs text-muted mt-0.5">
                      Dispatch onboarding email invitations with roles.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
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
                    <label className="input-label">Learner Type</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setInviteType('individual_learner');
                          setInviteRole('individual_learner');
                        }}
                        className={`border p-3 text-left transition-colors rounded-none ${
                          inviteType === 'individual_learner'
                            ? 'border-brand-600 bg-brand-50/10 text-brand-600 font-semibold'
                            : 'border-border bg-surface text-card-foreground'
                        }`}
                      >
                        <div className="text-sm font-medium">Individual Learner</div>
                        <div className="text-xs text-muted mt-0.5">Self-directed platform user</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInviteType('organization');
                          setInviteRole('org_student');
                        }}
                        className={`border p-3 text-left transition-colors rounded-none ${
                          inviteType === 'organization'
                            ? 'border-brand-600 bg-brand-50/10 text-brand-600 font-semibold'
                            : 'border-border bg-surface text-card-foreground'
                        }`}
                      >
                        <div className="text-sm font-medium">Organization Member</div>
                        <div className="text-xs text-muted mt-0.5">Part of an institution / team</div>
                      </button>
                    </div>
                  </div>

                  {inviteType === 'organization' && (
                    <>
                      <div>
                        <label htmlFor="invite-org-select" className="input-label">
                          Organization
                        </label>
                        <select
                          id="invite-org-select"
                          className="input-field w-full mt-1"
                          value={inviteOrgId ?? ''}
                          onChange={(e) => setInviteOrgId(e.target.value ? Number(e.target.value) : undefined)}
                        >
                          <option value="">Select Organization…</option>
                          {orgsData?.data.map((org) => (
                            <option key={org.organizationId} value={org.organizationId}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="invite-role-select" className="input-label">
                          Assigned Role
                        </label>
                        <select
                          id="invite-role-select"
                          className="input-field w-full mt-1"
                          value={inviteRole}
                          onChange={(e) =>
                            setInviteRole(e.target.value as 'org_student' | 'org_admin' | 'professor')
                          }
                        >
                          <option value="org_student">Student (org_student)</option>
                          <option value="professor">Professor (professor)</option>
                          <option value="org_admin">Organization Admin (org_admin)</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="input-label mb-0">Import from CSV File</label>
                      <button
                        type="button"
                        onClick={handleDownloadSampleCsv}
                        className="text-xs font-mono text-brand-600 hover:underline cursor-pointer"
                      >
                        ↓ Download Sample CSV
                      </button>
                    </div>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingCsv(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingCsv(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingCsv(false);
                        void handleCsvFile(e.dataTransfer.files);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`mt-1 border border-dashed p-3 text-center cursor-pointer transition-colors rounded-none ${
                        isDraggingCsv
                          ? 'border-brand-600 bg-brand-50/20'
                          : 'border-border bg-surface/50 hover:bg-surface'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => void handleCsvFile(e.target.files)}
                      />
                      <div className="text-xs font-medium text-card-foreground">
                        Drag & drop a CSV file here, or{' '}
                        <span className="text-brand-600 underline">browse</span>
                      </div>
                      <div className="text-[11px] text-muted mt-0.5">
                        Accepts format: <span className="font-mono text-card-foreground">email,role,fullName</span> (roles: student, professor, admin) or list of emails.
                      </div>
                      {csvParsedCount !== null && (
                        <div className="mt-1.5 text-xs text-card-foreground font-semibold">
                          ✓ Imported {csvParsedCount} email(s) from CSV
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="invite-emails-area" className="input-label">
                      Email Address(es)
                    </label>
                    <textarea
                      id="invite-emails-area"
                      rows={4}
                      className="input-field w-full mt-1 font-mono text-xs rounded-none"
                      placeholder="student1@example.com&#10;student2@example.com, student3@example.com"
                      value={inviteEmails}
                      onChange={(e) => setInviteEmails(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-muted">
                      Separate multiple email addresses with commas or line breaks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-6">
                <Button variant="secondary" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendInvites} isLoading={inviteMutation.isPending}>
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

export default AdminUsersPage;
