import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';
import { AuditLog, PagedResponse, Role, UserDetail, UserSummary } from '../models/User.model';

const BASE = '/api/v1/admin';

const AdminService = {
  getUsers: (params: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    role?: string;
  }) =>
    httpService.get<ApiResponse<PagedResponse<UserSummary>>>(`${BASE}/users`, { params }),

  getUserDetail: (id: number) =>
    httpService.get<ApiResponse<UserDetail>>(`${BASE}/users/${id}`),

  lockUser: (id: number) =>
    httpService.patch<ApiResponse<UserDetail>>(`${BASE}/users/${id}/lock`, {}),

  unlockUser: (id: number) =>
    httpService.patch<ApiResponse<UserDetail>>(`${BASE}/users/${id}/unlock`, {}),

  deleteUser: (id: number) =>
    httpService.delete<ApiResponse<void>>(`${BASE}/users/${id}`),

  resetPassword: (id: number) =>
    httpService.post<ApiResponse<void>>(`${BASE}/users/${id}/reset-password`, {}),

  changeRole: (id: number, role: Role) =>
    httpService.patch<ApiResponse<UserDetail>>(`${BASE}/users/${id}/role`, { role }),

  getAuditLogs: (params: { page?: number; size?: number }) =>
    httpService.get<ApiResponse<PagedResponse<AuditLog>>>(`${BASE}/audit-logs`, { params }),
};

export default AdminService;
