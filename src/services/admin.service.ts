import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';
import {
  AuditLog, PagedResponse, ProfileUpdateResult, Role, UserDetail, UserStats, UserSummary,
} from '../models/User.model';

const BASE = '/api/v1/admin';

const AdminService = {
  getUsers: (params: {
    page?: number;
    size?: number;
    search?: string;
    /** ACTIVE | INACTIVE | LOCKED | PENDING (DELETED -> dùng getDeletedUsers, BE chặn 400). */
    status?: string;
    role?: string;
  }) =>
    httpService.get<ApiResponse<PagedResponse<UserSummary>>>(`${BASE}/users`, { params }),

  /** DELETED không lọc qua /users (BE trả 400) - danh sách xóa mềm có endpoint riêng. */
  getDeletedUsers: (params: { page?: number; size?: number; search?: string; role?: string }) =>
    httpService.get<ApiResponse<PagedResponse<UserSummary>>>(`${BASE}/users/deleted`, { params }),

  getUserStats: (params: { search?: string; role?: string }) =>
    httpService.get<ApiResponse<UserStats>>(`${BASE}/users/stats`, { params }),

  /** Server-side CSV, cùng bộ lọc với danh sách; >10.000 dòng -> 400. Response là text, không phải ApiResponse. */
  exportUsersCsv: (params: { search?: string; status?: string; role?: string }) =>
    httpService.get<string>(`${BASE}/users/export`, { params, responseType: 'text' }),

  inviteUser: (body: { fullName: string; email: string; role: Role; phone?: string }) =>
    httpService.post<ApiResponse<UserDetail>>(`${BASE}/users`, body),

  resendInvitation: (id: number) =>
    httpService.post<ApiResponse<UserDetail>>(`${BASE}/users/${id}/invitation/resend`, {}),

  revokeInvitation: (id: number) =>
    httpService.delete<ApiResponse<UserDetail>>(`${BASE}/users/${id}/invitation`),

  updateProfile: (id: number, body: { fullName?: string; email?: string; phone?: string }) =>
    httpService.patch<ApiResponse<ProfileUpdateResult>>(`${BASE}/users/${id}`, body),

  getUserDetail: (id: number) =>
    httpService.get<ApiResponse<UserDetail>>(`${BASE}/users/${id}`),

  lockUser: (id: number) =>
    httpService.patch<ApiResponse<UserDetail>>(`${BASE}/users/${id}/lock`, {}),

  unlockUser: (id: number) =>
    httpService.patch<ApiResponse<UserDetail>>(`${BASE}/users/${id}/unlock`, {}),

  setUserStatus: (id: number, enabled: boolean) =>
    httpService.patch<ApiResponse<UserDetail>>(`${BASE}/users/${id}/status`, { enabled }),

  deleteUser: (id: number) =>
    httpService.delete<ApiResponse<void>>(`${BASE}/users/${id}`),

  restoreUser: (id: number) =>
    httpService.post<ApiResponse<UserDetail>>(`${BASE}/users/${id}/restore`, {}),

  resetPassword: (id: number) =>
    httpService.post<ApiResponse<void>>(`${BASE}/users/${id}/reset-password`, {}),

  changeRole: (id: number, role: Role) =>
    httpService.patch<ApiResponse<UserDetail>>(`${BASE}/users/${id}/role`, { role }),

  getAuditLogs: (params: {
    page?: number;
    size?: number;
    adminId?: number;
    targetUserId?: number;
    action?: string;
    /** yyyy-MM-dd hoặc yyyy-MM-ddTHH:mm:ss; date-only `to` = hết ngày (BE parse). */
    from?: string;
    to?: string;
  }) =>
    httpService.get<ApiResponse<PagedResponse<AuditLog>>>(`${BASE}/audit-logs`, { params }),
};

export default AdminService;
