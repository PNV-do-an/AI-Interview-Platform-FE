import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Primitive riêng cho luồng ứng viên (mockup Stitch `stitch_ai_interview_platform (5).zip`,
 * 2026-10-26). Màu + scale chữ dùng đúng token `ds-*` / `surface-container-*` như `adminKit`
 * (cùng DESIGN.md "AI Interview & Career Nexus") — những thứ chung đã ở `adminKit`, file này
 * chỉ giữ phần hình dáng riêng của màn ứng viên: đầu trang có chip trạng thái, vòng điểm,
 * stepper chặng tuyển dụng.
 */

export const CARD = 'rounded-xl bg-surface-container-lowest shadow-sm';
export const SOFT = 'rounded-xl bg-surface-container-low';
export const ICON = 'material-symbols-outlined';

/** Đầu trang ứng viên: breadcrumb + tiêu đề + phụ đề, cụm action phải, chip trạng thái góc phải. */
export const CandidatePageHeader: React.FC<{
  crumbs: { label: string; to?: string }[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  status?: React.ReactNode;
}> = ({ crumbs, title, subtitle, actions, status }) => (
  <div className="flex flex-col gap-space-lg lg:flex-row lg:items-start lg:justify-between">
    <div className="min-w-0 flex-1">
      <nav className="flex flex-wrap items-center gap-space-xs text-ds-label-md text-on-surface-variant">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={`${crumb.label}-${i}`}>
            {i > 0 && <span className={`${ICON} text-outline text-[14px]`}>chevron_right</span>}
            {crumb.to ? (
              <Link to={crumb.to} className="text-on-surface-variant no-underline transition-colors hover:text-primary">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-semibold text-on-surface">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
      <h1 className="mt-2 text-ds-display-sm font-bold tracking-tight text-on-surface">{title}</h1>
      {subtitle && <p className="mt-1 max-w-3xl text-ds-body-md text-on-surface-variant">{subtitle}</p>}
    </div>
    {(actions || status) && (
      <div className="flex shrink-0 flex-col items-start gap-space-sm lg:items-end">
        {status}
        {actions && <div className="flex flex-wrap items-center gap-space-sm">{actions}</div>}
      </div>
    )}
  </div>
);

/** Chip trạng thái góc phải đầu trang (dot nhấp nháy + chữ), dạng pill nền `surface-container-high`. */
export const StatusChip: React.FC<{ label: string; tone?: 'teal' | 'primary' | 'error' }> = ({
  label,
  tone = 'teal',
}) => {
  const dot = tone === 'teal' ? 'bg-secondary-teal' : tone === 'primary' ? 'bg-primary' : 'bg-error';
  return (
    <span className="flex items-center gap-space-xs rounded-full bg-surface-container-high px-space-md py-1">
      <span className={`h-2 w-2 shrink-0 animate-pulse rounded-full ${dot}`} />
      <span className="text-ds-label-sm text-on-surface">{label}</span>
    </span>
  );
};

/**
 * Vòng điểm: `value`/`max` là số thật từ API, `label`/`caption` là nhãn dẫn xuất.
 * SVG là giá trị động thật (bán kính + dasharray) nên giữ inline style.
 */
export const ScoreRing: React.FC<{
  value: number;
  max?: number;
  caption?: string;
  foot?: React.ReactNode;
  size?: number;
}> = ({ value, max = 100, caption, foot, size = 168 }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const r = 62;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-surface-container-high" />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * pct) / 100}
            className="text-primary"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-ds-display-sm font-bold leading-none text-on-surface tabular-nums">{value}</span>
          <span className="text-ds-label-sm text-on-surface-variant">/{max}</span>
          {caption && <span className="mt-1 text-ds-label-md font-bold text-primary">{caption}</span>}
        </div>
      </div>
      {foot}
    </div>
  );
};

export interface Step {
  label: string;
  /** Nhãn phụ dưới mỗi chặng (ngày, kết quả) — dẫn xuất từ field thật. */
  meta?: string;
  state: 'done' | 'current' | 'todo' | 'failed';
}

const STEP_BAR: Record<Step['state'], string> = {
  done: 'bg-secondary-teal',
  current: 'bg-primary',
  todo: 'bg-surface-container-highest',
  failed: 'bg-error',
};
const STEP_TEXT: Record<Step['state'], string> = {
  done: 'text-on-surface-variant',
  current: 'text-primary font-bold',
  todo: 'text-outline',
  failed: 'text-error font-bold',
};

/** Stepper chặng tuyển dụng (dải ngang bo tròn, đúng hình dáng mockup). */
export const Stepper: React.FC<{ steps: Step[]; columns?: number }> = ({ steps, columns }) => (
  <div
    className="grid items-center gap-2 pt-space-xs text-center"
    style={{ gridTemplateColumns: `repeat(${columns ?? steps.length}, minmax(0, 1fr))` }}
  >
    {steps.map((s) => (
      <div key={s.label} className="flex flex-col items-center gap-1">
        <div className={`h-1.5 w-full rounded-full ${STEP_BAR[s.state]}`} />
        <span className={`text-ds-label-sm ${STEP_TEXT[s.state]}`}>{s.label}</span>
        {s.meta && <span className="text-ds-body-sm text-outline">{s.meta}</span>}
      </div>
    ))}
  </div>
);

/**
 * Card chỉ số ở đầu màn ứng viên (dải 4 ô). `demo` = card giữ số nguyên văn mockup vì
 * chưa có nguồn số -> dán nhãn ngay dưới nhãn card (không dùng `Pill` inline ở header vì
 * `whitespace-nowrap` làm vỡ header ở card hẹp — bài học wave admin 23/10).
 */
export const CandidateStat: React.FC<{
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon: string;
  tone?: 'primary' | 'teal' | 'tertiary' | 'neutral';
  sub?: React.ReactNode;
  barPct?: number;
  demo?: string;
}> = ({ label, value, unit, icon, tone = 'primary', sub, barPct, demo }) => {
  const chip: Record<string, string> = {
    primary: 'bg-primary-fixed text-primary',
    teal: 'bg-secondary-container/40 text-secondary-teal',
    tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    neutral: 'bg-surface-container-high text-on-surface',
  };
  const bar: Record<string, string> = {
    primary: 'bg-primary',
    teal: 'bg-secondary-teal',
    tertiary: 'bg-tertiary',
    neutral: 'bg-primary-container',
  };
  return (
    <div className={`${CARD} flex flex-col justify-between gap-2 p-space-lg transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-ds-label-md text-on-surface-variant">{label}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${chip[tone]}`}>
          <span className={`${ICON} text-[18px]`}>{icon}</span>
        </span>
      </div>
      {demo && <span className="text-ds-label-sm font-bold text-on-surface-variant">Khối demo — {demo}</span>}
      <div className="flex items-baseline gap-1">
        <span className="text-ds-display-sm font-bold tracking-tight text-on-surface tabular-nums">{value}</span>
        {unit && <span className="text-ds-label-md text-on-surface-variant">{unit}</span>}
      </div>
      {sub && <div className="flex flex-wrap items-center gap-1 text-ds-label-sm">{sub}</div>}
      {typeof barPct === 'number' && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
          <div className={`h-full rounded-full ${bar[tone]}`} style={{ width: `${Math.max(0, Math.min(100, barPct))}%` }} />
        </div>
      )}
    </div>
  );
};
