import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { LoginForm } from '../components/LoginForm';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthStore } from '../stores/authStore';
import '../styles/auth.css';

export default function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const verified = (location.state as { verified?: boolean } | null)?.verified;

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your lab session.">
      {verified ? (
        <p className="auth-alert auth-alert--success auth-alert--margin" role="status">
          Email verified. Sign in to continue.
        </p>
      ) : null}
      <LoginForm />
    </AuthLayout>
  );
}
