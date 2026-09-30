import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button, Input, PasswordInput, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '../stores/authStore';
import { useLogin, useOAuthLogin, useVerifyEmail, useResendVerification } from '../hooks';
import { OAuthButton } from './OAuthButton';
import { OtpInputGroup } from './OtpInputGroup';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// TWO_FACTOR_REQUIRED: backend returns 403 with this exact message when the
// user has 2FA enabled but no TOTP code was supplied. The form switches to a
// separate 6-digit step and re-submits credentials + code.
const TWO_FACTOR_CODE = 'TWO_FACTOR_REQUIRED';

/** Map backend error codes to user-facing messages. */
function friendlyError(raw: string): string {
  switch (raw) {
    case 'INCORRECT_PASSWORD':
      return 'Incorrect password. Please try again.';
    case 'ACCOUNT_BANNED':
      return 'Your account has been suspended. Contact support for help.';
    case 'ACCOUNT_INACTIVE':
      return 'Your account is inactive. Contact support to reactivate it.';
    case 'ACCOUNT_NOT_VERIFIED':
      return 'Please verify your email before signing in.';
    case TWO_FACTOR_CODE:
      return ''; // handled by the TOTP step — no inline error
    default:
      return raw;
  }
}

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const { mutate: doLogin, isPending, error, isError, reset, data, isSuccess } = useLogin();
  const { initiateOAuth, feedback } = useOAuthLogin();
  const verify = useVerifyEmail();
  const resend = useResendVerification();
  const [totpCode, setTotpCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [credentials, setCredentials] = useState<LoginFormValues | null>(null);
  // Capture email from the form so we still have it when login returns 403 NOT_VERIFIED
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const redirectTo = () => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    return redirect && redirect.startsWith('/') ? redirect : ROUTES.DASHBOARD;
  };

  const twoFactorRequired = isError && error.message === TWO_FACTOR_CODE;

  // Verification needed when login succeeded but the user is not yet verified,
  // OR when the backend blocked login with ACCOUNT_NOT_VERIFIED (403).
  const needsVerification =
    (isSuccess && data ? !data.data.user.isVerified : false) ||
    (isError && error.message === 'ACCOUNT_NOT_VERIFIED');

  // Use the user email from the response when available, fall back to the
  // submitted email so we can show the prompt even for the 403 case.
  const emailForVerify = data?.data.user.email || submittedEmail;

  const onSubmit = (values: LoginFormValues) => {
    setCredentials(values);
    setSubmittedEmail(values.email);
    doLogin(values);
  };

  const submitTotp = () => {
    if (!credentials || totpCode.length < 6) return;
    doLogin({ ...credentials, totpCode });
  };

  const submitVerification = () => {
    if (verifyCode.length < 6 || !emailForVerify) return;
    verify.mutate(
      { email: emailForVerify, code: verifyCode },
      {
        onSuccess: (response) => {
          setSession(response);
          const perms = response.data.user.permissions ?? [];
          const redirect = redirectTo();
          if (perms.includes('platform.admin.access') && redirect === ROUTES.DASHBOARD) {
            void navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
          } else {
            void navigate(redirect, { replace: true });
          }
        },
        onError: (err) => toast.error(friendlyError(err.message)),
      },
    );
  };

  const backToCredentials = () => {
    setTotpCode('');
    reset();
  };

  const resendLoginCode = () => {
    if (!emailForVerify || resendCooldown > 0) return;
    resend.mutate(
      { email: emailForVerify },
      {
        onSuccess: () => {
          setResendCooldown(60);
          toast.success('A fresh verification code has been sent.');
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  // ── Unverified email step ────────────────────────────────────────────────
  if (needsVerification) {
    return (
      <div className="flex flex-col gap-6">
        <p className="auth-sub">
          Verify your email to secure your account. We sent a 6-digit code to{' '}
          <strong>{emailForVerify}</strong>.
        </p>

        <div className="flex flex-col gap-4">
          <OtpInputGroup
            value={verifyCode}
            onChange={setVerifyCode}
            disabled={verify.isPending}
            autoFocus
          />

          {verify.isError ? (
            <p className="auth-alert auth-alert--error" role="alert">
              {friendlyError(verify.error.message)}
            </p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            isLoading={verify.isPending}
            disabled={verifyCode.length < 6}
            onClick={submitVerification}
          >
            Verify email
          </Button>

          <button
            type="button"
            className="auth-link"
            onClick={resendLoginCode}
            disabled={verify.isPending || resend.isPending || resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>

          <button
            type="button"
            className="auth-link auth-link--end"
            onClick={() => {
              setVerifyCode('');
              reset();
            }}
            disabled={verify.isPending}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ── Two-factor step ──────────────────────────────────────────────────────
  if (twoFactorRequired && credentials) {
    return (
      <div className="flex flex-col gap-6">
        <p className="auth-sub">Enter the 6-digit code from your authenticator app.</p>

        <div className="flex flex-col gap-4">
          <OtpInputGroup
            value={totpCode}
            onChange={(value) => setTotpCode(value)}
            disabled={isPending}
            autoFocus
          />

          {isError && !twoFactorRequired ? (
            <p className="auth-alert auth-alert--error" role="alert">
              {friendlyError(error.message)}
            </p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            isLoading={isPending}
            disabled={totpCode.length < 6}
            onClick={submitTotp}
          >
            Verify code
          </Button>

          <button
            type="button"
            className="auth-link"
            onClick={backToCredentials}
            disabled={isPending}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ── Main credential form ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="flex flex-col gap-1">
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Link to={ROUTES.FORGOT_PASSWORD} className="auth-link auth-link--end">
            Forgot password?
          </Link>
        </div>

        {isError && !twoFactorRequired && !needsVerification ? (
          <p className="auth-alert auth-alert--error" role="alert">
            {friendlyError(error.message)}
          </p>
        ) : null}

        <Button type="submit" className="w-full" isLoading={isPending}>
          Sign in
        </Button>
      </form>

      {feedback ? (
        <p className="auth-alert" role="status">
          {feedback}
        </p>
      ) : null}

      <div className="auth-divider" aria-hidden="true">
        <span className="auth-divider__label">or continue with</span>
      </div>

      <div className="flex flex-col gap-3">
        <OAuthButton provider="google" onClick={() => initiateOAuth('google')} />
        <OAuthButton provider="github" onClick={() => initiateOAuth('github')} />
      </div>

      <p className="auth-link-row">
        Do not have an account?{' '}
        <Link to={ROUTES.SIGNUP} className="auth-link">
          Sign up
        </Link>
      </p>
    </div>
  );
}
