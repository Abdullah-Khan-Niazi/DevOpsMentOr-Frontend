import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, ErrorState, LoadingState, toast } from '@/shared/components';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useAcceptInvitation, useValidateInvitation } from '../hooks';

/** F3 contract §09 SCR-F3-08: invitation accept (ENR-01 preview + ENR-02 accept), AuthLayout shell. */
export function EnrollAcceptPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accept = useAcceptInvitation();
  const [accepted, setAccepted] = useState(false);

  const preview = useValidateInvitation(token);

  const handleAccept = () => {
    accept.mutate(token, {
      onSuccess: () => {
        toast.success('Invitation accepted.');
        setAccepted(true);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  if (!token) {
    return (
      <AuthLayout title="Invitation" subtitle="Enrollment invitation">
        <Card className="p-6 text-center">
          <p className="text-sm text-muted">
            This link is missing an invitation token. Check your email or ask your organization for
            a new one.
          </p>
        </Card>
      </AuthLayout>
    );
  }

  if (preview.isLoading) {
    return (
      <AuthLayout title="Invitation" subtitle="Checking your invitation">
        <LoadingState label="Checking invitation…" />
      </AuthLayout>
    );
  }

  if (preview.isError || !preview.data) {
    return (
      <AuthLayout title="Invitation" subtitle="Enrollment invitation">
        <ErrorState
          message={preview.error?.message ?? 'This invitation is invalid or has expired.'}
        />
      </AuthLayout>
    );
  }

  const invitee = preview.data;

  if (accepted || accept.isSuccess || accept.data) {
    return (
      <AuthLayout title="Invitation accepted" subtitle={`Welcome to ${invitee.organizationName}`}>
        <Card className="space-y-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            You're now part of{' '}
            <span className="font-medium text-card-foreground">{invitee.organizationName}</span>
            {invitee.kind === 'class' && invitee.className ? (
              <>
                {' '}
                in class{' '}
                <span className="font-medium text-card-foreground">{invitee.className}</span>
              </>
            ) : null}
            .
          </p>
          <Link to={ROUTES.STUDENT_MY_CLASS} className="inline-block">
            <Button>View my class</Button>
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Accept invitation" subtitle={`Join ${invitee.organizationName}`}>
      <Card className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          You've been invited to{' '}
          <span className="font-medium text-card-foreground">{invitee.organizationName}</span>
          {invitee.kind === 'class' && invitee.className ? (
            <>
              {' '}
              for class{' '}
              <span className="font-medium text-card-foreground">{invitee.className}</span>
            </>
          ) : null}
          .
        </p>

        {isAuthenticated ? (
          <Button className="w-full" onClick={handleAccept} isLoading={accept.isPending}>
            Accept invitation
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              You must be signed in with the invited email to accept.
            </p>
            <Link
              to={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(`${ROUTES.ENROLL_ACCEPT}?token=${token}`)}`}
              className="inline-block w-full"
            >
              <Button className="w-full" variant="secondary">
                Sign in to accept
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </AuthLayout>
  );
}

export default EnrollAcceptPage;
