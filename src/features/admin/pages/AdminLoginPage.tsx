import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';

export default function AdminLoginPage() {
  return <Navigate to={ROUTES.LOGIN} replace />;
}
