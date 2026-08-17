export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
