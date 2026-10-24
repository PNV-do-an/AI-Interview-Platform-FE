export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    phone: string;
    role: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

/** Config OIDC cho Enterprise SSO, lấy từ GET /api/v1/auth/sso/config */
export interface SsoConfig {
  enabled: boolean;
  authorizationEndpoint: string;
  clientId: string;
  scopes: string;
}

/** Tài khoản ứng với link đặt lại mật khẩu, từ GET /api/v1/auth/reset-password?token= */
export interface ResetTokenInfo {
  fullName: string;
  email: string;
  role: string;
  remainingSeconds: number;
}

/** Kết quả POST /api/v1/auth/reset-password */
export interface PasswordResetResult {
  eventId: string;
  signedOutEverywhere: boolean;
}

/** Một dòng trong "Thiết bị đăng nhập hoạt động" (GET /api/user/sessions). */
export interface UserSessionInfo {
  id: number;
  deviceLabel: string | null;
  ipAddress: string | null;
  createdAt: string | null;
  lastSeenAt: string | null;
  expiresAt: string | null;
  /** Đúng phiên đang gửi request này. */
  current: boolean;
}
