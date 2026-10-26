import httpService from './http.service';
import axios from 'axios';
import { ApiResponse, AuthResponse, LoginRequest, PasswordResetResult, RegisterRequest, ResetTokenInfo, SelfProfile, SsoConfig, UserSessionInfo } from '../models/Api.model';

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

  // hồ sơ tự phục vụ: base /api/user (KHÔNG có /v1) -> dùng httpService để có auth interceptor.
  // BE trả ProfileResponse TRẦN (không bọc ApiResponse): {email, fullName, phone, counterFail, role}.
  getSelfProfile: () =>
    httpService.get<SelfProfile>('/api/user/profile'),

  // POST đổi mật khẩu thì BE tăng tokenVersion => mọi phiên (kể cả máy đang dùng) chết ngay,
  // FE phải bắt người dùng đăng nhập lại.
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    httpService.post<ApiResponse<null>>('/api/user/change-password', data),

  // Đăng xuất thật: BE thu hồi dòng user_session của token đang dùng. Access token sống 24h,
  // nếu chỉ xóa storage thì token vẫn gọi được API tới hết hạn.
  // timeout ngắn + bỏ qua lỗi: luồng này chỉ gửi lệnh thu hồi, FE vẫn phải thoát được khi BE chậm.
  logout: () => httpService.post<ApiResponse<null>>('/api/v1/auth/logout', null, { timeout: 4000 }),

  getSessions: () =>
    httpService.get<ApiResponse<UserSessionInfo[]>>('/api/user/sessions'),

  revokeSession: (sessionId: number) =>
    httpService.delete<ApiResponse<null>>(`/api/user/sessions/${sessionId}`),

  // Ảnh gửi nguyên data URL (BE không giữ file); sai loại/cỡ trả 400 kèm detail theo từng khóa.
  uploadAvatar: (dataUrl: string) =>
    httpService.put<ApiResponse<null>>('/api/user/avatar', { dataUrl }),

  deleteAvatar: () => httpService.delete<ApiResponse<null>>('/api/user/avatar'),
};

export default AuthService;
