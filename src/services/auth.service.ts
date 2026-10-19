import httpService from './http.service';
import axios from 'axios';
import { ApiResponse, AuthResponse, LoginRequest, PasswordResetResult, RegisterRequest, ResetTokenInfo, SsoConfig } from '../models/Api.model';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Instance không có auth interceptor — dùng cho các public endpoint
const publicHttp = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const AuthService = {
  // login/register đi publicHttp: 401 của chúng KHÔNG được rơi vào interceptor
  // refresh-token (xóa storage + window.location.href='/login'), nếu không trình
  // duyệt reload ngay và nuốt mất thông báo lỗi (mật khẩu sai / chưa kích hoạt).
  login: (data: LoginRequest) =>
    publicHttp.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', data),

  register: (data: RegisterRequest) =>
    publicHttp.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', data),

  resendVerification: (email: string) =>
    publicHttp.post<ApiResponse<string>>('/api/v1/auth/resend-verification', { email }),

  getMe: () =>
    httpService.get<ApiResponse<AuthResponse['user']>>('/api/v1/auth/me'),

  forgotPassword: (email: string) =>
    publicHttp.post<ApiResponse<string>>('/api/v1/auth/forgot-password', { email }),

  getResetTokenInfo: (token: string) =>
    publicHttp.get<ApiResponse<ResetTokenInfo>>('/api/v1/auth/reset-password', { params: { token } }),

  resetPassword: (token: string, password: string, confirmPassword: string, signOutEverywhere: boolean) =>
    publicHttp.post<ApiResponse<PasswordResetResult>>('/api/v1/auth/reset-password', {
      token,
      password,
      confirmPassword,
      signOutEverywhere,
    }),

  // Dùng publicHttp để 401 từ Google không kích hoạt interceptor refresh của httpService
  getGoogleClientId: () =>
    publicHttp.get<ApiResponse<string>>('/api/v1/auth/google/client-id'),

  googleLogin: (idToken: string) =>
    publicHttp.post<ApiResponse<AuthResponse>>('/api/v1/auth/google', { idToken }),

  getGithubClientId: () =>
    publicHttp.get<ApiResponse<string>>('/api/v1/auth/github/client-id'),

  githubLogin: (code: string, redirectUri: string) =>
    publicHttp.post<ApiResponse<AuthResponse>>('/api/v1/auth/github', { code, redirectUri }),

  getSsoConfig: () =>
    publicHttp.get<ApiResponse<SsoConfig>>('/api/v1/auth/sso/config'),

  ssoLogin: (code: string, redirectUri: string, nonce: string) =>
    publicHttp.post<ApiResponse<AuthResponse>>('/api/v1/auth/sso', { code, redirectUri, nonce }),

  verifyEmail: (token: string) =>
    publicHttp.get<ApiResponse<string>>('/api/v1/auth/verify', { params: { token } }),
};

export default AuthService;
