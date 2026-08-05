import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { AuthContextPanel } from '../components/AuthContextPanel';
import { LoginForm } from '../components/LoginForm';
import { useAuthStore } from '../stores/authStore';
import '../styles/auth.css';

export default function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="auth-page">
      <AuthContextPanel />

      <main className="auth-panel">
        <div className="auth-panel__inner">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to continue your lab session.</p>
          <div className="auth-card">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}
