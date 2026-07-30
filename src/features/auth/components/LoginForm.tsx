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
          <button
            type="button"
            className="self-end text-xs text-deep-onyx-600 underline-offset-2 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {isError ? (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-spring-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-spring-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spring-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {feedback ? (
        <p className="rounded-md bg-spring-green/10 px-3 py-2 text-sm text-deep-onyx text-center" role="status">
          {feedback}
        </p>
      ) : null}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-chalk-white-400" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-chalk-white px-2 text-deep-onyx-600">or continue with</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <OAuthButton provider="google" onClick={() => initiateOAuth('google')} />
        <OAuthButton provider="github" onClick={() => initiateOAuth('github')} />
        <OAuthButton
          provider="linkedin"
          onClick={() => initiateOAuth('linkedin')}
        />
      </div>

      <p className="text-center text-xs text-deep-onyx-600">
        Do not have an account?{' '}
        <a href="/signup" className="font-semibold text-spring-green-600 underline-offset-2 hover:underline">
          Sign up
        </a>
      </p>
    </div>
  );
}
