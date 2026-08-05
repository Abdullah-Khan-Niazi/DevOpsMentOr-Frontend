import { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { authService } from '@/features/auth/services';
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

    if (!provider || !['google', 'github', 'linkedin'].includes(provider)) {
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

    const oauthProvider = provider as 'google' | 'github' | 'linkedin';
    const redirectUri = `${window.location.origin}/api/auth/callback/${provider}`;

    authService
      .oauthLogin({ provider: oauthProvider, code, redirectUri })
      .then((data) => {
        setSession(data);
        void navigate(ROUTES.DASHBOARD, { replace: true });
      })
      .catch(() => {
        void navigate(ROUTES.LOGIN, { replace: true });
      });
  }, [provider, searchParams, navigate, setSession]);

  return (
    <div className="auth-page auth-page--center">
      <p className="auth-status">Completing sign in…</p>
    </div>
  );
}

export default OAuthCallbackPage;
