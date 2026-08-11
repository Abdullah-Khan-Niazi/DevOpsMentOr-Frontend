import { useState } from 'react';
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  toast,
} from '@/shared/components';
import type { MyOrgDto } from '../types';
import { useMyOrg } from '../hooks';

interface FormHelpers {
  onSuccess: () => void;
  onError: (error: { message?: string }) => void;
}

interface OrgSettingsFormProps {
  org: MyOrgDto;
  onSaveWithHelpers: (
    payload: {
      name: string;
      description?: string | null;
      website?: string | null;
      industry?: string | null;
      billingEmail?: string | null;
    },
    helpers: FormHelpers,
  ) => void;
  onSaveDomain: (domain: string | null, helpers: FormHelpers) => void;
  savePending: boolean;
  domainPending: boolean;
}

function OrgSettingsForm({
  org,
  onSaveWithHelpers,
  onSaveDomain,
  savePending,
  domainPending,
}: OrgSettingsFormProps) {
  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description ?? '');
  const [website, setWebsite] = useState(org.website ?? '');
  const [industry, setIndustry] = useState(org.industry ?? '');
  const [billingEmail, setBillingEmail] = useState(org.billingEmail ?? '');
  const [emailDomain, setEmailDomainLocal] = useState(org.emailDomain ?? '');

  const saveDetails = () => {
    if (!name.trim()) {
      toast.error('Organization name is required.');
      return;
    }
    onSaveWithHelpers(
      {
        name: name.trim(),
        description: description.trim() || null,
        website: website.trim() || null,
        industry: industry.trim() || null,
        billingEmail: billingEmail.trim() || null,
      },
      {
        onSuccess: () => toast.success('Organization details updated.'),
        onError: (error) => toast.error(error.message ?? 'Update failed.'),
      },
    );
  };

  const saveDomain = () => {
    const value = (emailDomain.trim() || '').replace(/^@/, '');
    if (value && !/^[a-zA-Z0-9.-]+$/.test(value)) {
      toast.error('Enter a valid email domain (e.g. example.edu).');
      return;
    }
    onSaveDomain(value || null, {
      onSuccess: () => toast.success('Email domain updated.'),
      onError: (error) => toast.error(error.message ?? 'Update failed.'),
    });
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Organization profile and invitation policy." />

      <Card className="space-y-4 p-6">
        <h3 className="font-medium text-slate-900">Organization details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </div>
        <div>
          <label htmlFor="org-desc" className="input-label">
            Description
          </label>
          <textarea
            id="org-desc"
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
          <h3 className="font-medium text-slate-900">Email domain restriction</h3>
          <p className="mt-1 text-sm text-muted">
            When set, only invitations to emails at this domain are accepted by students.
          </p>
        </div>
        <Input
          label="Domain"
          placeholder="example.edu"
          value={emailDomain}
          onChange={(e) => setEmailDomainLocal(e.target.value)}
          hint="Leave empty to allow any email domain."
        />
        <div className="flex justify-end">
          <Button onClick={saveDomain} isLoading={domainPending} variant="secondary">
            Save domain
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** F3 contract §09 SCR-F3-03 settings: update org details + email domain (ORG-06/07). */
export function OrgSettingsPage() {
  const { query, update, setEmailDomain } = useMyOrg();

  if (query.isLoading) {
    return (
      <div>
        <PageHeader title="Settings" />
        <LoadingState />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div>
        <PageHeader title="Settings" />
        <ErrorState
          message={query.error?.message ?? 'Unable to load organization settings.'}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  return (
    <OrgSettingsForm
      key={query.data.organizationId}
      org={query.data}
      onSaveWithHelpers={(payload, helpers) => update.mutate(payload, helpers)}
      onSaveDomain={(domain, helpers) => setEmailDomain.mutate(domain, helpers)}
      savePending={update.isPending}
      domainPending={setEmailDomain.isPending}
    />
  );
}

export default OrgSettingsPage;
