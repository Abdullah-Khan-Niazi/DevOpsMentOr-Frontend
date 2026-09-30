import { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useOAuthLogin } from '../hooks/useOAuth';
import OnboardingPage from './OnboardingPage';
import '../styles/auth.css';

export default function SignupPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const flow = useOnboardingStore((state) => state.flow);
  const oauth = useOnboardingStore((state) => state.oauth);
  const [searchParams] = useSearchParams();
  const { initiateOAuth } = useOAuthLogin();

  const provider = searchParams.get('provider');

  useEffect(() => {
    if (provider === 'google' || provider === 'github') {
      initiateOAuth(provider);
      return;
    }
    // The signup route is the email entry point of the onboarding wizard.
    if (flow !== 'email' && !oauth) {
      useOnboardingStore.getState().startEmail({});
    }
  }, [flow, oauth, provider, initiateOAuth]);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <OnboardingPage />;
}
