export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  roles: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export type OAuthProvider = 'google' | 'github' | 'linkedin';

export interface OAuthCredentials {
  provider: OAuthProvider;
  code: string;
  redirectUri: string;
}

export interface OAuthSignupCredentials extends OAuthCredentials {
  username?: string;
  fullName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    tokens: AuthTokens;
  };
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (payload: LoginResponse) => void;
  clearSession: () => void;
}
