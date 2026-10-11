import { useState, useMemo } from 'react';
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
  const [page, setPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => searchParams.get('create') === 'true');
  const create = useCreateOrganization();
  const [form, setForm] = useState<CreateOrgPayload>(EMPTY_FORM);

  const { data, isLoading, isError, error, refetch } = useAdminOrganizations({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const applySearch = () => {
    const term = draft.trim();
    if (term.length === 1) {
      toast.info('Search needs at least 2 characters.');
      return;
    }
    setSearch(term);
    setPage(1);
    void refetch();
  };

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

  // Filter organizations client-side if industry filter is active
  const filteredOrgs = useMemo(() => {
    if (!data?.data) return [];
    if (selectedIndustry === 'all') return data.data;
    return data.data.filter((org) => org.industry?.toLowerCase() === selectedIndustry.toLowerCase());
  }, [data?.data, selectedIndustry]);

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
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        actions={
          <Button variant="primary" size="sm" onClick={openCreateDrawer}>
            + New Organization
          </Button>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="org-search" className="input-label">
              Search
            </label>
            <input
              id="org-search"
              className="input-field w-64"
              placeholder="Name or slug…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
            />
          </div>

          <div>
            <label htmlFor="org-industry-filter" className="input-label">
              Industry
            </label>
            <select
              id="org-industry-filter"
              className="input-field"
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
          </div>

          <Button variant="primary" size="sm" onClick={applySearch}>
            Apply
          </Button>
          {(search || selectedIndustry !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft('');
                setSearch('');
                setSelectedIndustry('all');
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
                    className="border-b border-border/60 last:border-0 hover:bg-surface/80 cursor-pointer transition-colors group"
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
                    <p className="text-xs text-muted mt-0.5">
                      Provision a new institutional tenant workspace.
                    </p>
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
