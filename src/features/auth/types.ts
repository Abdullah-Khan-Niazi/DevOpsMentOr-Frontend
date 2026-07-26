export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (payload: LoginResponse) => void;
  clearSession: () => void;
}
