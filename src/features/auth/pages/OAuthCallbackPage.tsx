import { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { toast } from '@/shared/components';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOnboardingStore } from '@/features/auth/stores/onboardingStore';
import { authService } from '@/features/auth/services';
import type { LoginResponse, OAuthPendingResult } from '@/features/auth/types';
import '../styles/auth.css';

function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!provider || !['google', 'github'].includes(provider)) {
      void navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const savedState = sessionStorage.getItem(`oauth_state_${provider}`);

    sessionStorage.removeItem(`oauth_state_${provider}`);

    if (!code || !state || state !== savedState) {
      void navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    sessionStorage.removeItem('oauth_mode');

    const oauthProvider = provider as 'google' | 'github';
    const redirectUri = `${window.location.origin}/api/auth/callback/${provider}`;

    authService
      .oauthLogin({ provider: oauthProvider, code, redirectUri })
      .then((data: any) => {
        // Backend returns AuthResponseDto for existing users, or OAuthPendingResultDto for new users,
        // wrapped in the ApiSuccessResponse envelope ({ success: true, message, data: { ... } }).
        const inner = data?.data ?? data;

        if (inner?.tokens && inner?.user) {
          const sessionPayload: LoginResponse =
            data?.success && data?.data
              ? (data as LoginResponse)
              : {
                  success: true,
                  message: 'Signed in successfully.',
                  data: {
                    user: inner.user,
                    tokens: inner.tokens,
                  },
                };
          setSession(sessionPayload);
          void navigate(ROUTES.DASHBOARD, { replace: true });
          return;
        }

        const pending = (inner?.pendingToken ? inner : data) as OAuthPendingResult;
        if (pending?.pendingToken) {
          useOnboardingStore.getState().startOAuth({
            pendingToken: pending.pendingToken,
            email: pending.email,
            name: pending.name,
            provider: pending.provider,
          });
          void navigate(ROUTES.ONBOARDING, { replace: true });
          return;
        }

        toast.error('OAuth response was missing session details.');
        void navigate(ROUTES.LOGIN, { replace: true });
      })
      .catch((err) => {
        toast.error(err?.message ?? 'OAuth sign in failed.');
        void navigate(ROUTES.LOGIN, { replace: true });
      });
  }, [provider, searchParams, navigate, setSession]);

  return (
    <div className="auth-page auth-page--center">
      <p className="auth-status">Completing sign in...</p>
    </div>
  );
}

export default OAuthCallbackPage;
