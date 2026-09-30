import type { ApiError, ApiResponse } from '@/shared/types';

/* ─── Backend DTO mirrors (F1 auth surfaces) ─────────────────────────────── */

export interface AuthUser {
  userId: number;
  username: string;
  email: string;
  fullName: string | null;
  status: string;
  isVerified: boolean;
  twoFactorEnabled?: boolean;
  roles: string[];
  permissions?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthEnvelope<T> extends ApiResponse<T> {
  success: boolean;
  message: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    tokens: AuthTokens;
  };
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: {
    userId: number;
    username: string;
    email: string;
    fullName: string | null;
    status: string;
    isVerified: boolean;
    twoFactorEnabled: boolean;
    roles: string[];
    permissions: string[];
  };
}

export interface MessageData {
  message: string;
}

export interface MessageResponse {
  success: boolean;
  message: string;
  data: MessageData;
}

/* ─── Credentials ────────────────────────────────────────────────────────── */

export interface LoginCredentials {
  email: string;
  password: string;
  totpCode?: string;
}

export type AdminLoginCredentials = LoginCredentials;

export type AccountType = 'individual' | 'organization' | 'member';

export interface OrganizationInput {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  billingEmail?: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  fullName: string;
  accountType: AccountType;
  organization?: OrganizationInput;
  invitationCode?: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

/* ─── Two-factor ─────────────────────────────────────────────────────────── */

export interface TwoFactorSetup {
  secret: string;
  otpAuthUri: string;
}

export interface Verify2faPayload {
  code: string;
  secret?: string;
}

/* ─── OAuth ──────────────────────────────────────────────────────────────── */

export type OAuthProvider = 'google' | 'github';

export interface OAuthCredentials {
  provider: OAuthProvider;
  code: string;
  redirectUri: string;
}

export interface OAuthSignupCredentials extends OAuthCredentials {
  username?: string;
  fullName?: string;
}

export interface OAuthPendingResult {
  exists: false;
  pendingToken: string;
  email: string;
  name: string;
  provider: OAuthProvider;
}

export interface OAuthPendingEnvelope {
  success: boolean;
  message: string;
  data: OAuthPendingResult;
}

export type OAuthLoginResult = LoginResponse | OAuthPendingEnvelope | OAuthPendingResult;

interface BaseOAuthComplete {
  pendingToken: string;
  username?: string;
  fullName?: string;
}

export type OAuthCompleteCredentials =
  | (BaseOAuthComplete & { accountType: 'individual' })
  | (BaseOAuthComplete & { accountType: 'organization'; organization: OrganizationInput })
  | (BaseOAuthComplete & { accountType: 'member'; invitationCode: string });

/* ─── Admin invitations ──────────────────────────────────────────────────── */

export interface AdminInvitePayload {
  email: string;
  fullName: string;
}

export interface AcceptAdminInvitePayload {
  token: string;
  email: string;
  password: string;
  fullName: string;
  username: string;
}

export interface PendingAdminInvite {
  id: string;
  email: string;
  fullName: string;
  expiresAt: string;
}

/* ─── API tokens ─────────────────────────────────────────────────────────── */

export interface CreateApiTokenPayload {
  tokenName: string;
  expiresInDays?: number;
}

export interface ApiToken {
  tokenId: number;
  tokenName: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
}

export interface ApiTokenCreated extends ApiToken {
  rawToken: string;
}

/* ─── Login history ──────────────────────────────────────────────────────── */

export interface LoginHistoryEntry {
  loginId: number;
  createdAt: string;
  loginType: 'email' | 'google' | 'github';
  isSuccessful: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

/* ─── Store ──────────────────────────────────────────────────────────────── */

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setSession: (payload: LoginResponse) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
}

export type { ApiError };
