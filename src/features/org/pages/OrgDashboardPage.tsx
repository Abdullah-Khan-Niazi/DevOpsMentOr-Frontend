import { Link } from 'react-router-dom';
import { Card, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useMyOrg } from '../hooks';
import { OrgHeaderCard } from '../components';

/** F3 contract §09 SCR-F3-03: org workspace dashboard. */
export function OrgDashboardPage() {
  const { query } = useMyOrg();
  const canInviteProfessors = useAuthStore((state) =>
    (state.user?.permissions ?? []).includes('org:professors:invite'),
  );
  const canViewSettings = useAuthStore((state) =>
    (state.user?.permissions ?? []).includes('org:manage'),
  );

  if (query.isLoading) {
    return (
      <div>
        <PageHeader title="Organization dashboard" />
        <LoadingState label="Loading your organization…" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div>
        <PageHeader title="Organization dashboard" />
        <ErrorState
          message={query.error?.message ?? 'Unable to load organization information.'}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const org = query.data;

  return (
    <div>
      <PageHeader
        title="Organization dashboard"
        description="Overview of your organization and its academic workspace."
      />
      <OrgHeaderCard org={org} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to={ROUTES.ORG_CLASSES}>
          <Card interactive className="p-5">
            <h3 className="font-semibold text-card-foreground">Classes</h3>
            <p className="mt-1 text-sm text-muted">
              Manage your classes, rosters, assignments and student invitations.
            </p>
          </Card>
        </Link>
        {canInviteProfessors ? (
          <Link to={ROUTES.ORG_PROFESSORS}>
            <Card interactive className="p-5">
              <h3 className="font-semibold text-card-foreground">Professors</h3>
              <p className="mt-1 text-sm text-muted">
                Invite professors and review their assignments.
              </p>
            </Card>
          </Link>
        ) : null}
        {canViewSettings ? (
          <Link to={ROUTES.ORG_SETTINGS}>
            <Card interactive className="p-5">
              <h3 className="font-semibold text-card-foreground">Settings</h3>
              <p className="mt-1 text-sm text-muted">
                Organization details and email domain restriction.
              </p>
            </Card>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default OrgDashboardPage;
