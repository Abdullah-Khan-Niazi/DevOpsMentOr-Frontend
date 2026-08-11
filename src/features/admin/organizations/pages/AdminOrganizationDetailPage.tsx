import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  toast,
} from '@/shared/components';
import type { OrgAdminDetailDto } from '@/features/org/types';
import { useAdminOrganizationDetail } from '../hooks';
import type { UpdateOrgPayload } from '../hooks';

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

/** F3 contract §09 SCR-F3-02: editable org detail + admin assignment (ORG-03/04/05). */
export function OrgDetailForm({
  org,
  onSave,
  onAssign,
  savePending,
  assignPending,
}: OrgDetailFormProps) {
  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description ?? '');
  const [website, setWebsite] = useState(org.website ?? '');
  const [industry, setIndustry] = useState(org.industry ?? '');
  const [billingEmail, setBillingEmail] = useState(org.billingEmail ?? '');
  const [adminUserId, setAdminUserId] = useState('');

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

  const assign = () => {
    const userId = Number(adminUserId);
    if (!Number.isFinite(userId) || userId <= 0) {
      toast.error('Enter a valid user ID.');
      return;
    }
    onAssign(userId, {
      onSuccess: () => {
        toast.success('Organization admin assigned.');
        setAdminUserId('');
      },
      onError: (error) => toast.error(error.message ?? 'Assignment failed.'),
    });
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={org.name}
        description={`Slug: ${org.slug} · Created ${new Date(org.createdAt).toLocaleDateString()}`}
      />

      <Card className="space-y-4 p-6">
        <h3 className="font-medium text-slate-900">Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </div>
        <div>
          <label htmlFor="org-admin-desc" className="input-label">
            Description
          </label>
          <textarea
            id="org-admin-desc"
            rows={3}
            className="input-field w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <Input
            label="Billing email"
            type="email"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={saveDetails} isLoading={savePending}>
            Save details
          </Button>
        </div>
      </Card>

      <Card className="mt-4 space-y-4 p-6">
        <div>
          <h3 className="font-medium text-slate-900">Organization admin</h3>
          <p className="mt-1 text-sm text-muted">
            {org.adminUserId && org.adminEmail
              ? `Currently: ${org.adminEmail} (user #${org.adminUserId})`
              : 'No organization admin assigned yet.'}
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="grow">
            <Input
              label="User ID"
              type="number"
              placeholder="Assign admin by user ID"
              value={adminUserId}
              onChange={(e) => setAdminUserId(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={assign} isLoading={assignPending}>
            Assign
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Platform admin org detail page (contract SCR-F3-02). */
export function AdminOrganizationDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { query, update, assignAdmin } = useAdminOrganizationDetail(orgId);

  if (query.isLoading || !query.data) {
    return (
      <div>
        <PageHeader title="Organization" />
        <LoadingState label="Loading organization…" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div>
        <PageHeader title="Organization" />
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
