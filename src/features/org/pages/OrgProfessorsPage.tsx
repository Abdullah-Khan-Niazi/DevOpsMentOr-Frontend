import { useState } from 'react';
import { Button, Card, ErrorState, Input, PageHeader, toast } from '@/shared/components';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOrgProfessors } from '../hooks';

/** F3 contract §09 SCR-F3-04: professors list (ORG-10) + invite (ORG-09). */
export function OrgProfessorsPage() {
  const canInvite = useAuthStore((state) =>
    (state.user?.permissions ?? []).includes('org:professors:invite'),
  );
  const { query, invite } = useOrgProfessors();
  const [email, setEmail] = useState('');

  const handleInvite = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('A professor email is required.');
      return;
    }
    invite.mutate(trimmed, {
      onSuccess: () => {
        toast.success('Professor invited.');
        setEmail('');
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div>
      <PageHeader
        title="Professors"
        description="Professors in your organization and their class assignments."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-4 p-5 lg:col-span-2">
          <h3 className="font-medium text-card-foreground">Current professors</h3>
          {query.isError ? (
            <ErrorState
              message={query.error?.message ?? 'Unable to load professors.'}
              onRetry={() => void query.refetch()}
            />
          ) : query.isLoading ? (
            <p className="py-6 text-sm text-muted">Loading professors…</p>
          ) : query.data && query.data.length === 0 ? (
            <p className="py-6 text-sm text-muted">No professors yet in this organization.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Professor</th>
                  <th className="px-3 py-2 font-medium">Assigned classes</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.map((professor) => (
                  <tr
                    key={professor.userId}
                    className="border-b border-border/60 last:border-0 hover:bg-surface/60"
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-card-foreground">
                        {professor.fullName ?? '—'}
                      </div>
                      <div className="text-xs text-muted">{professor.email}</div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {professor.assignedClassCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {canInvite ? (
          <Card className="h-fit space-y-4 p-5">
            <h3 className="font-medium text-card-foreground">Invite a professor</h3>
            <p className="text-sm text-muted">
              The professor receives an email invitation to join your organization.
            </p>
            <Input
              label="Email"
              type="email"
              placeholder="professor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInvite();
              }}
            />
            <Button className="w-full" onClick={handleInvite} isLoading={invite.isPending}>
              Send invitation
            </Button>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export default OrgProfessorsPage;
