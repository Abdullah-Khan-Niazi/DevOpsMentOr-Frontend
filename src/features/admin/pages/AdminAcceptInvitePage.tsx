import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Button, Input, PasswordInput } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { authService } from '@/features/auth/services';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import '@/features/auth/styles/auth.css';

const acceptSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AcceptFormValues = z.infer<typeof acceptSchema>;

export default function AdminAcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const invitedEmail = searchParams.get('email') ?? '';
  const invitedName = searchParams.get('name') ?? '';

  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptFormValues>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { username: '', email: invitedEmail, password: '', confirmPassword: '' },
  });

  const onSubmit = (values: AcceptFormValues) => {
    if (!token) return;
    setIsPending(true);
    setErrorMessage(null);

    authService
      .acceptAdminInvite({
        token,
        email: values.email,
        password: values.password,
        fullName: invitedName || values.username,
        username: values.username,
      })
      .then(() => setAccepted(true))
      .catch((error: Error) => setErrorMessage(error.message))
      .finally(() => setIsPending(false));
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid invitation" subtitle="This link is missing its invitation token.">
        <div className="flex flex-col gap-4">
          <p className="auth-alert auth-alert--error" role="alert">
            The invitation link is incomplete. Ask the platform administrator who invited you to
            resend it.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => void navigate(ROUTES.HOME)}
          >
            Back to home
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (accepted) {
    return (
      <AuthLayout title="Account activated" subtitle="You are now a platform administrator.">
        <div className="flex flex-col gap-4">
          <p className="auth-alert auth-alert--success auth-alert--margin" role="status">
            Your admin account is active. Sign in to manage platform administrators.
          </p>
          <Button
            type="button"
            className="w-full"
            onClick={() => void navigate(ROUTES.LOGIN)}
          >
            Go to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Accept invitation"
      subtitle="Set your credentials to activate your admin account."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Username"
          type="text"
          autoComplete="username"
          placeholder="johndoe"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {errorMessage ? (
          <p className="auth-alert auth-alert--error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <Button type="submit" className="w-full" isLoading={isPending}>
          Activate admin account
        </Button>

        <p className="auth-link-row">
          <Link to={ROUTES.HOME} className="auth-link">
            Back to home
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
