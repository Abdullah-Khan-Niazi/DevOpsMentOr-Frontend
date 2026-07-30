import { apiClient } from '@/shared/services';
import type {
  LoginCredentials,
  LoginResponse,
  OAuthCredentials,
  OAuthSignupCredentials,
  SignupCredentials,
} from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  async signup(credentials: SignupCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/register', credentials);
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

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<LoginResponse['data']['user']> {
    const { data } = await apiClient.get<LoginResponse['data']['user']>('/auth/me');
    return data;
  },
};

export type AuthService = typeof authService;
