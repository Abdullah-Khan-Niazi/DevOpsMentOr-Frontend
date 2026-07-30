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
  const { initiateOAuth } = useOAuthSignup();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: '', fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = (values: SignupFormValues) => {
    const { confirmPassword: _, ...payload } = values;
    doSignup(payload);
  };

  return (
    <div className="flex flex-col gap-6">
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
          <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-spring-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-spring-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spring-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-chalk-white-400" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-chalk-white px-2 text-deep-onyx-600">or sign up with</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <OAuthButton provider="google" onClick={() => initiateOAuth('google')} />
        <OAuthButton provider="github" onClick={() => initiateOAuth('github')} />
        <OAuthButton
          provider="linkedin"
          onClick={() => initiateOAuth('linkedin')}
          disabled
        />
      </div>

      <p className="text-center text-xs text-deep-onyx-600">
        Already have an account?{' '}
        <a href="/login" className="font-semibold text-spring-green-600 underline-offset-2 hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
