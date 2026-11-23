import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, ErrorState, Input, Skeleton, toast } from '@/shared/components';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { QUERY_KEYS, ROUTES } from '@/shared/constants';
import { getErrorMessage } from '@/shared/services';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { refreshAuthSession } from '@/features/auth/utils/refreshAuthSession';
import { extractInvitationToken, parseJoinInput } from '@/features/auth/utils/invitation';
import { enrollmentService } from '../services';
import { useAcceptInvitation, useValidateInvitation } from '../hooks';

/** Invitation preview while it is checked: mirrors the accept card. */
function EnrollAcceptSkeleton() {
  return (
    <Card className="space-y-4 p-6" role="status" aria-label="Checking invitation" aria-busy="true">
      <Skeleton className="h-4 w-3/4 rounded-xs" />
      <Skeleton className="h-4 w-1/2 rounded-xs" />
      <Skeleton className="h-10 w-full rounded-md" />
    </Card>
  );
}

/** F3 contract §09 SCR-F3-08: invitation accept (ENR-01 preview + ENR-02 accept), AuthLayout shell. */
export function EnrollAcceptPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawParam =
    searchParams.get('token') || searchParams.get('code') || searchParams.get('invite') || '';

  // The token is held in component state and removed from the address bar,
  // so it never lingers in browser history or on screen after load.
  const [token, setToken] = useState(() => extractInvitationToken(rawParam));
  const [seenParam, setSeenParam] = useState(rawParam);
  if (seenParam !== rawParam) {
    setSeenParam(rawParam);
    if (rawParam) {
      setToken(extractInvitationToken(rawParam));
    }
  }
  useEffect(() => {
    if (rawParam) {
      setSearchParams({}, { replace: true });
    }
  }, [rawParam, setSearchParams]);

  const navigate = useNavigate();
  const [inputCode, setInputCode] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isJoiningCode, setIsJoiningCode] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accept = useAcceptInvitation();
  const [accepted, setAccepted] = useState(false);
  const queryClient = useQueryClient();

  const preview = useValidateInvitation(token);

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseJoinInput(inputCode);
    if (parsed.kind === 'invalid') {
      setInputError(parsed.error);
      return;
    }

    setInputError(null);
    if (parsed.kind === 'code') {
      if (!isAuthenticated) {
        navigate(
          `${ROUTES.LOGIN}?redirect=${encodeURIComponent(`${ROUTES.ENROLL_ACCEPT}?code=${encodeURIComponent(parsed.code)}`)}`,
        );
        return;
      }
      setIsJoiningCode(true);
      try {
        const result = await enrollmentService.joinWithCode(parsed.code);
        await refreshAuthSession();
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.me });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollment.myClasses });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollment.myClass() });
        toast.success(
          result.alreadyEnrolled
            ? `Already enrolled in ${result.className}.`
            : `Joined ${result.className}.`,
        );
        navigate(`${ROUTES.STUDENT_MY_CLASS}?classId=${result.classId}`);
      } catch (err) {
        setInputError(getErrorMessage(err, 'Unable to join with this class code.'));
      } finally {
        setIsJoiningCode(false);
      }
      return;
    }

    if (parsed.pathname === ROUTES.ORG_ADMIN_ACCEPT) {
      navigate(`${ROUTES.ORG_ADMIN_ACCEPT}?token=${encodeURIComponent(parsed.token)}`);
      return;
    }
    setToken(parsed.token);
  };

  const handleResetToken = () => {
    setInputCode('');
    setInputError(null);
    setToken('');
  };

  const handleAccept = () => {
    accept.mutate(token, {
      onSuccess: async () => {
        toast.success('Invitation accepted.');
        setAccepted(true);

        // Refresh identity so the new role (org_student / professor) shows up
        // immediately in nav, switcher and route guards. This also rotates the
        // JWT because roles and permissions are embedded in it; updating the
        // store alone would leave the API denying the new workspace.
        const refreshed = await refreshAuthSession();
        if (!refreshed) {
          toast.error(
            'Your session could not be refreshed. Sign in again to open your new workspace.',
          );
        }

        // Refetch context-scoped data so the success screen and the next
        // workspace the user opens show the freshly granted scope.
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.org.me });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollment.myClasses });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollment.myClass() });
      },
      onError: (error) => toast.error(error),
    });
  };

  if (!token) {
    return (
      <AuthLayout title="Enrollment Gateway">
        <Card className="p-6">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <Input
              label="Invitation code or link"
              placeholder="Paste invite link or enter access code"
              value={inputCode}
              error={inputError ?? undefined}
              onChange={(e) => {
                setInputError(null);
                setInputCode(e.target.value);
              }}
              required
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isJoiningCode}
              loadingLabel="Joining class…"
            >
              Verify & Join
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted">
              Don't have an invitation?{' '}
              <Link to={ROUTES.SIGNUP} className="text-brand-600 hover:underline">
                Create an individual account
              </Link>
            </p>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  if (preview.isLoading) {
    return (
      <AuthLayout title="Invitation">
        <EnrollAcceptSkeleton />
      </AuthLayout>
    );
  }

  if (preview.isError || !preview.data) {
    return (
      <AuthLayout title="Invitation">
        <Card className="p-6 space-y-4 text-center">
          <ErrorState
            message={
              preview.error?.message ?? 'This invitation is invalid or has expired (72h limit).'
            }
          />
          <Button variant="secondary" className="w-full" onClick={handleResetToken}>
            Enter a different code or link
          </Button>
        </Card>
      </AuthLayout>
    );
  }

  const invitee = preview.data;

  if (accepted || accept.isSuccess || accept.data) {
    return (
      <AuthLayout title="Invitation accepted">
        <Card className="space-y-4 p-6 text-center">
          <p className="text-sm text-card-foreground">
            You're now enrolled in{' '}
            <span className="font-semibold text-card-foreground">{invitee.organizationName}</span>
            {invitee.kind === 'class' && invitee.className ? (
              <>
                {' '}
                for cohort{' '}
                <span className="font-semibold text-card-foreground">{invitee.className}</span>
              </>
            ) : null}
            .
          </p>
          <Link
            to={invitee.kind === 'class' ? ROUTES.STUDENT_MY_CLASS : ROUTES.ORG_DASHBOARD}
            className="inline-block w-full"
          >
            <Button className="w-full">
              {invitee.kind === 'class' ? 'Go to Class Workspace' : 'Go to Organization Workspace'}
            </Button>
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Accept invitation">
      <Card className="space-y-4 p-6">
        <p className="text-sm text-card-foreground">
          You've been invited to join{' '}
          <span className="font-semibold text-card-foreground">{invitee.organizationName}</span>
          {invitee.kind === 'class' && invitee.className ? (
            <>
              {' '}
              in cohort{' '}
              <span className="font-semibold text-card-foreground">{invitee.className}</span>
            </>
          ) : null}
          .
        </p>

        {isAuthenticated ? (
          <Button
            className="w-full"
            onClick={handleAccept}
            isLoading={accept.isPending}
            loadingLabel="Accepting invitation…"
          >
            Accept invitation
          </Button>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted">
              You must sign in or register with the invited email to claim this seat.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(`${ROUTES.ENROLL_ACCEPT}?token=${encodeURIComponent(token)}`)}`}
                className="w-full"
              >
                <Button className="w-full" variant="primary">
                  Sign in to accept
                </Button>
              </Link>
              <Link
                to={`${ROUTES.SIGNUP}?token=${encodeURIComponent(token)}${invitee.inviteeEmail ? `&email=${encodeURIComponent(invitee.inviteeEmail)}` : ''}`}
                className="w-full"
              >
                <Button className="w-full" variant="secondary">
                  Complete onboarding to accept
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={handleResetToken}
            className="text-xs text-muted hover:text-card-foreground transition-colors"
          >
            Use a different code
          </button>
        </div>
      </Card>
    </AuthLayout>
  );
}

export default EnrollAcceptPage;
