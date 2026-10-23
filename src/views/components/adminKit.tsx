import React from 'react';
import { Link } from 'react-router-dom';
import { parseServerTimestamp } from '../../utils/date';
import { Role } from '../../models/User.model';

/**
 * Bộ primitive dùng chung cho Admin Console (mockup Stitch 2026-10-21).
 * Class chép verbatim từ HTML mockup, chỉ đổi tên token sang alias đã khai báo trong
 * tailwind.config.js (surface-container-* / ds-* / outline-variant / *-container).
 * Quy ước: `text-ds-*` là scale DESIGN.md (khác scale cũ của màn candidate).
 */

export const ICON = 'material-symbols-outlined';

/** Nút theo mockup: primary-container -> hover primary; ghost = nền thấp; danger = error-container. */
export const adminButton = (tone: 'primary' | 'ghost' | 'danger' | 'soft' = 'primary', extra = ''): string => {
  const base = 'h-10 inline-flex items-center gap-2 rounded-lg px-4 text-ds-label-md font-semibold transition-all shadow-sm cursor-pointer border-0 whitespace-nowrap';
  const tones = {
    primary: 'bg-primary-container text-on-primary hover:bg-primary',
    ghost: 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high',
    danger: 'bg-error text-on-error hover:opacity-90',
    soft: 'bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high',
  };
  return `${base} ${tones[tone]} ${extra}`.trim();
};

export const adminInputClass =
  'w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface text-ds-body-sm placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition-all';

export const adminSelectClass =
  'w-full h-10 px-3 pr-8 rounded-lg bg-surface-container-low text-on-surface text-ds-body-sm appearance-none outline-none focus:bg-surface-container-lowest shadow-sm transition-all cursor-pointer border-0';

/** Thẻ nội dung nền trắng, bo xl, bóng nhẹ - khung của mọi khối trong mockup. */
export const AdminCard: React.FC<{
  title?: string; description?: string; icon?: string; actions?: React.ReactNode;
  className?: string; bodyClass?: string; children: React.ReactNode;
}> = ({ title, description, icon, actions, className = '', bodyClass = '', children }) => (
  <section className={`bg-surface-container-lowest rounded-2xl shadow-sm ${className}`}>
    {(title || actions) && (
      <header className="flex items-start justify-between gap-space-md p-space-lg pb-0">
        <div className="flex items-start gap-space-sm min-w-0">
          {icon && (
            <span className="w-9 h-9 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
              <span className={`${ICON} text-[20px]`}>{icon}</span>
            </span>
          )}
          <div className="min-w-0">
            {title && <h2 className="text-ds-headline-sm text-on-surface font-bold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-ds-body-sm text-on-surface-variant">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-space-sm shrink-0">{actions}</div>}
      </header>
    )}
    <div className={`p-space-lg ${bodyClass}`}>{children}</div>
  </section>
);

/** Header trang: breadcrumb động + tiêu đề + mô tả + cụm action góc phải (đúng block mb-space-lg). */
export const AdminPageHeader: React.FC<{
  crumbs: { label: string; to?: string; icon?: string }[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ crumbs, title, subtitle, actions }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-space-md mb-space-lg">
    <div className="min-w-0">
      <nav className="flex items-center gap-1 flex-wrap text-ds-label-md text-on-surface-variant mb-1.5">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={`${crumb.label}-${i}`}>
            {i > 0 && <span className="text-outline-variant font-bold">/</span>}
            {crumb.to ? (
              <Link to={crumb.to} className="hover:text-primary transition-colors inline-flex items-center gap-1 no-underline text-inherit">
                {crumb.icon && <span className={`${ICON} text-[16px]`}>{crumb.icon}</span>}
                {crumb.label}
              </Link>
            ) : (
              <span className={`inline-flex items-center gap-1 ${i === crumbs.length - 1 ? 'text-primary font-semibold' : ''}`}>
                {crumb.icon && <span className={`${ICON} text-[16px]`}>{crumb.icon}</span>}
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
      <h1 className="text-ds-headline-lg text-on-surface font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-ds-body-sm text-on-surface-variant mt-0.5 max-w-3xl">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-space-sm self-start md:self-auto shrink-0">{actions}</div>}
  </div>
);

export type StatTone = 'primary' | 'success' | 'danger' | 'neutral';

const STAT_TONE: Record<StatTone, { chip: string; value: string; bar: string; pill: string }> = {
  primary: {
    chip: 'bg-surface-container-high text-primary',
    value: 'text-on-surface',
    bar: 'bg-primary-container',
    pill: 'bg-secondary-container/40 text-secondary-teal',
  },
  success: {
    chip: 'bg-secondary-container/40 text-secondary-teal',
    value: 'text-on-surface',
    bar: 'bg-secondary-teal',
    pill: 'bg-secondary-container/40 text-secondary-teal',
  },
  danger: {
    chip: 'bg-error-container/60 text-error',
    value: 'text-error',
    bar: 'bg-error',
    pill: 'bg-error-container/50 text-error',
  },
  neutral: {
    chip: 'bg-surface-container-high text-primary-container',
    value: 'text-on-surface',
    bar: 'bg-primary-container',
    pill: 'bg-surface-container-high text-on-surface-variant',
  },
};

/** Card chỉ số: nhãn + icon, số lớn + đơn vị, pill phụ, thanh tiến trình. */
export const StatCard: React.FC<{
  label: string; value: React.ReactNode; unit?: string; icon: string; tone?: StatTone;
  pill?: React.ReactNode; barPct?: number; footnote?: string;
}> = ({ label, value, unit, icon, tone = 'primary', pill, barPct, footnote }) => {
  const t = STAT_TONE[tone];
  return (
    <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-center justify-between gap-space-sm">
        <span className="text-ds-label-md text-on-surface-variant uppercase tracking-wider font-semibold">{label}</span>
        <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${t.chip}`}>
          <span className={`${ICON} text-[22px]`}>{icon}</span>
        </span>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className={`text-ds-headline-xl font-bold ${t.value} truncate`}>{value}</span>
          {unit && <span className="text-ds-label-md text-on-surface-variant">{unit}</span>}
        </div>
        {pill && (
          <span className={`text-ds-label-sm px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5 whitespace-nowrap ${t.pill}`}>
            {pill}
          </span>
        )}
      </div>
      {typeof barPct === 'number' && (
        <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-3 overflow-hidden">
          <div className={`${t.bar} h-full rounded-full`} style={{ width: `${Math.max(0, Math.min(100, barPct))}%` }} />
        </div>
      )}
      {footnote && <p className="mt-2 text-ds-body-sm text-on-surface-variant">{footnote}</p>}
    </div>
  );
};

export const adminThClass =
  'h-11 px-4 text-left text-ds-label-md font-semibold uppercase tracking-wider text-on-surface-variant bg-surface-container-low border-b border-outline-variant/60 whitespace-nowrap';
export const adminTdClass = 'px-4 py-3 text-ds-body-md text-on-surface border-b border-outline-variant/40 align-middle';
export const adminTableClass = 'w-full border-collapse';

export const Pill: React.FC<{
  tone?: 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info'; children: React.ReactNode; icon?: string;
}> = ({ tone = 'neutral', children, icon }) => {
  const map: Record<string, string> = {
    neutral: 'bg-surface-container-high text-on-surface-variant',
    primary: 'bg-primary-fixed text-on-primary-fixed-variant',
    success: 'bg-secondary-container text-on-secondary-container',
    danger: 'bg-error-container text-on-error-container',
    warning: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    info: 'bg-surface-container text-on-surface-variant',
  };
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-full text-ds-label-sm font-bold ${map[tone]}`}>
      {icon && <span className={`${ICON} text-[14px]`}>{icon}</span>}
      {children}
    </span>
  );
};

/**
 * Nhãn cho khối giữ số liệu nguyên văn mockup vì BE chưa có endpoint
 * (luật wave admin 2026-10-21, spec/INDEX.md + spec/conventions/frontend-ui.md §3).
 */
export const DemoTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Pill icon="hive">{children}</Pill>
);

export const LoadingBlock: React.FC<{ label?: string }> = ({ label = 'Đang tải dữ liệu...' }) => (
  <div className="flex items-center justify-center gap-2 py-space-2xl text-on-surface-variant text-ds-body-md">
    <span className={`${ICON} animate-spin text-[20px]`}>progress_activity</span>
    {label}
  </div>
);

export const EmptyBlock: React.FC<{ icon?: string; title: string; description?: string; action?: React.ReactNode }> = ({
  icon = 'inbox', title, description, action,
}) => (
  <div className="flex flex-col items-center justify-center gap-2 py-space-2xl text-center">
    <span className={`${ICON} text-[34px] text-outline`}>{icon}</span>
    <p className="text-ds-headline-sm text-on-surface font-semibold">{title}</p>
    {description && <p className="text-ds-body-sm text-on-surface-variant max-w-md">{description}</p>}
    {action}
  </div>
);

/** Banner lỗi theo mockup: error-container + icon danger, kèm nút thử lại. */
export const ErrorBlock: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex items-start justify-between gap-space-md rounded-xl bg-error-container px-4 py-3 text-ds-body-md text-on-error-container">
    <span className="flex items-start gap-2">
      <span className={`${ICON} text-[20px]`}>error</span>
      <span>{message}</span>
    </span>
    {onRetry && (
      <button type="button" onClick={onRetry} className={adminButton('ghost', 'h-9 shrink-0')}>
        <span className={`${ICON} text-[18px]`}>refresh</span>Thử lại
      </button>
    )}
  </div>
);

/** Ô tìm kiếm có icon trái (dùng trong filter bar). */
export const SearchField: React.FC<{
  value: string; onChange: (v: string) => void; placeholder: string; onSubmit?: () => void; className?: string;
}> = ({ value, onChange, placeholder, onSubmit, className = '' }) => (
  <div className={`relative ${className}`}>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="contents"
    >
      <span className={`${ICON} text-[20px] text-outline-strong absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none`}>
        search
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${adminInputClass} pl-10`}
      />
    </form>
  </div>
);

export const FieldLabel: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <label className="block mb-1.5">
    <span className="text-ds-label-md font-semibold uppercase tracking-wider text-on-surface-variant">{children}</span>
    {hint && <span className="block normal-case tracking-normal font-normal text-ds-body-sm text-on-surface-variant">{hint}</span>}
  </label>
);

/** Switch theo hình dạng mockup (toggle pill, không dùng checkbox trần). */
export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }> = ({
  checked, onChange, label, disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors border-0 cursor-pointer shrink-0 ${
      checked ? 'bg-primary' : 'bg-outline-variant'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-container-lowest shadow-sm transition-transform"
      style={{ transform: checked ? 'translateX(20px)' : 'none' }}
    />
  </button>
);

/** Phân trang kiểu mockup: "Hiển thị x–y trên z" + nút trang. */
export const Pagination: React.FC<{
  page: number; pageSize: number; total: number; onPage: (p: number) => void;
}> = ({ page, pageSize, total, onPage }) => {
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pt-space-md">
      <span className="text-ds-body-sm text-on-surface-variant">
        Hiển thị {from}–{to} trên {total.toLocaleString('vi-VN')} bản ghi
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 0}
          className={adminButton('ghost', 'h-9 px-3 disabled:opacity-40')}
        >
          <span className={`${ICON} text-[18px]`}>chevron_left</span>
        </button>
        <span className="text-ds-label-md text-on-surface-variant px-2">
          Trang {page + 1} / {pages}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page + 1 >= pages}
          className={adminButton('ghost', 'h-9 px-3 disabled:opacity-40')}
        >
          <span className={`${ICON} text-[18px]`}>chevron_right</span>
        </button>
      </div>
    </div>
  );
};

/** fmt: 'datetime' | 'date' | 'time' | 'relative'. BE trả LocalDateTime naive -> parseServerTimestamp. */export const fmtServer = (value: string | null | undefined, mode: 'datetime' | 'date' | 'time' = 'datetime'): string => {
  const d = parseServerTimestamp(value);
  if (!d) return '—';
  const locale = 'vi-VN';
  if (mode === 'date') return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (mode === 'time') return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return `${d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
};

export const timeAgo = (value: string | null | undefined): string => {
  const d = parseServerTimestamp(value);
  if (!d) return '—';
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  return `${Math.round(diffH / 24)} ngày trước`;
};

/** Tách chuỗi phân tách dấu phẩy (requiredSkills / aiQuestionFocusAreas) thành danh sách gọn. */
export const splitCsv = (value: string | null | undefined): string[] =>
  (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);

export interface SalaryFields {
  salaryRange: string | null | undefined;
  salaryMin: number | null | undefined;
  salaryMax: number | null | undefined;
  salaryCurrency: string | null | undefined;
}

/**
 * Nhãn mức lương JD. `salaryRange` là chuỗi tự do NTD nhập, `salaryMin/Max` là dải cấu trúc
 * và BE để null khi tin không nhập (cả 4 cột đều nullable trong JobDescription) -> không bao
 * giờ render chữ "null".
 */
export const salaryLabel = (job: SalaryFields): string => {
  const range = (job.salaryRange ?? '').trim();
  if (range) return range;
  const cur = (job.salaryCurrency ?? '').trim();
  const nums = [job.salaryMin, job.salaryMax].filter((v): v is number => v != null);
  if (nums.length === 0) return 'Chưa công khai';
  return `${nums.map((v) => v.toLocaleString('vi-VN')).join(' - ')}${cur ? ` ${cur}` : ''}`;
};

export const errorText = (err: unknown, fallback = 'Không tải được dữ liệu.'): string => {
  const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
  return anyErr?.response?.data?.message || anyErr?.message || fallback;
};

/**
 * Nhãn vai trò tiếng Việt theo mockup admin (giữ riêng vì mockup gọi ROLE_INTERVIEWER là
 * "Nhà tuyển dụng / Cố vấn"). ROLE_STAFF không có trong mockup nhưng BE vẫn trả về nên phải có nhãn.
 */
export const ROLE_VN: Record<Role, string> = {
  ROLE_USER: 'Ứng viên',
  ROLE_INTERVIEWER: 'Nhà tuyển dụng / Cố vấn',
  ROLE_STAFF: 'Nhân viên vận hành',
  ROLE_ADMIN: 'Quản trị viên',
};

export const ROLE_ICON: Record<Role, string> = {
  ROLE_USER: 'school',
  ROLE_INTERVIEWER: 'work',
  ROLE_STAFF: 'badge',
  ROLE_ADMIN: 'admin_panel_settings',
};

/** Pill vai trò: màu nền đúng theo mockup (tertiary-fixed / secondary-fixed / primary-container). */
export const ROLE_CHIP: Record<Role, string> = {
  ROLE_USER: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  ROLE_INTERVIEWER: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  ROLE_STAFF: 'bg-surface-container-high text-on-surface-variant',
  ROLE_ADMIN: 'bg-primary-container text-on-primary',
};

export const ROLE_AVATAR: Record<Role, string> = {
  ROLE_USER: 'bg-primary-fixed text-primary',
  ROLE_INTERVIEWER: 'bg-secondary-fixed text-secondary-teal',
  ROLE_STAFF: 'bg-surface-container-high text-on-surface-variant',
  ROLE_ADMIN: 'bg-primary-fixed-dim text-primary',
};

/**
 * Trạng thái tài khoản: `PENDING` không phải AccountStatus mà là cờ pendingVerification,
 * `DELETED` chỉ có ở /users/deleted. `status` của BE là enum AccountStatus.
 */
export const STATUS_VN: Record<string, { label: string; chip: string; dot: string }> = {
  ACTIVE: { label: 'Hoạt động', chip: 'bg-secondary-container text-on-secondary-container', dot: 'bg-secondary-teal' },
  INACTIVE: { label: 'Vô hiệu hóa', chip: 'bg-surface-container-high text-on-surface-variant', dot: 'bg-outline-strong' },
  LOCKED: { label: 'Bị khóa', chip: 'bg-error-container text-on-error-container', dot: 'bg-error' },
  PENDING: { label: 'Chờ xác thực', chip: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', dot: 'bg-tertiary' },
  DELETED: { label: 'Đã xóa', chip: 'bg-error-container text-on-error-container', dot: 'bg-error' },
};

/** Danh sách vai trò theo thứ tự mockup (Ứng viên -> Quản trị viên). */
export const ROLE_OPTIONS: { value: Role; label: string }[] = (
  Object.keys(ROLE_VN) as Role[]
).map((value) => ({ value, label: ROLE_VN[value] }));

/** Mô tả vai trò trong modal "Đổi vai trò" (nguyên văn mockup). */
export const ROLE_DESCRIPTION: Record<Role, string> = {
  ROLE_USER: 'Luyện tập phỏng vấn AI, tải hồ sơ và tìm việc',
  ROLE_INTERVIEWER: 'Tạo JD, đánh giá ứng viên và chấm điểm mock-interview',
  ROLE_STAFF: 'Kiểm duyệt JD, xử lý phản ánh và hỗ trợ vận hành hằng ngày',
  ROLE_ADMIN: 'Toàn quyền quản trị hệ thống, dữ liệu và kiểm duyệt JD',
};

export const modalCancelClass =
  'h-10 px-space-lg bg-surface-container-low text-on-surface text-ds-label-lg font-semibold rounded-xl hover:bg-surface-container-high transition-colors border-0 cursor-pointer';
export const modalPrimaryClass =
  'h-10 px-space-lg bg-primary-container text-on-primary text-ds-label-lg font-semibold rounded-xl shadow-sm hover:bg-primary transition-colors border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
export const modalDangerClass =
  'h-10 px-space-lg bg-error text-on-error text-ds-label-lg font-semibold rounded-xl shadow-sm hover:opacity-90 transition-opacity border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

/** Nền modal: phủ toàn màn, đóng khi click vùng nền. */
export const ModalBackdrop: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-[900] bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-space-md"
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    {children}
  </div>
);

export const RoleChip: React.FC<{ role: Role }> = ({ role }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-ds-label-sm font-bold whitespace-nowrap ${ROLE_CHIP[role] ?? 'bg-surface-container-high text-on-surface-variant'}`}>
    <span className={`${ICON} text-[14px]`}>{ROLE_ICON[role] ?? 'shield'}</span>
    {ROLE_VN[role] ?? role}
  </span>
);

export const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const meta = STATUS_VN[status] ?? { label: status, chip: 'bg-surface-container-high text-on-surface-variant', dot: 'bg-outline-strong' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-ds-label-sm font-bold whitespace-nowrap ${meta.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

/**
 * Hành động kiểm toán tiếng Việt — một nguồn cho mọi màn (danh sách, hồ sơ người dùng).
 * Khóa `as const` không cần vì action là string từ BE, có thể thừa giá trị mới -> tra cứu fallback.
 */
export const AUDIT_ACTION_VN: Record<string, string> = {
  VIEW_USER: 'Xem tài khoản', LOCK_USER: 'Khóa tài khoản', UNLOCK_USER: 'Mở khóa tài khoản',
  ENABLE_USER: 'Kích hoạt', DISABLE_USER: 'Vô hiệu hóa', DELETE_USER: 'Xóa tài khoản',
  RESTORE_USER: 'Khôi phục tài khoản', RESET_PASSWORD: 'Gửi mail đặt lại mật khẩu',
  CHANGE_ROLE: 'Đổi vai trò', INVITE_USER: 'Mời thành viên', RESEND_INVITATION: 'Gửi lại lời mời',
  REVOKE_INVITATION: 'Thu hồi lời mời', UPDATE_PROFILE: 'Cập nhật hồ sơ', EXPORT_USERS: 'Xuất CSV',
  APPROVE_JOB: 'Duyệt tin tuyển dụng', REJECT_JOB: 'Từ chối tin tuyển dụng', UPDATE_SETTINGS: 'Cập nhật cấu hình',
};

export const AUDIT_ACTION_ICON: Record<string, string> = {
  VIEW_USER: 'visibility', LOCK_USER: 'lock', UNLOCK_USER: 'lock_open',
  ENABLE_USER: 'check_circle', DISABLE_USER: 'block', DELETE_USER: 'person_off',
  RESTORE_USER: 'restore', RESET_PASSWORD: 'key', CHANGE_ROLE: 'admin_panel_settings',
  INVITE_USER: 'person_add', RESEND_INVITATION: 'forward_to_inbox', REVOKE_INVITATION: 'inventory_2',
  UPDATE_PROFILE: 'edit_note', EXPORT_USERS: 'download',
  APPROVE_JOB: 'fact_check', REJECT_JOB: 'do_disturb', UPDATE_SETTINGS: 'tune',
};

/** Viết tắt tên tiếng Việt theo mockup: chữ cái đầu của họ + tên (Nguyễn...Phương -> NP). */
export const initialsOf = (name: string | null | undefined): string => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  const last = parts[parts.length - 1];
  return `${parts[0][0]}${parts.length > 1 ? last[0] : ''}`.toUpperCase();
};
