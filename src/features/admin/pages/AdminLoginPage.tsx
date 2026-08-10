import { useAuthStore } from '@/features/auth/stores/authStore';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { AdminLoginForm } from '../components/AdminLoginForm';
import '@/features/auth/styles/auth.css';

export default function AdminLoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_PLATFORM_ADMINS} replace />;
  }

  return (
    <AuthLayout title="Platform Admin" subtitle="Restricted access — platform administrators only.">
      <AdminLoginForm />
    </AuthLayout>
  );
}
