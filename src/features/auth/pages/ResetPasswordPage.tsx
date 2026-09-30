import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button, Input, PasswordInput, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useResetPassword } from '../hooks';
import { AuthLayout } from '../components/AuthLayout';
import { OtpInputGroup } from '../components/OtpInputGroup';
import '../styles/auth.css';

const resetSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const reset = useResetPassword();

  // Pre-populate email from ForgotPasswordPage navigation state.
  const prefillEmail = (location.state as { email?: string } | null)?.email ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: prefillEmail, password: '', confirmPassword: '' },
  });

  const onSubmit = (values: ResetFormValues) => {
    if (code.length < 6) return;
    reset.mutate(
      { email: values.email, code, newPassword: values.password },
      {
        onSuccess: (data) => {
          toast.success(data.data.message);
          void navigate(ROUTES.LOGIN, { replace: true, state: { reset: true } });
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter the code from your email and a new password."
    >
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="otp-field">
            <span className="otp-field__label">Reset code</span>
            <OtpInputGroup
              value={code}
              onChange={setCode}
              disabled={reset.isPending}
              aria-label="6-digit reset code"
            />
          </div>

          <PasswordInput
            label="New password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {reset.isError ? (
            <p className="auth-alert auth-alert--error" role="alert">
              {reset.error.message}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            isLoading={reset.isPending}
            disabled={code.length < 6}
          >
            Reset password
          </Button>
        </form>

        <p className="auth-link-row">
          Remembered it?{' '}
          <Link to={ROUTES.LOGIN} className="auth-link">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
