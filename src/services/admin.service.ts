import httpService from './http.service';
import { ApiResponse } from '../models/Api.model';
import {
  AuditLog, PagedResponse, ProfileUpdateResult, Role, UserDetail, UserStats, UserSummary,
} from '../models/User.model';
import {
  AdminSettings, BulkRoleChangeRequest, BulkUserActionResult, CategoryGroupsResponse, DashboardRange, DashboardResponse,
  JobReviewRequest, JobStatusCode, LockAccountRequest, ModerationAction, ModerationHistoryRow,
  ModerationHistoryStats, ModerationJob, ModerationJobDetail, PermissionMatrix,
} from '../models/AdminConsole.model';

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

  /** Body tùy chọn; `notifyUser` null => BE gửi email cho user. */
  lockUserWithReason: (id: number, body: LockAccountRequest) =>
    httpService.patch<ApiResponse<UserDetail>>(`${BASE}/users/${id}/lock`, body),

  bulkLockUsers: (body: { ids: number[]; reason?: string; notifyUser?: boolean }) =>
    httpService.post<ApiResponse<BulkUserActionResult>>(`${BASE}/users/bulk-lock`, body),

  bulkUnlockUsers: (body: { ids: number[] }) =>
    httpService.post<ApiResponse<BulkUserActionResult>>(`${BASE}/users/bulk-unlock`, body),

  bulkChangeRole: (body: BulkRoleChangeRequest) =>
    httpService.patch<ApiResponse<BulkUserActionResult>>(`${BASE}/users/bulk-role`, body),

  // --- Admin console 004-008: dashboard ---
  getDashboard: (days: DashboardRange) =>
    httpService.get<ApiResponse<DashboardResponse>>(`${BASE}/dashboard`, { params: { days } }),

  // --- Kiểm duyệt JD (chỉ đọc; quyết định duyệt nằm ở PATCH /jobs/{id}/review) ---
  getModerationQueue: (params: {
    page?: number;
    size?: number;
    /** BE chặn giá trị khác 4 nhãn JobStatus. */
    status?: JobStatusCode;
    search?: string;
  }) =>
    httpService.get<ApiResponse<PagedResponse<ModerationJob>>>(`${BASE}/jobs/moderation`, { params }),

  getModerationDetail: (id: number) =>
    httpService.get<ApiResponse<ModerationJobDetail>>(`${BASE}/jobs/moderation/${id}`),

  /** Param lọc quyết định tên là `decision` (không phải `action`). */
  getModerationHistory: (params: {
    page?: number;
    size?: number;
    decision?: ModerationAction;
    /** yyyy-MM-dd. */
    from?: string;
    to?: string;
    moderatorId?: number;
    search?: string;
  }) =>
    httpService.get<ApiResponse<PagedResponse<ModerationHistoryRow>>>(`${BASE}/jobs/moderation/history`, { params }),

  getModerationHistoryStats: () =>
    httpService.get<ApiResponse<ModerationHistoryStats>>(`${BASE}/jobs/moderation/history/stats`),

  /** ADMIN + STAFF; job phải đang PENDING_APPROVAL; `reason` bắt buộc khi từ chối. */
  reviewJob: (id: number, body: JobReviewRequest) =>
    httpService.patch<ApiResponse<ModerationJobDetail['job']>>(`/api/v1/jobs/${id}/review`, body),

  // --- RBAC + System settings ---
  getPermissionMatrix: () =>
    httpService.get<ApiResponse<PermissionMatrix>>(`${BASE}/permissions/matrix`),

  getSettings: () =>
    httpService.get<ApiResponse<AdminSettings>>(`${BASE}/settings`),

  /** PUT theo nhóm.key phẳng trong object lồng nhau; chỉ gửi key đã đổi. Lỗi -> 422 `{detail: {key: msg}}`, không ghi một phần. */
  updateSettings: (body: Record<string, Record<string, string | number | boolean>>) =>
    httpService.put<ApiResponse<AdminSettings>>(`${BASE}/settings`, body),

  /** Read-only (guard ADMIN): 4 nhóm phân loại employers thực nhập trên tin chưa xóa, giá trịBusyest first. */
  getCategories: () =>
    httpService.get<ApiResponse<CategoryGroupsResponse>>(`${BASE}/categories`),
};

export default AdminService;
