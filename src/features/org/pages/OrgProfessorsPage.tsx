import { useSearchParams } from 'react-router-dom';
import { Button, Card, ErrorState, PageHeader } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOrgProfessors } from '../hooks';
import { OrgInviteDrawer } from '../components';

/** F3 contract §09 SCR-F3-04: professors list (ORG-10) + invite drawer. */
export function OrgProfessorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const canInvite = useAuthStore((state) =>
    (state.user?.permissions ?? []).includes('org:professors:invite'),
  );
  const { query } = useOrgProfessors();

  const isDrawerOpen = searchParams.get('drawer') === 'invite';

  const openDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('drawer', 'invite');
      return next;
    });
  };

  const closeDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('drawer');
      return next;
    });
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader
        title="Faculty &amp; Professors"
        backTo={ROUTES.ORG_DASHBOARD}
        actions={
          canInvite ? (
            <Button variant="primary" size="sm" onClick={openDrawer}>
              + Invite Professor
            </Button>
          ) : undefined
        }
      />

      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-card-foreground">Current Faculty Members</h3>
        </div>

        {query.isError ? (
          <ErrorState
            message={query.error?.message ?? 'Unable to load professors.'}
            onRetry={() => void query.refetch()}
          />
        ) : query.isLoading ? (
          <p className="py-8 text-center text-xs text-muted font-mono">Loading professors…</p>
        ) : query.data && query.data.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted font-mono">
            No professors registered yet in this organization.
          </p>
        ) : (
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted font-mono">
                  <th className="px-4 py-3 font-medium">Professor</th>
                  <th className="px-4 py-3 font-medium">Assigned Cohorts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {query.data?.map((professor) => (
                  <tr key={professor.userId} className="hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-card-foreground text-sm">
                        {professor.fullName ?? '-'}
                      </div>
                      <div className="text-xs text-muted font-mono">{professor.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-card-foreground font-mono">
                      {professor.assignedClassCount}{' '}
                      {professor.assignedClassCount === 1 ? 'cohort' : 'cohorts'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <OrgInviteDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        defaultRole="professor"
        onSuccess={() => void query.refetch()}
      />
    </div>
  );
}

export default OrgProfessorsPage;
