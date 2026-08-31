import httpService from './http.service';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '../models/Api.model';

const AuthService = {
  login: (data: LoginRequest) =>
    httpService.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', data),

  register: (data: RegisterRequest) =>
    httpService.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', data),

  getMe: () =>
    httpService.get<ApiResponse<AuthResponse['user']>>('/api/v1/auth/me'),
};

export default AuthService;
