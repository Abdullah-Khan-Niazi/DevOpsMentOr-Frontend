import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import OnboardingPage from './OnboardingPage';
import '../styles/auth.css';

export default function SignupPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const flow = useOnboardingStore((state) => state.flow);
  const oauth = useOnboardingStore((state) => state.oauth);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // The signup route is the email entry point of the onboarding wizard.
  if (flow !== 'email' && !oauth) {
    useOnboardingStore.getState().startEmail({});
  }

  return <OnboardingPage />;
}
