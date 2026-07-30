import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';
import type { LoginResponse, OAuthCredentials, OAuthSignupCredentials } from '../types';

const OAUTH_REDIRECT_URI = `${window.location.origin}/api/auth/callback`;

const PROVIDER_CONFIG: Record<
  string,
  { authUrl: string; clientId: string; scope: string }
> = {
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
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID ?? '',
    scope: 'openid email profile',
  },
};

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function useOAuthLogin() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const mutation = useMutation<LoginResponse, ApiError, OAuthCredentials>({
    mutationFn: (credentials) => authService.oauthLogin(credentials),
    onSuccess: (data) => {
      setSession(data);
      void navigate(ROUTES.DASHBOARD, { replace: true });
    },
  });

  const initiateOAuth = useCallback(
    (provider: 'google' | 'github' | 'linkedin') => {
      const config = PROVIDER_CONFIG[provider];
      if (!config.clientId) {
        return;
      }

      const state = generateState();
      sessionStorage.setItem(`oauth_state_${provider}`, state);

      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: OAUTH_REDIRECT_URI,
        response_type: 'code',
        scope: config.scope,
        state,
      });

      window.location.href = `${config.authUrl}?${params.toString()}`;
    },
    [],
  );

  return { mutation, initiateOAuth };
}

export function useOAuthSignup() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const mutation = useMutation<LoginResponse, ApiError, OAuthSignupCredentials>({
    mutationFn: (credentials) => authService.oauthSignup(credentials),
    onSuccess: (data) => {
      setSession(data);
      void navigate(ROUTES.DASHBOARD, { replace: true });
    },
  });

  const initiateOAuth = useCallback(
    (provider: 'google' | 'github' | 'linkedin') => {
      const config = PROVIDER_CONFIG[provider];
      if (!config.clientId) {
        return;
      }

      const state = generateState();
      sessionStorage.setItem(`oauth_state_${provider}`, state);

      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: OAUTH_REDIRECT_URI,
        response_type: 'code',
        scope: config.scope,
        state,
      });

      window.location.href = `${config.authUrl}?${params.toString()}`;
    },
    [],
  );

  return { mutation, initiateOAuth };
}
