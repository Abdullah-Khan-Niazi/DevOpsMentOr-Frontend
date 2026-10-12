import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  toast,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAdminOrganizations, useCreateOrganization } from '../hooks';
import type { CreateOrgPayload } from '../hooks';

const PAGE_SIZE = 15;

const EMPTY_FORM: CreateOrgPayload = {
  name: '',
  slug: '',
  description: '',
  website: '',
  industry: '',
  billingEmail: '',
};

/** F3 contract §09 SCR-F3-01: platform-admin organization management (ORG-01/02). */
export function AdminOrganizationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest');
  const [billingFilter, setBillingFilter] = useState<'all' | 'with_billing' | 'without_billing'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '30d' | '90d' | '1y'>('all');
  const [page, setPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => searchParams.get('create') === 'true');
  const create = useCreateOrganization();
  const [form, setForm] = useState<CreateOrgPayload>(EMPTY_FORM);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = draft.trim();
      if (trimmed !== search && (trimmed.length === 0 || trimmed.length >= 2)) {
        setSearch(trimmed);
        setPage(1);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, search]);

  const { data, isLoading, isError, error, refetch } = useAdminOrganizations({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const openCreateDrawer = () => {
    setForm(EMPTY_FORM);
    setIsDrawerOpen(true);
  };

  const closeCreateDrawer = () => {
    setIsDrawerOpen(false);
    if (searchParams.get('create')) {
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
  };

  const submitCreate = () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Name and slug are required.');
      return;
    }
    create.mutate(
      {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description?.trim() || undefined,
        website: form.website?.trim() || undefined,
        industry: form.industry?.trim() || undefined,
        billingEmail: form.billingEmail?.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Organization created.');
          closeCreateDrawer();
          setPage(1);
          void refetch();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  // Filter organizations client-side with rich multi-criteria and sorting
  const filteredOrgs = useMemo(() => {
    if (!data?.data) return [];
    let list = [...data.data];

    if (selectedIndustry !== 'all') {
      list = list.filter((org) => org.industry?.toLowerCase() === selectedIndustry.toLowerCase());
    }

    if (billingFilter === 'with_billing') {
      list = list.filter((org) => !!org.billingEmail && org.billingEmail.trim().length > 0);
    } else if (billingFilter === 'without_billing') {
      list = list.filter((org) => !org.billingEmail || org.billingEmail.trim().length === 0);
    }

    if (timeFilter !== 'all') {
      const now = Date.now();
      const cutoffDays = timeFilter === '30d' ? 30 : timeFilter === '90d' ? 90 : 365;
      const cutoffTime = now - cutoffDays * 86_400_000;
      list = list.filter((org) => new Date(org.createdAt).getTime() >= cutoffTime);
    }

    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      return 0;
    });

    return list;
  }, [data?.data, selectedIndustry, billingFilter, timeFilter, sortBy]);

  // Unique industries for filter dropdown
  const availableIndustries = useMemo(() => {
    if (!data?.data) return [];
    const set = new Set<string>();
    data.data.forEach((org) => {
      if (org.industry) set.add(org.industry);
    });
    return Array.from(set);
  }, [data?.data]);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title="Organizations"
        actions={
          <Button variant="primary" size="sm" onClick={openCreateDrawer}>
            + New Organization
          </Button>
        }
      />

      <Card>
        <div className="mb-4 flex items-center gap-1.5 w-full">
          <input
            id="org-search"
            className="filter-input flex-1 min-w-0 transition-colors focus:border-accent"
            placeholder="Search name or slug…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          <select
            id="org-industry-filter"
            className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
          >
            <option value="all">All Industries</option>
            {availableIndustries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>

          <select
            id="org-sort-filter"
            className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>

          <select
            id="org-billing-filter"
            className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
            value={billingFilter}
            onChange={(e) => setBillingFilter(e.target.value as any)}
          >
            <option value="all">All Contacts</option>
            <option value="with_billing">Has Billing</option>
            <option value="without_billing">No Billing</option>
          </select>

          <select
            id="org-time-filter"
            className="filter-input flex-initial min-w-0 transition-colors focus:border-accent"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
          >
            <option value="all">All Time</option>
            <option value="30d">Past 30D</option>
            <option value="90d">Past 90D</option>
            <option value="1y">Past 1Y</option>
          </select>

          {(draft || search || selectedIndustry !== 'all' || sortBy !== 'newest' || billingFilter !== 'all' || timeFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] rounded-none px-2 shrink-0 transition-transform active:scale-[0.98]"
              style={{ borderRadius: 0 }}
              onClick={() => {
                setDraft('');
                setSearch('');
                setSelectedIndustry('all');
                setSortBy('newest');
                setBillingFilter('all');
                setTimeFilter('all');
                setPage(1);
              }}
            >
              Reset
            </Button>
          )}
        </div>

        {isError ? (
          <ErrorState
            message={error?.message ?? 'Unable to load organizations.'}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <p className="py-6 text-sm text-muted">Loading organizations…</p>
        ) : filteredOrgs.length === 0 ? (
          <EmptyState
            title={search || selectedIndustry !== 'all' ? 'No matching organizations' : 'No organizations yet'}
            description={
              search || selectedIndustry !== 'all'
                ? 'Try a different search term or filter.'
                : 'Create the first organization to get started.'
            }
            action={!search && selectedIndustry === 'all' ? <Button onClick={openCreateDrawer}>New organization</Button> : undefined}
          />
        ) : (
          <>
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Organization</th>
                  <th className="px-3 py-2 font-medium">Slug</th>
                  <th className="px-3 py-2 font-medium">Industry</th>
                  <th className="px-3 py-2 font-medium text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((org) => (
                  <tr
                    key={org.organizationId}
                    onClick={() =>
                      navigate(
                        ROUTES.ADMIN_ORGANIZATION_DETAIL.replace(
                          ':orgId',
                          String(org.organizationId),
                        ),
                      )
                    }
                    className="border-b border-border/60 last:border-0 hover:bg-surface/80 active:bg-surface-hover/60 cursor-pointer transition-colors group"
                  >
                    <td className="px-3 py-3">
                      <div className="font-medium text-card-foreground group-hover:text-brand-600 transition-colors">
                        {org.name}
                      </div>
                      {org.billingEmail ? (
                        <div className="text-xs text-muted">{org.billingEmail}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{org.slug}</td>
                    <td className="px-3 py-3 text-muted-foreground">{org.industry ?? '-'}</td>
                    <td className="px-3 py-3 text-muted-foreground text-right tabular-nums">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {data ? (
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </Card>

      {/* Right Slide-Over Drawer for New Organization */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={closeCreateDrawer}
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground">New Organization</h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreateDrawer}
                    className="p-1.5 text-muted hover:text-card-foreground transition-colors"
                    aria-label="Close drawer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Organization name"
                    placeholder="e.g. Acme University"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                      setForm({
                        ...form,
                        name,
                        slug:
                          form.slug === '' ||
                          form.slug === form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                            ? slug
                            : form.slug,
                      });
                    }}
                    required
                  />
                  <Input
                    label="URL slug"
                    placeholder="e.g. acme-university"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    hint="Unique lowercase identifier used in platform workspaces."
                    required
                  />
                  <div>
                    <label htmlFor="drawer-org-desc" className="input-label">
                      Description
                    </label>
                    <textarea
                      id="drawer-org-desc"
                      rows={3}
                      className="input-field w-full"
                      placeholder="Brief description of the tenant or department…"
                      value={form.description ?? ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Website"
                      placeholder="https://acme.edu"
                      value={form.website ?? ''}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                    />
                    <Input
                      label="Industry"
                      placeholder="Higher Education, Enterprise"
                      value={form.industry ?? ''}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Billing email"
                    type="email"
                    placeholder="finance@acme.edu"
                    value={form.billingEmail ?? ''}
                    onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-6">
                <Button variant="secondary" onClick={closeCreateDrawer}>
                  Cancel
                </Button>
                <Button onClick={submitCreate} isLoading={create.isPending}>
                  Create organization
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrganizationsPage;
