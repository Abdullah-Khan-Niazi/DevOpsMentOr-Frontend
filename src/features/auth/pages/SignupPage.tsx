import { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useOAuthLogin } from '../hooks/useOAuth';
import { extractInvitationToken } from '../utils/invitation';
import OnboardingPage from './OnboardingPage';
import '../styles/auth.css';

export default function SignupPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const flow = useOnboardingStore((state) => state.flow);
  const oauth = useOnboardingStore((state) => state.oauth);
  const [searchParams] = useSearchParams();
  const { initiateOAuth } = useOAuthLogin();

  const provider = searchParams.get('provider');
  const rawInvite =
    searchParams.get('token') ||
    searchParams.get('code') ||
    searchParams.get('invite');

  useEffect(() => {
    if (provider === 'google' || provider === 'github') {
      initiateOAuth(provider);
      return;
    }

    const emailParam = searchParams.get('email');

    if (rawInvite) {
      const extracted = extractInvitationToken(rawInvite);
      if (extracted) {
        useOnboardingStore.getState().setAccountType('member');
        useOnboardingStore.getState().setInvitationCode(extracted);
      }
    }

    if (emailParam) {
      useOnboardingStore.getState().setEmail(emailParam);
    }

    // The signup route is the email entry point of the onboarding wizard.
    if (flow !== 'email' && !oauth) {
      useOnboardingStore.getState().startEmail({
        email: emailParam ?? undefined,
      });
    }
  }, [flow, oauth, provider, rawInvite, searchParams, initiateOAuth]);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <OnboardingPage />;
}
