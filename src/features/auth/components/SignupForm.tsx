import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/shared/components';
import { useSignup, useOAuthSignup } from '../hooks';
import { OAuthButton } from './OAuthButton';

const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
    fullName: z.string().min(1, 'Full name is required').max(100),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { mutate: doSignup, isPending, error, isError } = useSignup();
  const { mutation: oauthMutation, initiateOAuth, feedback } = useOAuthSignup();

  // Lazy initializer — reads the OAuth handoff marker once on mount (no
  // setState-in-effect, avoids the cascading-render lint rule).
  const [oauthProvider] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('oauth_signup_provider');
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: '', fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = (values: SignupFormValues) => {
    const provider = sessionStorage.getItem('oauth_signup_provider');
    const code = sessionStorage.getItem('oauth_signup_code');
    const redirectUri = sessionStorage.getItem('oauth_signup_redirect');

    if (provider && code && redirectUri) {
      sessionStorage.removeItem('oauth_signup_provider');
      sessionStorage.removeItem('oauth_signup_code');
      sessionStorage.removeItem('oauth_signup_redirect');
      oauthMutation.mutate({
        provider: provider as 'google' | 'github' | 'linkedin',
        code,
        redirectUri,
        username: values.username,
        fullName: values.fullName,
      });
      return;
    }

    const { confirmPassword: _, ...payload } = values;
    doSignup(payload);
  };

  const isSubmitting = isPending || oauthMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      {oauthProvider ? (
        <p className="auth-alert" role="status">
          Complete sign up with {oauthProvider}
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Username"
            type="text"
            autoComplete="username"
            placeholder="johndoe"
            error={errors.username?.message}
            {...register('username')}
          />
          <Input
            label="Full name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
        </div>

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        {isError ? (
          <p className="auth-alert auth-alert--error" role="alert">
            {error.message}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="auth-submit">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      {feedback ? (
        <p className="auth-alert" role="status">
          {feedback}
        </p>
      ) : null}

      <div className="auth-divider" aria-hidden="true">
        <span className="auth-divider__label">or sign up with</span>
      </div>

      <div className="flex flex-col gap-3">
        <OAuthButton provider="google" onClick={() => initiateOAuth('google')} />
        <OAuthButton provider="github" onClick={() => initiateOAuth('github')} />
        <OAuthButton provider="linkedin" onClick={() => initiateOAuth('linkedin')} />
      </div>

      <p className="auth-link-row">
        Already have an account?{' '}
        <a href="/login" className="auth-link">
          Sign in
        </a>
      </p>
    </div>
  );
}
