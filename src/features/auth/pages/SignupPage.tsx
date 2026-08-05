import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { AuthContextPanel } from '../components/AuthContextPanel';
import { SignupForm } from '../components/SignupForm';
import { useAuthStore } from '../stores/authStore';
import '../styles/auth.css';

export default function SignupPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="auth-page">
      <AuthContextPanel />

      <main className="auth-panel">
        <div className="auth-panel__inner">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Start with Module 01 — individual access is free.</p>
          <div className="auth-card">
            <SignupForm />
          </div>
        </div>
      </main>
    </div>
  );
}
