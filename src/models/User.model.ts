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
  createdAt: string;
}

export interface UserDetail {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  enabled: boolean;
  locked: boolean;
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
  action: string;
  detail: string | null;
  createdAt: string;
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
