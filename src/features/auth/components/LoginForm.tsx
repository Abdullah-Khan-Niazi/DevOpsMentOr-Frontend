import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
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

// TWO_FACTOR_REQUIRED — backend demands a TOTP code: 403 with the exact
// error code as message. The form switches to the 6-digit step and resubmits
// credentials + code (single login call, no pending-token ceremony).
const TWO_FACTOR_CODE = 'TWO_FACTOR_REQUIRED';

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
  const needsVerification = isSuccess && data ? !data.data.user.isVerified : false;

  const onSubmit = (values: LoginFormValues) => {
    setCredentials(values);
    doLogin(values);
  };

  const submitTotp = () => {
    if (!credentials || totpCode.length < 6) return;
    doLogin({ ...credentials, totpCode });
  };

  const submitVerification = () => {
    if (verifyCode.length < 6 || !data) return;
    verify.mutate(
      { email: data.data.user.email, code: verifyCode },
      {
        onSuccess: (response) => {
          setSession(response);
          void navigate(redirectTo(), { replace: true });
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const backToCredentials = () => {
    setTotpCode('');
    reset();
  };

  const resendLoginCode = () => {
    if (!data) return;
    resend.mutate(
      { email: data.data.user.email },
      {
        onSuccess: () => toast.success('Verification code sent.'),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const showTotp = twoFactorRequired;

  if (needsVerification && data) {
    return (
      <div className="flex flex-col gap-6">
        <p className="auth-sub">
          Verify your email to secure your account. We sent a 6-digit code to{' '}
          {data.data.user.email}.
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
              {verify.error.message}
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
            className="auth-link auth-link--end"
            onClick={() => void navigate(redirectTo(), { replace: true })}
            disabled={verify.isPending}
          >
            Verify later
          </button>

          <button
            type="button"
            className="auth-link"
            onClick={resendLoginCode}
            disabled={verify.isPending || resend.isPending}
          >
            Resend code
          </button>
        </div>
      </div>
    );
  }

  if (showTotp && credentials) {
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
              {error.message}
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

        {isError ? (
          <p className="auth-alert auth-alert--error" role="alert">
            {error.message}
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
