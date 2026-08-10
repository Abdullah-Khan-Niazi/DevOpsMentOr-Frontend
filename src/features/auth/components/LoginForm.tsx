import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/shared/components';
import { useLogin, useOAuthLogin } from '../hooks';
import { OAuthButton } from './OAuthButton';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { mutate: doLogin, isPending, error, isError } = useLogin();
  const { initiateOAuth, feedback } = useOAuthLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    doLogin(values);
  };

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
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button type="button" className="auth-forgot">
            Forgot password?
          </button>
        </div>

        {isError ? (
          <p className="auth-alert auth-alert--error" role="alert">
            {error.message}
          </p>
        ) : null}

        <button type="submit" disabled={isPending} className="auth-submit">
          {isPending ? 'Signing in…' : 'Sign in'}
        </button>
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
        <a href="/signup" className="auth-link">
          Sign up
        </a>
      </p>
    </div>
  );
}
