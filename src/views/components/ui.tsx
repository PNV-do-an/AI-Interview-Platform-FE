import React from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-surface-low text-ink-variant',
  success: 'bg-success-bg text-success-text',
  warning: 'bg-[#fffbeb] text-[#92400e]',
  danger: 'bg-danger-bg text-danger-text',
  info: 'bg-info text-info-text',
};

export const richTextContentClass = [
  '[&_p]:my-2 [&_div]:my-2 [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-headline-md',
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_li]:my-1 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-surface-low [&_pre]:p-3',
  '[&_pre]:font-mono [&_pre]:text-body-sm [&_code]:font-mono',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-primary-container [&_blockquote]:pl-3 [&_blockquote]:text-ink-variant',
  '[&_a]:text-primary [&_a]:underline',
].join(' ');

export const STATUS_TONE: Record<string, Tone> = {
  ACTIVE: 'success', APPROVED: 'success', PAID: 'success', COMPLETED: 'success', PUBLISHED: 'success', PASSED: 'success', ACCEPTED: 'success', OPEN: 'success',
  PENDING: 'warning', PENDING_APPROVAL: 'warning', SCHEDULED: 'warning', DRAFT: 'neutral', NEW: 'info', PROCESSING: 'info', INTERVIEWED: 'info', PENDING_VERIFICATION: 'warning',
  LOCKED: 'danger',
  REJECTED: 'danger', CANCELLED: 'danger', CLOSED: 'danger', INACTIVE: 'danger', FAILED: 'danger', BANNED: 'danger', DELETED: 'neutral',
};

export const statusTone = (status?: string): Tone => STATUS_TONE[(status || '').toUpperCase()] ?? 'neutral';

/**
 * Badge trạng thái / vai trò.
 * `pill` = viên thuốc bo tròn (mockup dùng riêng cho role + status), `dot` = chấm màu trước nhãn.
 * Không truyền 2 prop này thì giữ hình dạng gốc (pill góc vuông 4px) cho các trang khác.
 */
export const Badge: React.FC<{
  tone?: Tone; children: React.ReactNode; icon?: string; pill?: boolean; dot?: boolean;
}> = ({ tone = 'neutral', children, icon, pill = false, dot = false }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-0.5 text-label-sm font-medium ${pill ? 'rounded-full px-2.5' : 'rounded'} ${TONE_CLASS[tone]}`}
  >
    {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />}
    {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
    {children}
  </span>
);

export const StatusBadge: React.FC<{ status?: string; label?: string }> = ({ status, label }) => (
  <Badge tone={statusTone(status)}>{label ?? status ?? '-'}</Badge>
);

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`rounded-lg border border-[#e2e8f0] bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] ${className}`}>
    {children}
  </div>
);

export const PageHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
}> = ({ title, description, actions }) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div className="flex flex-col gap-1">
      <h1 className="m-0 text-headline-lg text-ink">{title}</h1>
      {description && <p className="m-0 text-body-md text-ink-variant">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Đang tải…' }) => (
  <div className="flex items-center gap-2 py-10 text-body-md text-ink-variant">
    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
    {label}
  </div>
);

export const EmptyState: React.FC<{ icon?: string; title: string; description?: string; action?: React.ReactNode }> = ({
  icon = 'inbox',
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#cbd5e1] bg-card px-6 py-12 text-center">
    <span className="material-symbols-outlined text-[28px] text-ink-variant">{icon}</span>
    <p className="m-0 text-headline-sm text-ink">{title}</p>
    {description && <p className="m-0 text-body-sm text-ink-variant">{description}</p>}
    {action && <div className="pt-2">{action}</div>}
  </div>
);

export const ErrorBanner: React.FC<{ message?: string }> = ({ message }) =>
  !message ? null : (
    <div className="mb-4 flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-body-sm text-danger-text" role="alert">
      <span className="material-symbols-outlined shrink-0 text-[18px]">error</span>
      <span>{message}</span>
    </div>
  );

const BUTTON_TONE: Record<string, string> = {
  primary: 'bg-primary text-on-primary shadow-sm hover:bg-primary-hover active:bg-[#3730a3]',
  secondary: 'border border-[#e2e8f0] bg-card text-ink hover:bg-surface-low',
  ghost: 'bg-transparent text-ink-variant hover:bg-surface-low hover:text-ink',
  danger: 'bg-[#ef4444] text-white hover:bg-[#dc2626]',
};

export const buttonClass = (tone: keyof typeof BUTTON_TONE = 'primary', extra = '') =>
  `inline-flex h-9 items-center justify-center gap-1 rounded-md px-3 text-label-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_TONE[tone]} ${extra}`;

export const inputClass =
  'h-9 w-full box-border rounded-md border border-[#e2e8f0] bg-card px-2.5 text-body-md text-ink transition-all placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]';

export const labelClass = 'mb-1 block text-label-md font-medium text-ink';

export const tableClass = 'w-full border-collapse text-body-md text-ink';
export const thClass =
  'h-8 border-y border-[#e2e8f0] bg-surface-low px-3 text-left text-label-sm uppercase tracking-[0.04em] text-ink-variant';
export const tdClass = 'h-10 border-b border-[#e2e8f0] px-3 align-middle';
