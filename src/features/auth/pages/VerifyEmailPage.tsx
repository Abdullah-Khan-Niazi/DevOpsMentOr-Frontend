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

// Must stay in sync with backend env.OTP_TTL_MINUTES (default 15).
const OTP_TTL_SECONDS = 15 * 60;

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = location.state as { email?: string; message?: string } | null;
  const onboardingEmail = useOnboardingStore.getState().email;

  const [email, setEmail] = useState(
    state?.email ?? searchParams.get('email') ?? onboardingEmail ?? '',
  );
  const [code, setCode] = useState('');
  const [info, setInfo] = useState<string | null>(state?.message ?? null);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [expiresAt, setExpiresAt] = useState<number | null>(() =>
    email ? Date.now() + OTP_TTL_SECONDS * 1000 : null,
  );
  const [remaining, setRemaining] = useState<number | null>(() =>
    email ? OTP_TTL_SECONDS : null,
  );

  const verify = useVerifyEmail();
  const resend = useResendVerification();

  // Count-down ticker for OTP expiry.
  useEffect(() => {
    if (expiresAt === null) return;
    const tick = () => setRemaining(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // Count-down for resend cooldown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const submitCode = () => {
    if (code.length < 6 || !email.trim()) return;
    verify.mutate(
      { email: email.trim(), code },
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
    if (cooldown > 0 || !email.trim()) return;
    resend.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          const expiry = Date.now() + OTP_TTL_SECONDS * 1000;
          setExpiresAt(expiry);
          setCooldown(60);
          setRemaining(OTP_TTL_SECONDS);
          setInfo(null);
          toast.success('A fresh verification code has been sent.');
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const isExpired = remaining !== null && remaining === 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        {info ? (
          <p className="auth-alert" role="status">
            {info}
          </p>
        ) : null}

        {isExpired ? (
          <p className="auth-alert auth-alert--error" role="alert">
            This code has expired. Request a new one below.
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
          disabled={verify.isPending || resend.isPending || isExpired}
          autoFocus
        />

        {remaining !== null && !isExpired ? (
          <p className="auth-sub">Code expires in {formatTime(remaining)}</p>
        ) : null}

        <Button
          type="button"
          className="w-full"
          isLoading={verify.isPending}
          disabled={code.length < 6 || !email.trim() || isExpired}
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
            disabled={cooldown > 0 || resend.isPending || !email.trim()}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </p>

        <button
          type="button"
          className="auth-link auth-link--end"
          onClick={() => void navigate(ROUTES.LOGIN, { replace: true })}
        >
          Back to sign in
        </button>
      </div>
    </AuthLayout>
  );
}
