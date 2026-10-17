import httpService from './http.service';
import axios from 'axios';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, SsoConfig } from '../models/Api.model';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Instance không có auth interceptor — dùng cho các public endpoint
const publicHttp = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const AuthService = {
  login: (data: LoginRequest) =>
    httpService.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', data),

  register: (data: RegisterRequest) =>
    httpService.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', data),

  getMe: () =>
    httpService.get<ApiResponse<AuthResponse['user']>>('/api/v1/auth/me'),

  forgotPassword: (email: string) =>
    publicHttp.post<ApiResponse<string>>('/api/v1/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    publicHttp.post<ApiResponse<string>>('/api/v1/auth/reset-password', { token, password }),

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
};

export default AuthService;
