export type Role = 'ROLE_USER' | 'ROLE_STAFF' | 'ROLE_ADMIN' | 'ROLE_INTERVIEWER';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'DELETED';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
}

export interface UserSummary {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  status: AccountStatus;
  /** True khi link mời/verify chưa bao giờ được bấm (BE: verificationToken != null). */
  pendingVerification: boolean;
  /** Lần đăng nhập thành công gần nhất từ login_attempts; null = chưa từng vào. */
  lastLoginAt: string | null;
  createdAt: string;
  deletedAt: string | null;
}

export interface UserDetail {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  enabled: boolean;
  locked: boolean;
  /** Thời điểm khóa bởi admin (khác blockedUntil - khóa tạm do brute-force). */
  lockedAt: string | null;
  /** Khác null khi đang bị chặn login vì nhập sai mật khẩu; BE chỉ trả khi còn hiệu lực. */
  blockedUntil: string | null;
  failedLoginAttempts: number;
  /** True khi link mời/verify chưa bao giờ được bấm. */
  pendingVerification: boolean;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AuditLog {
  id: number;
  adminId: number;
  adminEmail: string;
  targetUserId: number | null;
  /** null khi tài khoản đích không còn trong users. */
  targetEmail: string | null;
  targetFullName: string | null;
  action: string;
  detail: string | null;
  /** false = hành động bị rule nghiệp vụ từ chối (BE vẫn ghi audit). */
  succeeded: boolean;
  reason: string | null;
  createdAt: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  ROLE_USER: 'Candidate',
  ROLE_STAFF: 'Staff',
  ROLE_ADMIN: 'Administrator',
  ROLE_INTERVIEWER: 'Interviewer',
};

/** Enum AuditAction kín phía BE - nguồn: model/enums/AuditAction.java. */
export const AUDIT_ACTIONS = [
  'VIEW_USER', 'LOCK_USER', 'UNLOCK_USER', 'ENABLE_USER', 'DISABLE_USER',
  'DELETE_USER', 'RESTORE_USER', 'RESET_PASSWORD', 'CHANGE_ROLE',
  'INVITE_USER', 'RESEND_INVITATION', 'REVOKE_INVITATION', 'UPDATE_PROFILE', 'EXPORT_USERS',
] as const;

/** GET /users/stats - đếm theo cùng bộ lọc search/role với danh sách. */
export interface UserStats {
  total: number;
  active: number;
  pendingVerification: number;
  locked: number;
  disabled: number;
  deleted: number;
  /** "đăng nhập thành công trong 30 ngày qua" (login_attempts), không phải mọi hoạt động. */
  activeLast30Days: number;
}

/** PATCH /users/{id} - BE trả cờ emailChanged để FE nói đúng hệ quả (về trạng thái chờ mời). */
export interface ProfileUpdateResult {
  user: UserDetail;
  emailChanged: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // current page (0-based)
  size: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
