import httpService from './http.service';
import axios from 'axios';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '../models/Api.model';

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
};

export default AuthService;
