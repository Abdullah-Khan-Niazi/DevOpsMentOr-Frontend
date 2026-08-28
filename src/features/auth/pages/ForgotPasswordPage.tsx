import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useForgotPassword } from '../hooks';
import { AuthLayout } from '../components/AuthLayout';
import '../styles/auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const forgot = useForgotPassword();

  const onSubmit = () => {
    if (!email.trim()) return;
    forgot.mutate(
      { email },
      {
        onSuccess: (data) => {
          setSent(true);
          toast.success(data.data.message);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent a 6-digit reset code to your inbox.">
        <div className="flex flex-col gap-4">
          <p className="auth-alert" role="status">
            If an account exists for {email}, a reset code is on its way. It expires shortly, so use
            it before requesting another.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => void forgot.reset()}
          >
            Use a different email
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we will send a 6-digit reset code."
    >
      <div className="flex flex-col gap-4">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          noValidate
        >
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {forgot.isError ? (
            <p className="auth-alert auth-alert--error" role="alert">
              {forgot.error.message}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            isLoading={forgot.isPending}
            disabled={!email.trim()}
          >
            Send reset code
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
