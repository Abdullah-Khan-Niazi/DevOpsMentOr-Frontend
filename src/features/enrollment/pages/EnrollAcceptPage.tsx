import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, ErrorState, Input, LoadingState, toast } from '@/shared/components';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { extractInvitationToken } from '@/features/auth/utils/invitation';
import { useAcceptInvitation, useValidateInvitation } from '../hooks';

/** F3 contract §09 SCR-F3-08: invitation accept (ENR-01 preview + ENR-02 accept), AuthLayout shell. */
export function EnrollAcceptPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawParam =
    searchParams.get('token') ||
    searchParams.get('code') ||
    searchParams.get('invite') ||
    '';
  const token = extractInvitationToken(rawParam);

  const [inputCode, setInputCode] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accept = useAcceptInvitation();
  const [accepted, setAccepted] = useState(false);

  const preview = useValidateInvitation(token);

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    const extracted = extractInvitationToken(inputCode);
    if (!extracted) {
      setInputError('Please enter a valid invitation code or link.');
      return;
    }
    setInputError(null);
    setSearchParams({ token: extracted });
  };

  const handleResetToken = () => {
    setInputCode('');
    setInputError(null);
    setSearchParams({});
  };

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
      <AuthLayout title="Enrollment Gateway" subtitle="Join via invitation link or access code">
        <Card className="p-6">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
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
              <p className="mt-2 text-xs text-muted">
                Invitations are valid for 72 hours from issuance.
              </p>
            </div>

            <Button type="submit" className="w-full">
              Verify Invitation
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center">
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
      <AuthLayout title="Invitation" subtitle="Checking your invitation">
        <LoadingState label="Checking invitation..." />
      </AuthLayout>
    );
  }

  if (preview.isError || !preview.data) {
    return (
      <AuthLayout title="Invitation" subtitle="Enrollment invitation">
        <Card className="p-6 space-y-4 text-center">
          <ErrorState
            message={preview.error?.message ?? 'This invitation is invalid or has expired (72h limit).'}
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
      <AuthLayout title="Invitation accepted" subtitle={`Welcome to ${invitee.organizationName}`}>
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
          <Link to={ROUTES.STUDENT_MY_CLASS} className="inline-block w-full">
            <Button className="w-full">Go to Class Workspace</Button>
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Accept invitation" subtitle={`Join ${invitee.organizationName}`}>
      <Card className="space-y-4 p-6">
        <div>
          <p className="text-sm text-card-foreground">
            You've been invited to join{' '}
            <span className="font-semibold text-card-foreground">{invitee.organizationName}</span>
            {invitee.kind === 'class' && invitee.className ? (
              <>
                {' '}
                in cohort <span className="font-semibold text-card-foreground">{invitee.className}</span>
              </>
            ) : null}
            .
          </p>
          <p className="mt-1.5 text-xs text-muted">
            Access window: Valid for 72 hours from issuance.
          </p>
        </div>

        {isAuthenticated ? (
          <Button className="w-full" onClick={handleAccept} isLoading={accept.isPending}>
            Accept invitation
          </Button>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted">
              You must sign in or register with the invited email to claim this seat.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(`${ROUTES.ENROLL_ACCEPT}?token=${token}`)}`}
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

        <div className="border-t border-border pt-3 text-center">
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
