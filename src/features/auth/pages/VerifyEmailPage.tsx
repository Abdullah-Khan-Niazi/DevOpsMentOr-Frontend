import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button, Input, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth';
import { useResendVerification, useVerifyEmail } from '../hooks';
import { useOnboardingStore } from '../stores/onboardingStore';
import { AuthLayout } from '../components/AuthLayout';
import { OtpInputGroup } from '../components/OtpInputGroup';
import '../styles/auth.css';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = location.state as { email?: string; message?: string } | null;
  const onboardingEmail = useOnboardingStore.getState().email;

  const [email, setEmail] = useState(
    state?.email ?? searchParams.get('email') ?? onboardingEmail ?? '',
  );
  const [askEmail, setAskEmail] = useState(
    !(state?.email ?? searchParams.get('email') ?? onboardingEmail),
  );
  const [code, setCode] = useState('');
  const [info, setInfo] = useState<string | null>(state?.message ?? null);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const verify = useVerifyEmail();
  const resend = useResendVerification();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const submitEmail = () => {
    if (!email.trim()) return;
    setInfo('Sending a new verification code…');
    resend.mutate(
      { email },
      {
        onSuccess: () => {
          setAskEmail(false);
          setInfo('Enter the 6-digit code sent to your email.');
        },
        onError: (error) => setInfo(error.message),
      },
    );
  };

  const submitCode = () => {
    if (code.length < 6) return;
    verify.mutate(
      { email, code },
      {
        onSuccess: (data) => {
          useAuthStore.getState().setSession(data);
          useOnboardingStore.getState().reset();
          setVerified(true);
          setInfo('Your email is verified and you are signed in.');
        },
        onError: (error) => {
          setInfo(error.message);
        },
      },
    );
  };

  const resendCode = () => {
    if (cooldown > 0) return;
    resend.mutate(
      { email },
      {
        onSuccess: () => {
          setCooldown(60);
          toast.success('Verification code sent.');
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  if (verified) {
    return (
      <AuthLayout title="Email verified" subtitle="Your account is ready to use.">
        <div className="flex flex-col gap-6">
          {info ? (
            <p className="auth-alert auth-alert--success auth-alert--margin" role="status">
              {info}
            </p>
          ) : null}
          <Button
            type="button"
            className="w-full"
            onClick={() => void navigate(ROUTES.DASHBOARD, { replace: true })}
          >
            Go to dashboard
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Check your inbox for a 6-digit verification code."
    >
      <div className="flex flex-col gap-4">
        {askEmail ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              submitEmail();
            }}
            noValidate
          >
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button type="submit" className="w-full" disabled={!email.trim()}>
              Send verification code
            </Button>
          </form>
        ) : (
          <>
            {info ? (
              <p className="auth-alert" role="status">
                {info}
              </p>
            ) : null}

            {verify.isError ? (
              <p className="auth-alert auth-alert--error" role="alert">
                {verify.error.message}
              </p>
            ) : null}

            <OtpInputGroup
              value={code}
              onChange={setCode}
              disabled={verify.isPending || resend.isPending}
              autoFocus
            />

            <Button
              type="button"
              className="w-full"
              isLoading={verify.isPending}
              disabled={code.length < 6}
              onClick={submitCode}
            >
              Verify email
            </Button>

            <p className="auth-link-row">
              Did not receive a code?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={resendCode}
                disabled={cooldown > 0 || resend.isPending}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </p>

            <button
              type="button"
              className="auth-link auth-link--end"
              onClick={() => setAskEmail(true)}
            >
              Use a different email
            </button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
