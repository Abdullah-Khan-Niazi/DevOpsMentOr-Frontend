import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { toast } from '@/shared/components';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOnboardingStore } from '@/features/auth/stores/onboardingStore';
import { authService } from '@/features/auth/services';
import type { LoginResponse, OAuthPendingResult } from '@/features/auth/types';
import { getDefaultRouteForUser } from '@/features/auth/utils/rbac';
import { consumeOAuthRedirect } from '@/features/auth/hooks/useOAuth';
import '../styles/auth.css';

const PKCE_KEY_PREFIX = 'oauth_pkce_';

interface StoredPkce {
  verifier: string;
  mode: 'login' | 'signup';
}

function readPkceRecord(state: string): StoredPkce | null {
  try {
    const raw = sessionStorage.getItem(`${PKCE_KEY_PREFIX}${state}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPkce>;
    if (typeof parsed.verifier !== 'string') return null;
    return {
      verifier: parsed.verifier,
      mode: parsed.mode === 'signup' ? 'signup' : 'login',
    };
  } catch {
    // sessionStorage unavailable or the record is not valid JSON
    return null;
  }
}

/** Removes the one-time PKCE record for this `state` before the code exchange. */
function deletePkceRecord(state: string): void {
  try {
    sessionStorage.removeItem(`${PKCE_KEY_PREFIX}${state}`);
  } catch {
    // sessionStorage unavailable
  }
}

interface CallbackParams {
  code: string | null;
  state: string | null;
  /** True only when code, state and a matching PKCE record are all present. */
  valid: boolean;
}

/** Reads the callback query and checks the stored state. Pure: nothing is consumed here. */
function readCallbackParams(searchParams: URLSearchParams): CallbackParams {
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const valid = Boolean(code && state && readPkceRecord(state));
  return { code, state, valid };
}

function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const calledRef = useRef(false);
  const [callback] = useState(() => readCallbackParams(searchParams));

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!provider || !['google', 'github'].includes(provider)) {
      void navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    // Strip code and state from the address bar before anything else, so they
    // never stay in the history entry or the URL the user can copy.
    window.history.replaceState(window.history.state, '', window.location.pathname);

    const { code, state } = callback;
    if (!callback.valid || !code || !state) return;

    const pkce = readPkceRecord(state);
    deletePkceRecord(state);
    if (!pkce) {
      void navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    const oauthProvider = provider as 'google' | 'github';
    const redirectUri = `${window.location.origin}/api/auth/callback/${provider}`;
    const exchange = { provider: oauthProvider, code, redirectUri, codeVerifier: pkce.verifier };

    const request =
      pkce.mode === 'signup' ? authService.oauthSignup(exchange) : authService.oauthLogin(exchange);

    request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // Honor a redirect preserved across the provider round-trip
          // (e.g. an invite link) before falling back to the default route.
          void navigate(consumeOAuthRedirect(getDefaultRouteForUser(inner.user)), {
            replace: true,
          });
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
  }, [provider, callback, navigate, setSession]);

  if (!callback.valid) {
    return (
      <div className="auth-page auth-page--center">
        <p className="auth-status">This sign in link is invalid or has expired.</p>
        <Link to={ROUTES.LOGIN}>Back to sign in</Link>
      </div>
    );
  }

  return (
    <div className="auth-page auth-page--center">
      <p className="auth-status">Completing sign in...</p>
    </div>
  );
}

export default OAuthCallbackPage;
