import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button, Input, PasswordInput } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAdminLogin } from '@/features/auth/hooks';
import { OtpInputGroup } from '@/features/auth/components/OtpInputGroup';

const adminLoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

const TWO_FACTOR_CODE = 'TWO_FACTOR_REQUIRED';

export function AdminLoginForm() {
  const { mutate: doLogin, isPending, error, isError, reset } = useAdminLogin();
  const [totpCode, setTotpCode] = useState('');
  const [credentials, setCredentials] = useState<AdminLoginFormValues | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const twoFactorRequired = isError && error.message === TWO_FACTOR_CODE;

  const onSubmit = (values: AdminLoginFormValues) => {
    setCredentials(values);
    doLogin(values);
  };

  const submitTotp = () => {
    if (!credentials || totpCode.length < 6) return;
    doLogin({ ...credentials, totpCode });
  };

  if (twoFactorRequired && credentials) {
    return (
      <div className="flex flex-col gap-6">
        <p className="auth-sub">Enter the 6-digit code from your authenticator app.</p>

        <div className="flex flex-col gap-4">
          <OtpInputGroup value={totpCode} onChange={setTotpCode} disabled={isPending} autoFocus />

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

          <button type="button" className="auth-link" onClick={reset} disabled={isPending}>
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
          label="Admin email"
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
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
    </div>
  );
}
