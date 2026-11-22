import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, ErrorState, PageHeader, Skeleton, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { apiClient, getErrorCode, getErrorMessage, getStatusCode } from '@/shared/services';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { refreshAuthSession } from '@/features/auth/utils/refreshAuthSession';

/** Accepts an org-admin invitation. The token travels in the body only (C§ B6). */
async function acceptOrgAdminInvite(token: string): Promise<void> {
  await apiClient.post('/admin/organizations/accept-admin', { token });
}

function AcceptSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Accepting organization invitation"
      aria-busy="true"
    >
      <Skeleton className="h-8 w-72 rounded-md" />
      <Card className="space-y-4 p-6">
        <Skeleton className="h-4 w-3/4 rounded-xs" />
        <Skeleton className="h-4 w-1/2 rounded-xs" />
        <Skeleton className="h-10 w-40 rounded-md" />
      </Card>
    </div>
  );
}

/**
 * Landing page for the organization-admin invitation email. The token is read
 * once, then removed from the address bar so it never lingers in history or
 * logs. On a successful accept the session is refreshed so the org_admin role
 * is in the JWT before entering the organization workspace.
 */
export default function OrgAdminAcceptPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // Captured on the first render and kept in memory; the URL is cleaned below.
  const [token] = useState(() => searchParams.get('token')?.trim() ?? '');
  const startedRef = useRef(false);

  const {
    mutate: acceptInvite,
    isError,
    isPending,
    error,
  } = useMutation({
    mutationFn: acceptOrgAdminInvite,
  });

  const runAccept = useCallback(
    (inviteToken: string) =>
      acceptInvite(inviteToken, {
        onSuccess: async () => {
          const refreshed = await refreshAuthSession();
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['org'] }),
            queryClient.invalidateQueries({ queryKey: ['progress', 'orgs'] }),
            queryClient.invalidateQueries({ queryKey: ['leaderboard', 'org'] }),
            queryClient.invalidateQueries({ queryKey: ['student'] }),
          ]);
          if (!refreshed) {
            toast.error(
              'Invitation accepted, but your session could not be refreshed. Sign in again.',
            );
            navigate(ROUTES.DASHBOARD, { replace: true });
            return;
          }
          toast.success('You are now an administrator of this organization.');
          navigate(ROUTES.ORG_DASHBOARD, { replace: true });
        },
      }),
    [acceptInvite, navigate, queryClient],
  );

  // Strip the token (and the orgId hint) from the address bar immediately.
  useEffect(() => {
    if (!searchParams.has('token') && !searchParams.has('orgId')) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.delete('token');
    next.delete('orgId');
    const search = next.toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '' },
      { replace: true },
    );
  }, [location.pathname, navigate, searchParams]);

  // Accept once per mount (React StrictMode runs effects twice in development).
  useEffect(() => {
    if (!token || startedRef.current) {
      return;
    }
    startedRef.current = true;
    runAccept(token);
  }, [token, runAccept]);

  const header = <PageHeader title="Organization admin invitation" />;

  if (!token) {
    return (
      <div className="space-y-6">
        {header}
        <Card className="p-6">
          <ErrorState
            title="Invitation link incomplete"
            message="This link is missing its invitation token. Ask the person who invited you to send it again."
          />
          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate(ROUTES.DASHBOARD)}>
              Go to dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!isError) {
    return (
      <div className="space-y-6">
        {header}
        <AcceptSkeleton />
      </div>
    );
  }

  const code = getErrorCode(error);
  const status = getStatusCode(error);

  let message = getErrorMessage(error, 'Unable to accept this invitation.');
  let title = 'Invitation not accepted';
  // Only transient failures (offline, timeout, server error) can succeed on retry:
  // the token is still unclaimed because the server claims it last.
  const retryable = status === null || status >= 500;
  if (code === 'INVITE_TOKEN_INVALID') {
    message =
      'This invitation link is invalid, expired or has already been used. Ask the person who invited you to send a new one.';
  } else if (code === 'ALREADY_MEMBER') {
    title = 'Already a member';
    message = 'You already belong to this organization.';
  } else if (status === 403) {
    message = `This invitation was sent to a different email address. You are signed in as ${
      user?.email ?? 'an unknown account'
    }. Sign in with the invited account to accept it.`;
  }

  return (
    <div className="space-y-6">
      {header}
      <Card className="p-6">
        <ErrorState
          title={title}
          message={message}
          error={error}
          onRetry={retryable ? () => runAccept(token) : undefined}
          retrying={isPending}
        />
        <div className="mt-4">
          {code === 'ALREADY_MEMBER' ? (
            <Button variant="secondary" onClick={() => navigate(ROUTES.ORG_DASHBOARD)}>
              Go to organization
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => navigate(ROUTES.DASHBOARD)}>
              Go to dashboard
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
