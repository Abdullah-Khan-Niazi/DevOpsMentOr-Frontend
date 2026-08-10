import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { SignupForm } from '../components/SignupForm';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthStore } from '../stores/authStore';
import '../styles/auth.css';

export default function SignupPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start with Module 01 — individual access is free."
    >
      <SignupForm />
    </AuthLayout>
  );
}
