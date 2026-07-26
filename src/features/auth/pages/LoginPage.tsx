import { Navigate } from 'react-router-dom';
import { ENV, ROUTES } from '@/shared/constants';
import { LoginForm } from '../components';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-brand-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">{ENV.APP_NAME}</h1>
          <p className="mt-1 text-sm text-muted">Sign in to continue</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
