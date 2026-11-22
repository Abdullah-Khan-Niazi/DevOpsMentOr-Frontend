import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { safeRedirectPath } from '@/shared/utils';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import type {
  OAuthCodeExchange,
  OAuthSessionResult,
  OAuthSignupCodeExchange,
  SessionLoginResponse,
} from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import type {
  LoginResponse,
  OAuthCompleteCredentials,
  OAuthPendingResult,
  OAuthProvider,
} from '../types';

const PROVIDER_CONFIG: Record<string, { authUrl: string; clientId: string; scope: string }> = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
    scope: 'openid email profile',
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID ?? '',
    scope: 'user:email',
  },
};

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** PKCE verifier: 64 random bytes, base64url (86 characters, RFC 7636 range 43-128). */
function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/** PKCE S256 challenge: base64url(SHA-256(verifier)). */
async function deriveCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

type OAuthFlowMode = 'login' | 'signup';

/**
 * Per-attempt PKCE record, keyed by the `state` value. It is read and deleted
 * by the callback page, which is the only place that may complete the flow.
 */
const PKCE_KEY_PREFIX = 'oauth_pkce_';

function pkceStorageKey(state: string): string {
  return `${PKCE_KEY_PREFIX}${state}`;
}

function redirectUri(provider: string): string {
  return `${window.location.origin}/api/auth/callback/${provider}`;
}

/**
 * Preserve the `?redirect=` destination (e.g. an invite-accept URL) across the
 * provider round-trip. OAuth bounces the browser to an external origin, so the
 * only durable place is sessionStorage.
 */
const OAUTH_REDIRECT_KEY = 'oauth_redirect';

function persistOAuthRedirect(): void {
  try {
    const redirect = safeRedirectPath(new URLSearchParams(window.location.search).get('redirect'));
    if (redirect) {
      sessionStorage.setItem(OAUTH_REDIRECT_KEY, redirect);
    }
  } catch {
    // sessionStorage unavailable
  }
}

/** Return and clear the preserved redirect, or the given fallback. */
export function consumeOAuthRedirect(fallback: string): string {
  try {
    const stored = safeRedirectPath(sessionStorage.getItem(OAUTH_REDIRECT_KEY));
    sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
    if (stored) return stored;
  } catch {
    // sessionStorage unavailable
  }
  return fallback;
}

function handleOAuthResult(
  data: OAuthSessionResult,
  setSession: (payload: LoginResponse) => void,
  navigate: ReturnType<typeof useNavigate>,
): void {
  // Backend returns AuthResponseDto for existing users, or OAuthPendingResultDto for new users,
  // wrapped in the ApiSuccessResponse envelope ({ success: true, message, data: { ... } }).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = data as any;
  const inner = raw?.data ?? raw;

  if (inner?.tokens && inner?.user) {
    const sessionPayload: LoginResponse =
      raw?.success && raw?.data
        ? (raw as LoginResponse)
        : {
            success: true,
            message: 'Signed in successfully.',
            data: {
              user: inner.user,
              tokens: inner.tokens,
            },
          };
    setSession(sessionPayload);
    void navigate(consumeOAuthRedirect(ROUTES.DASHBOARD), { replace: true });
    return;
  }

  // New identity: stash the pending token and continue onboarding at the
  // "what defines you best" step, resumable if the user leaves midway.
  const pending = (inner?.pendingToken ? inner : raw) as OAuthPendingResult;
  if (pending?.pendingToken) {
    useOnboardingStore.getState().startOAuth({
      pendingToken: pending.pendingToken,
      email: pending.email,
      name: pending.name,
      provider: pending.provider,
    });
    void navigate(ROUTES.ONBOARDING, { replace: true });
  }
}

/**
 * Starts the provider round-trip with PKCE S256 and a one-time `state`. The
 * verifier and mode are stored under the state so the callback can verify and
 * consume them. Rejects when the browser cannot compute the challenge.
 */
async function redirectToProvider(provider: OAuthProvider, mode: OAuthFlowMode): Promise<void> {
  const config = PROVIDER_CONFIG[provider];
  const state = generateState();
  const verifier = generateCodeVerifier();
  const codeChallenge = await deriveCodeChallenge(verifier);

  sessionStorage.setItem(pkceStorageKey(state), JSON.stringify({ verifier, mode }));
  persistOAuthRedirect();

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri(provider),
    response_type: 'code',
    scope: config.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${config.authUrl}?${params.toString()}`;
}

export function useOAuthLogin() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const mutation = useMutation<OAuthSessionResult, ApiError, OAuthCodeExchange>({
    mutationFn: (credentials) => authService.oauthLogin(credentials),
    onSuccess: (data) => handleOAuthResult(data, setSession, navigate),
  });

  const initiateOAuth = useCallback((provider: OAuthProvider) => {
    setFeedback(null);

    const config = PROVIDER_CONFIG[provider];
    if (!config.clientId) {
      setFeedback(
        `${provider} OAuth is not configured: add VITE_${provider.toUpperCase()}_CLIENT_ID to .env`,
      );
      return;
    }

    redirectToProvider(provider, 'login').catch(() => {
      setFeedback('Sign in with this provider could not start. Try again.');
    });
  }, []);

  return { mutation, initiateOAuth, feedback };
}

export function useOAuthSignup() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const mutation = useMutation<OAuthSessionResult, ApiError, OAuthSignupCodeExchange>({
    mutationFn: (credentials) => authService.oauthSignup(credentials),
    onSuccess: (data) => handleOAuthResult(data, setSession, navigate),
  });

  const initiateOAuth = useCallback((provider: OAuthProvider) => {
    setFeedback(null);

    const config = PROVIDER_CONFIG[provider];
    if (!config.clientId) {
      setFeedback(
        `${provider} OAuth is not configured: add VITE_${provider.toUpperCase()}_CLIENT_ID to .env`,
      );
      return;
    }

    redirectToProvider(provider, 'signup').catch(() => {
      setFeedback('Sign in with this provider could not start. Try again.');
    });
  }, []);

  return { mutation, initiateOAuth, feedback };
}

export function useOAuthComplete() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const resetOnboarding = useOnboardingStore((state) => state.reset);

  return useMutation<SessionLoginResponse, ApiError, OAuthCompleteCredentials>({
    mutationFn: (credentials) => authService.oauthComplete(credentials),
    onSuccess: (data) => {
      setSession(data);
      resetOnboarding();
      void navigate(consumeOAuthRedirect(ROUTES.DASHBOARD), { replace: true });
    },
  });
}
