import { apiClient } from '@/shared/services';
import type {
  AcceptAdminInvitePayload,
  AdminInvitePayload,
  AdminLoginCredentials,
  ApiToken,
  ApiTokenCreated,
  AuthEnvelope,
  CreateApiTokenPayload,
  ForgotPasswordPayload,
  LoginCredentials,
  LoginHistoryEntry,
  LoginResponse,
  MeResponse,
  MessageResponse,
  OAuthCredentials,
  OAuthSignupCredentials,
  PendingAdminInvite,
  ResetPasswordPayload,
  ResendVerificationPayload,
  SignupCredentials,
  TwoFactorSetup,
  Verify2faPayload,
  VerifyEmailPayload,
} from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  async signup(credentials: SignupCredentials): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/register', credentials);
    return data;
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/verify-email', payload);
    return data;
  },

  async resendVerification(payload: ResendVerificationPayload): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/resend-verification', payload);
    return data;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/forgot-password', payload);
    return data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/reset-password', payload);
    return data;
  },

  async oauthLogin(credentials: OAuthCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/oauth/login', credentials);
    return data;
  },

  async oauthSignup(credentials: OAuthSignupCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/oauth/signup', credentials);
    return data;
  },

  async adminLogin(credentials: AdminLoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/admin/login', credentials);
    return data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  async getMe(): Promise<MeResponse['data']> {
    const { data } = await apiClient.get<MeResponse>('/auth/me');
    return data.data;
  },

  async enable2fa(): Promise<TwoFactorSetup> {
    const { data } = await apiClient.post<AuthEnvelope<TwoFactorSetup>>('/auth/2fa/enable');
    return data.data;
  },

  async verify2fa(payload: Verify2faPayload): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/2fa/verify', payload);
    return data;
  },

  async disable2fa(payload: Verify2faPayload): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/2fa/disable', payload);
    return data;
  },

  async listAdminInvites(): Promise<PendingAdminInvite[]> {
    const { data } = await apiClient.get<AuthEnvelope<PendingAdminInvite[]>>('/auth/admin/invites');
    return data.data;
  },

  async sendAdminInvite(payload: AdminInvitePayload): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/admin/invite', payload);
    return data;
  },

  async revokeAdminInvite(inviteId: string): Promise<void> {
    await apiClient.patch(`/auth/admin/invite/${inviteId}/revoke`);
  },

  async acceptAdminInvite(payload: AcceptAdminInvitePayload): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/admin/accept-invite', payload);
    return data;
  },

  async listApiTokens(): Promise<ApiToken[]> {
    const { data } = await apiClient.get<AuthEnvelope<ApiToken[]>>('/auth/api-tokens');
    return data.data;
  },

  async createApiToken(payload: CreateApiTokenPayload): Promise<ApiTokenCreated> {
    const { data } = await apiClient.post<AuthEnvelope<ApiTokenCreated>>(
      '/auth/api-tokens',
      payload,
    );
    return data.data;
  },

  async revokeApiToken(tokenId: number): Promise<void> {
    await apiClient.delete(`/auth/api-tokens/${tokenId}`);
  },

  async getLoginHistory(): Promise<LoginHistoryEntry[]> {
    const { data } = await apiClient.get<AuthEnvelope<LoginHistoryEntry[]>>('/auth/login-history');
    return data.data;
  },
};

export type AuthService = typeof authService;
