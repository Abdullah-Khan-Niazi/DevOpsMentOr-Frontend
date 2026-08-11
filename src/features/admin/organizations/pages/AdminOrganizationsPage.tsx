import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
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
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
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

  const openModal = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
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
          setModalOpen(false);
          setPage(1);
          void refetch();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="All organizations on the platform. Create new ones and manage their admins."
        actions={<Button onClick={openModal}>Create organization</Button>}
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
          <button
            type="button"
            onClick={applySearch}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Apply
          </button>
        </div>

        {isError ? (
          <ErrorState
            message={error?.message ?? 'Unable to load organizations.'}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <p className="py-6 text-sm text-slate-500">Loading organizations…</p>
        ) : data && data.data.length === 0 ? (
          <EmptyState
            title={search ? 'No matching organizations' : 'No organizations yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Create the first organization to get started.'
            }
            action={!search ? <Button onClick={openModal}>Create organization</Button> : undefined}
          />
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Organization</th>
                  <th className="px-3 py-2 font-medium">Slug</th>
                  <th className="px-3 py-2 font-medium">Industry</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((org) => (
                  <tr
                    key={org.organizationId}
                    className="border-b border-border/60 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-900">{org.name}</div>
                      {org.billingEmail ? (
                        <div className="text-xs text-slate-500">{org.billingEmail}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{org.slug}</td>
                    <td className="px-3 py-2.5 text-slate-600">{org.industry ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        to={ROUTES.ADMIN_ORGANIZATION_DETAIL.replace(
                          ':orgId',
                          String(org.organizationId),
                        )}
                        className="inline-block rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                      >
                        Manage
                      </Link>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create organization">
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            hint="Lowercase letters, digits and hyphens. Used in URLs."
            required
          />
          <div>
            <label htmlFor="org-create-desc" className="input-label">
              Description
            </label>
            <textarea
              id="org-create-desc"
              rows={3}
              className="input-field w-full"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Website"
              value={form.website ?? ''}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
            <Input
              label="Industry"
              value={form.industry ?? ''}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </div>
          <Input
            label="Billing email"
            type="email"
            value={form.billingEmail ?? ''}
            onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
          />
          <div className="modal-panel__actions">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreate} isLoading={create.isPending}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminOrganizationsPage;
