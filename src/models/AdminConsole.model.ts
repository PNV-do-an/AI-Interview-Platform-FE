/**
 * Hợp đồng Admin Console 004-008 (BE commit bfc368d, branch feature/admin-console-004-008).
 * Tất cả endpoint nhóm này guard `hasRole('ADMIN')` -> ROLE_STAFF nhận 403, FE phải ẩn khối
 * khi gọi lỗi chứ không hiển thị số demo.
 * Timestamp là LocalDateTime naive (không kèm Z) -> luôn đọc qua `parseServerTimestamp`.
 */
import { Role } from './User.model';

export type JobStatusCode = 'DRAFT' | 'PENDING_APPROVAL' | 'OPEN' | 'CLOSED';
export type ModerationAction = 'SUBMITTED' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED';
export type ModerationActorRole = 'EMPLOYER' | 'ADMIN' | 'STAFF';
export type WorkplaceModel = 'ONSITE' | 'HYBRID' | 'REMOTE';
export type AiScreeningTrack = 'LIVE_CODING' | 'SYSTEM_DESIGN' | 'ASYNC_TECHNICAL' | 'CULTURAL_FIT';

/** GET /admin/dashboard?days= - BE chỉ nhận 7|30|90, khác giá trị trả 400. */
export const DASHBOARD_RANGES = [7, 30, 90] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export interface DashboardResponse {
  rangeDays: number;
  users: {
    total: number;
    active: number;
    pendingVerification: number;
    locked: number;
    deleted: number;
    byRole: Record<Role, number>;
    newInPeriod: number;
    /** Số email đăng nhập thành công khác nhau trong mốc thời gian. */
    loginsInPeriod: number;
  };
  jobs: {
    total: number;
    byStatus: Record<JobStatusCode, number>;
    /** == moderation.pendingApproval == byStatus.PENDING_APPROVAL. */
    pendingModeration: number;
    newInPeriod: number;
  };
  interviews: {
    total: number;
    inPeriod: number;
    completedInPeriod: number;
    /** null khi chưa có phiên nào có điểm. */
    avgOverallScore: number | null;
  };
  logins: { successInPeriod: number; failedInPeriod: number };
  moderation: { pendingApproval: number };
}

/** GET /admin/jobs/moderation - một hàng hàng chờ kiểm duyệt. */
export interface ModerationJob {
  id: number;
  title: string;
  companyName: string;
  employerName: string;
  employerEmail: string;
  status: JobStatusCode;
  reviewNote: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  /** Cột placeholder phía BE, chưa có writer -> luôn null ở hiện tại. */
  aiSafetyScore: number | null;
  createdAt: string;
}

export interface ModerationRecord {
  id: number;
  actorId: number;
  actorName: string;
  actorEmail: string;
  actorRole: ModerationActorRole;
  action: ModerationAction;
  note: string | null;
  processingSeconds: number | null;
  createdAt: string;
}

/** GET /admin/jobs/moderation/{id} - `job` là JobDetailResponse đầy đủ. */
export interface ModerationJobDetail {
  job: {
    id: number;
    title: string;
    companyName: string;
    position: string;
    location: string;
    salaryRange: string;
    description: string;
    requirements: string;
    /** Chuỗi tự do phân tách bởi dấu phẩy. */
    requiredSkills: string;
    status: JobStatusCode;
    employerId: number;
    employerName: string;
    employerEmail: string;
    createdAt: string;
    updatedAt: string;
    department: string;
    experienceLevel: string;
    employmentType: string;
    workplaceModel: WorkplaceModel;
    timezoneRequirement: string;
    salaryCurrency: string;
    salaryMin: number;
    salaryMax: number;
    equityBand: string;
    annualBonus: string;
    aiScreeningEnabled: boolean;
    aiScreeningTrack: AiScreeningTrack;
    aiScreeningPassScore: number;
    aiQuestionFocusAreas: string;
    reviewNote: string | null;
  };
  submittedAt: string | null;
  decidedAt: string | null;
  aiSafetyScore: number | null;
  /** Mới nhất trước. */
  timeline: ModerationRecord[];
}

/** GET /admin/jobs/moderation/history - param lọc quyết định tên là `decision`. */
export interface ModerationHistoryRow {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  employerName: string;
  employerEmail: string;
  action: ModerationAction;
  moderatorId: number;
  moderatorEmail: string;
  note: string | null;
  processingSeconds: number | null;
  createdAt: string;
}

/** GET /admin/jobs/moderation/history/stats. */
export interface ModerationHistoryStats {
  totalDecisions: number;
  approved: number;
  rejected: number;
  avgProcessingSeconds: number | null;
}

/** PATCH /jobs/{id}/review - ADMIN + STAFF; `reason` bắt buộc khi approved=false. */
export interface JobReviewRequest {
  approved: boolean;
  reason?: string;
}

/** GET /admin/permissions/matrix - 4 vai trò tích hợp sẵn, 9 module x 5 hành động. */
export interface PermissionMatrix {
  roles: { role: string; label: string; userCount: number; builtin: boolean }[];
  modules: {
    key: string;
    label: string;
    adminOnly: boolean;
    actions: {
      action: string;
      label: string;
      granted: Record<string, boolean>;
    }[];
  }[];
}

/** GET/PUT /admin/settings. PUT chỉ gửi các key thay đổi; giá trị sai -> 422 kèm `detail`. */
export interface AdminSettings {
  general: {
    platformName: string;
    supportEmail: string;
    defaultLanguage: string;
    timezone: string;
  };
  notification: {
    inApp: boolean;
    interviewReminderEmail: boolean;
    jdDecisionEmail: boolean;
    weeklyDigestEmail: boolean;
  };
  ai: {
    interviewEnabled: boolean;
    defaultQuestionCount: number;
    maxAnswerSeconds: number;
    evaluatorModel: string;
    sttEnabled: boolean;
    promptConfig: string;
  };
  meta: { lastUpdatedAt: string | null; lastUpdatedBy: string | null };
}

/** 422 của PUT /settings: `detail` là map "nhóm.key" -> thông báo lỗi tiếng Việt. */
export interface SettingsValidationError {
  status: number;
  message: string;
  detail?: Record<string, string>;
}

export const LANGUAGE_OPTIONS = ['vi-VN', 'en-US', 'ja-JP'];
export const TIMEZONE_OPTIONS = ['GMT+7', 'GMT+8', 'GMT+9', 'GMT+0'];
export const MAX_ANSWER_SECONDS_OPTIONS = [120, 180, 300];
export const EVALUATOR_MODEL_OPTIONS = ['SMART_EVALUATOR_V2_5', 'DEEPSEEK_FAST_ENGINE', 'GPT4O_ENTERPRISE'];

/** POST /users/bulk-lock | bulk-unlock, PATCH /users/bulk-role. `ids` 1..100 phần tử. */
export interface BulkUserActionResult {
  requested: number;
  succeeded: number;
  failed: { id: number; message: string }[];
}

/** POST /users/{id}/lock - body tùy chọn, `notifyUser` null => true. */
export interface LockAccountRequest {
  reason?: string;
  notifyUser?: boolean;
}

export interface BulkRoleChangeRequest {
  ids: number[];
  role: Role;
}

export const MODERATION_ACTION_LABELS: Record<ModerationAction, string> = {
  SUBMITTED: 'Gửi duyệt',
  RESUBMITTED: 'Gửi lại',
  APPROVED: 'Phê duyệt',
  REJECTED: 'Từ chối',
};

export const JOB_STATUS_LABELS: Record<JobStatusCode, string> = {
  DRAFT: 'Bản nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
};
